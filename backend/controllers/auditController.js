const AuditModel = require('../models/AuditModel')

const auditController = {
  // GET /api/audit
  async getAuditLogs(req, res) {
    try {
      const rows = await AuditModel.getAuditLogs(100)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // GET /api/backup
  async getBackup(req, res) {
    try {
      const backupData = await AuditModel.getAllDataForBackup()

      await AuditModel.createLog(
        req.query.user_id || null,
        'System Backup',
        'Database backup downloaded'
      )

      res.json({
        timestamp: new Date().toISOString(),
        ...backupData
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = auditController
