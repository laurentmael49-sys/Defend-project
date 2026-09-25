const express = require('express')
const router = express.Router()
const requestController = require('../controllers/requestController')

// GET /api/requests - all requests or filtered by user_id
router.get('/', requestController.getRequests)

// POST /api/requests - submit a new loan request
router.post('/', requestController.createRequest)

// PUT /api/requests/:id - approve or reject loan request
router.put('/:id', requestController.updateRequestStatus)

module.exports = router
