const OpenAI = require('openai')
const { pool } = require('../config/db')
const { aiCircuitBreaker } = require('../utils/circuitBreaker')
const { logAiError } = require('../utils/logger')
const AuditModel = require('../models/AuditModel')

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// In-memory sliding window rate limiter by userId
const rateLimitMap = new Map()

const checkRateLimit = (userId) => {
  const maxLimit = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR, 10) || 20
  const windowMs = 60 * 60 * 1000 // 1 hour window
  const now = Date.now()

  let userTimestamps = rateLimitMap.get(userId) || []
  userTimestamps = userTimestamps.filter(t => now - t < windowMs)

  if (userTimestamps.length >= maxLimit) {
    return { allowed: false, count: userTimestamps.length, limit: maxLimit }
  }

  userTimestamps.push(now)
  rateLimitMap.set(userId, userTimestamps)
  return { allowed: true, count: userTimestamps.length, limit: maxLimit }
}

// OpenRouter Health Cache (60 seconds)
let healthCache = { status: 'ok', lastCheck: 0 }

// Helper function to invoke model completion with explicit timeout
async function callOpenRouterWithTimeout(model, messages, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await openai.chat.completions.create(
      {
        model,
        messages,
        max_tokens: 1000,
      },
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

const aiController = {
  // GET /api/ai/health
  async getHealth(req, res) {
    const now = Date.now()
    const circuitState = aiCircuitBreaker.getState()

    let status = 'ok'
    if (circuitState === 'half-open') status = 'degraded'
    if (circuitState === 'open') status = 'down'

    // If status is ok, periodically check OpenRouter connectivity (cached for 60s)
    if (status === 'ok' && now - healthCache.lastCheck > 60000) {
      try {
        const pingRes = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        })
        if (!pingRes.ok) status = 'degraded'
        healthCache = { status, lastCheck: now }
      } catch (e) {
        status = 'degraded'
        healthCache = { status, lastCheck: now }
      }
    }

    res.json({
      status,
      circuit: circuitState,
      lastCheck: new Date().toISOString()
    })
  },

  // POST /api/ai/chat
  async chat(req, res) {
    const userId = req.user?.id || null
    const userRole = req.user?.role || 'Employee'
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'

    try {
      const { message, context } = req.body

      // 1. Validation
      if (!message || typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 500) {
        return res.status(400).json({ error: 'Validation Error: Message must be a non-empty string between 1 and 500 characters.' })
      }

      if (!context || typeof context !== 'object' || Array.isArray(context)) {
        return res.status(400).json({ error: 'Validation Error: Context must be a valid JSON object.' })
      }

      // 2. Circuit Breaker Check
      if (!aiCircuitBreaker.canExecute()) {
        logAiError({
          userId,
          errorType: 'CircuitBreakerOpen',
          message: 'Request rejected instantly because circuit breaker is OPEN.'
        })
        return res.status(503).json({
          error: 'AI service is currently unavailable. Please try again later.',
          circuit: 'open'
        })
      }

      // 3. Rate Limiting per userId
      const rateCheck = checkRateLimit(userId)
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: `Rate limit exceeded. Maximum ${rateCheck.limit} messages per hour allowed per user.`
        })
      }

      // 4. Build system prompt server-side
      const systemPrompt = `You are an AI assistant for an IT Asset and Loan Management system.
You are speaking with a user whose ID is ${userId} and role is ${userRole}.

Here is the current data you have access to:
${JSON.stringify(context, null, 2)}

Rules:
- If the user is an admin, you may discuss any asset, loan, or user data provided.
- If the user is a regular user, you may ONLY discuss their own assets, their own loans, and general help topics.
- If a regular user asks about another user's data, respond: 'I can only help you with your own assets and loans.'
- Never reveal internal IDs, other users' names, or admin-only data to a regular user.
- Answer ONLY based on the data provided above.
- If the answer is not in the data, say: 'I don't have that information available.'
- Never invent asset names, loan IDs, dates, or amounts.
- Be concise and use bullet points for lists.`

      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() }
      ]

      const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 30000
      const primaryModel = process.env.AI_PRIMARY_MODEL || 'google/gemini-2.0-flash-001'
      const fallbackModel = process.env.AI_FALLBACK_MODEL || 'openai/gpt-4o-mini'

      let response
      let usedModel = primaryModel

      try {
        response = await callOpenRouterWithTimeout(primaryModel, messagesPayload, timeoutMs)
      } catch (primaryErr) {
        console.warn(`[AI RETRY] Primary model (${primaryModel}) failed (${primaryErr.message}). Retrying once with fallback model (${fallbackModel})...`)

        logAiError({
          userId,
          errorType: 'PrimaryModelFailure',
          message: primaryErr.message,
          stack: primaryErr.stack
        })

        try {
          usedModel = fallbackModel
          response = await callOpenRouterWithTimeout(fallbackModel, messagesPayload, timeoutMs)
        } catch (fallbackErr) {
          aiCircuitBreaker.recordFailure()

          logAiError({
            userId,
            errorType: 'AI_Service_Failure',
            message: `Primary (${primaryModel}) and Fallback (${fallbackModel}) both failed.`,
            stack: fallbackErr.stack
          })

          await AuditModel.createAiAuditLog({
            userId,
            userRole,
            userMessage: message.trim(),
            aiReply: `503 Error: ${fallbackErr.message}`,
            model: fallbackModel,
            ipAddress: clientIp,
            success: 0
          })

          return res.status(503).json({ error: 'AI is taking too long. Please try again.' })
        }
      }

      aiCircuitBreaker.recordSuccess()

      const reply = response.choices?.[0]?.message?.content || 'No response generated from AI.'
      const prompt_tokens = response.usage?.prompt_tokens || 0
      const completion_tokens = response.usage?.completion_tokens || 0

      await AuditModel.createAiAuditLog({
        userId,
        userRole,
        userMessage: message.trim(),
        aiReply: reply,
        promptTokens: prompt_tokens,
        completionTokens: completion_tokens,
        model: usedModel,
        ipAddress: clientIp,
        success: 1
      })

      console.log(`[AI CHAT LOG] User ID: ${userId} | Model: ${usedModel} | Time: ${new Date().toISOString()} | Tokens: ${prompt_tokens + completion_tokens}`)

      return res.json({
        reply,
        usage: {
          prompt_tokens,
          completion_tokens
        },
        model: usedModel
      })

    } catch (err) {
      aiCircuitBreaker.recordFailure()
      logAiError({
        userId,
        errorType: 'UnhandledAiError',
        message: err.message,
        stack: err.stack
      })
      console.error('AI Route Exception:', err.message)
      return res.status(503).json({ error: 'AI is taking too long. Please try again.' })
    }
  },

  // POST /api/ai/simulate-failure
  simulateFailure(req, res) {
    const { action } = req.body
    if (action === 'trigger-failures') {
      for (let i = 0; i < 5; i++) {
        aiCircuitBreaker.recordFailure()
      }
      return res.json({ message: 'Triggered 5 failures. Circuit is now OPEN.', circuit: aiCircuitBreaker.getState() })
    }
    if (action === 'reset') {
      aiCircuitBreaker.recordSuccess()
      return res.json({ message: 'Circuit breaker reset to CLOSED.', circuit: aiCircuitBreaker.getState() })
    }
    res.status(400).json({ error: 'Invalid action. Use "trigger-failures" or "reset".' })
  },

  // GET /api/ai/audit-log
  async getAuditLog(req, res) {
    try {
      const userRole = (req.user?.role || '').toLowerCase()
      if (userRole !== 'admin' && userRole !== 'it manager') {
        return res.status(403).json({ error: 'Forbidden: Admin or IT Manager access required.' })
      }

      const page = parseInt(req.query.page, 10) || 1
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 100)
      const offset = (page - 1) * limit

      const [rows] = await pool.query(
        `SELECT l.id, l.user_id, l.user_role, l.created_at, l.user_message, l.ai_reply,
                l.prompt_tokens, l.completion_tokens, l.model, l.ip_address, l.success,
                u.name as user_name, u.email as user_email
         FROM ai_audit_logs l
         LEFT JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      )

      const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ai_audit_logs')

      res.json({
        logs: rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      })
    } catch (err) {
      console.error('Audit log fetch error:', err)
      res.status(500).json({ error: err.message })
    }
  },

  // GET /api/ai/audit-log/export-csv
  async exportCsv(req, res) {
    try {
      const userRole = (req.user?.role || '').toLowerCase()
      if (userRole !== 'admin' && userRole !== 'it manager') {
        return res.status(403).json({ error: 'Forbidden: Admin or IT Manager access required.' })
      }

      const [rows] = await pool.query(
        `SELECT l.id, l.user_id, u.name as user_name, u.email as user_email, l.user_role,
                l.created_at, l.user_message, l.ai_reply, l.prompt_tokens, l.completion_tokens,
                l.model, l.ip_address, l.success
         FROM ai_audit_logs l
         LEFT JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC`
      )

      const escapeCsv = (str) => {
        if (str === null || str === undefined) return '""'
        const stringified = String(str).replace(/"/g, '""')
        return `"${stringified}"`
      }

      const headers = ['ID', 'User ID', 'User Name', 'User Email', 'Role', 'Timestamp', 'User Message', 'AI Reply', 'Prompt Tokens', 'Completion Tokens', 'Model', 'IP Address', 'Success']
      let csvStr = headers.join(',') + '\n'

      rows.forEach(r => {
        const line = [
          r.id,
          r.user_id || 'N/A',
          escapeCsv(r.user_name || 'Guest'),
          escapeCsv(r.user_email || 'N/A'),
          escapeCsv(r.user_role),
          escapeCsv(r.created_at ? new Date(r.created_at).toISOString() : ''),
          escapeCsv(r.user_message),
          escapeCsv(r.ai_reply),
          r.prompt_tokens,
          r.completion_tokens,
          escapeCsv(r.model),
          escapeCsv(r.ip_address),
          r.success ? 'TRUE' : 'FALSE'
        ]
        csvStr += line.join(',') + '\n'
      })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="ai_audit_logs.csv"')
      res.status(200).send(csvStr)
    } catch (err) {
      console.error('CSV export error:', err)
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = aiController
