const { pool } = require('../config/db')

const AuditModel = {
  // Ensure ai_audit_logs table exists
  async initAiAuditTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          user_role VARCHAR(50) DEFAULT 'Employee',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_message TEXT NOT NULL,
          ai_reply TEXT NOT NULL,
          prompt_tokens INT DEFAULT 0,
          completion_tokens INT DEFAULT 0,
          model VARCHAR(100) DEFAULT 'google/gemini-2.0-flash-001',
          ip_address VARCHAR(100),
          success TINYINT(1) DEFAULT 1
        )
      `)
    } catch (err) {
      console.error('[AuditModel] Failed to initialize ai_audit_logs table:', err.message)
    }
  },

  // Get system audit logs
  async getAuditLogs(limit = 100) {
    const [rows] = await pool.query(`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM audit_logs l 
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC 
      LIMIT ?
    `, [Number(limit) || 100])
    return rows
  },

  // Create an audit log entry
  async createLog(userId, action, details) {
    try {
      const [result] = await pool.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId || null, action, details]
      )
      return result.insertId
    } catch (err) {
      console.error('[AuditModel] Failed to write audit log:', err.message)
      return null
    }
  },

  // Get AI assistant audit logs
  async getAiAuditLogs(limit = 50) {
    const [rows] = await pool.query(
      'SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT ?',
      [Number(limit) || 50]
    )
    return rows
  },

  // Create an AI audit log entry
  async createAiAuditLog({
    userId,
    userRole,
    userMessage,
    aiReply,
    promptTokens = 0,
    completionTokens = 0,
    model = 'google/gemini-2.5-flash',
    ipAddress = null,
    success = 1
  }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO ai_audit_logs 
         (user_id, user_role, user_message, ai_reply, prompt_tokens, completion_tokens, model, ip_address, success)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId || null,
          userRole || 'Employee',
          userMessage,
          aiReply,
          promptTokens,
          completionTokens,
          model,
          ipAddress,
          success
        ]
      )
      return result.insertId
    } catch (err) {
      console.error('[AuditModel] Failed to log AI interaction:', err.message)
      return null
    }
  },

  // Retrieve complete database snapshot for backup
  async getAllDataForBackup() {
    const [users] = await pool.query('SELECT * FROM users')
    const [assets] = await pool.query('SELECT * FROM assets')
    const [loans] = await pool.query('SELECT * FROM loans')
    const [requests] = await pool.query('SELECT * FROM requests')
    const [categories] = await pool.query('SELECT * FROM categories')
    const [audit_logs] = await pool.query('SELECT * FROM audit_logs')

    return {
      users,
      assets,
      loans,
      requests,
      categories,
      audit_logs
    }
  }
}

// Initialize AI audit table
AuditModel.initAiAuditTable()

module.exports = AuditModel
