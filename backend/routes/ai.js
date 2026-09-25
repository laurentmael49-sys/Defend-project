const express = require('express')
const router = express.Router()
const aiController = require('../controllers/aiController')
const { authenticateToken } = require('../middleware/auth')

// GET /api/ai/health - check AI service health
router.get('/health', aiController.getHealth)

// POST /api/ai/chat - send message to AI assistant
router.post('/chat', authenticateToken, aiController.chat)

// POST /api/ai/simulate-failure - dev endpoint for circuit breaker testing
router.post('/simulate-failure', aiController.simulateFailure)

// GET /api/ai/audit-log - get AI audit logs (Admin/IT Manager only)
router.get('/audit-log', authenticateToken, aiController.getAuditLog)

// GET /api/ai/audit-log/export-csv - export AI audit logs to CSV
router.get('/audit-log/export-csv', authenticateToken, aiController.exportCsv)

module.exports = router
