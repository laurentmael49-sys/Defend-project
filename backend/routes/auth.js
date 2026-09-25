const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/authController')

// POST /api/auth/register  → Creates a new user in XAMPP MySQL
router.post('/register', register)

// POST /api/auth/login     → Authenticates user and returns JWT + role
router.post('/login', login)

module.exports = router
