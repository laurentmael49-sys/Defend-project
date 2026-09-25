const express = require('express')
const router = express.Router()
const loanController = require('../controllers/loanController')
const { authenticateToken } = require('../middleware/auth')

// GET /api/loans - all loans or filtered by user_id
router.get('/', loanController.getLoans)

// GET /api/loans/pending-returns - pending return requests (Admin / IT Manager)
router.get('/pending-returns', authenticateToken, loanController.getPendingReturns)

// POST /api/loans - create new loan
router.post('/', loanController.createLoan)

// PATCH /api/loans/:id/request-return - employee requests return
router.patch('/:id/request-return', authenticateToken, loanController.requestReturn)

// PUT /api/loans/:id - process and approve return
router.put('/:id', loanController.processReturn)

module.exports = router
