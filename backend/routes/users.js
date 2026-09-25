const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

// GET /api/users - all users (Admin only)
router.get('/', userController.getUsers)

// GET /api/users/:id - get single user by ID
router.get('/:id', userController.getUserById)

// PUT /api/users/:id - update profile
router.put('/:id', userController.updateProfile)

// PUT /api/users/:id/role - update role (Admin only)
router.put('/:id/role', userController.updateRole)

// PUT /api/users/:id/status - update status (Admin only)
router.put('/:id/status', userController.updateStatus)

module.exports = router
