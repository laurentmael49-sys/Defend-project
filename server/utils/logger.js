const fs = require('fs')
const path = require('path')

const logsDir = path.join(__dirname, '..', 'logs')
const logFilePath = path.join(logsDir, 'ai-errors.log')

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

/**
 * Logs an AI error to server/logs/ai-errors.log
 * Format: [timestamp] [userId] [error type] [message] [stack]
 * @param {Object} options - { userId, errorType, message, stack }
 */
const logAiError = ({ userId = 'N/A', errorType = 'Error', message = '', stack = '' }) => {
  try {
    const timestamp = new Date().toISOString()
    const cleanStack = (stack || '').replace(/\n/g, ' \\n ')
    const logLine = `[${timestamp}] [userId:${userId}] [${errorType}] ${message} ${cleanStack ? '| stack: ' + cleanStack : ''}\n`

    fs.appendFileSync(logFilePath, logLine, 'utf8')
    cleanOldLogs()
  } catch (err) {
    console.error('Failed to write to ai-errors.log:', err.message)
  }
}

/**
 * Cleans up log files older than 30 days in the logs directory.
 */
const cleanOldLogs = () => {
  try {
    const files = fs.readdirSync(logsDir)
    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    files.forEach(file => {
      const filePath = path.join(logsDir, file)
      const stats = fs.statSync(filePath)
      if (now - stats.mtimeMs > thirtyDaysMs) {
        fs.unlinkSync(filePath)
        console.log(`[LOG CLEANUP] Removed old log file: ${file}`)
      }
    })
  } catch (e) {
    // Ignore cleanup errors
  }
}

module.exports = { logAiError }
