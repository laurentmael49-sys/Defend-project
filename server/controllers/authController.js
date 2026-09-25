const UserModel = require('../models/UserModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// POST /api/auth/register
const register = async (req, res) => {
  const { first_name, last_name, email, password, phone, role } = req.body

  if (!first_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide first name, email, password and role.' })
  }

  try {
    // Check if email already exists
    const existing = await UserModel.findByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10)
    const name = [first_name, last_name].filter(Boolean).join(' ')

    // Employee → Active immediately. IT Manager → Pending until Admin approves.
    const requestedRole = (role === 'IT Manager') ? 'IT Manager' : 'Employee'
    const initialStatus = (requestedRole === 'IT Manager') ? 'Pending' : 'Active'

    const userId = await UserModel.create({
      name,
      email,
      password: password_hash,
      phone: phone || null,
      role: requestedRole,
      status: initialStatus
    })

    res.status(201).json({
      message: requestedRole === 'IT Manager'
        ? 'IT Manager account submitted. Awaiting Admin approval.'
        : 'Account created successfully! Please log in.',
      userId
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
}

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  try {
    const user = await UserModel.findByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    if (String(user.status).toLowerCase() === 'pending') {
      return res.status(403).json({ error: 'Your IT Manager account is awaiting Admin approval. Please contact the System Admin.' })
    }

    if (String(user.status).toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact an admin.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'defend_super_secret_key_2026',
      { expiresIn: '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
}

module.exports = { register, login }
