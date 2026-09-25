const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')

// GET /api/notifications - get notifications for a user
router.get('/', notificationController.getNotifications)

// PUT /api/notifications/:id/read - mark persistent notification as read
router.put('/:id/read', notificationController.markAsRead)

module.exports = router
