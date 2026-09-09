const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// POST /api/auth/register
const register = async (req, res) => {
  const { first_name, last_name, email, password, phone, department, role } = req.body

  if (!first_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide first name, email, password and role.' })
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    // Hash the password
    const password_hash = await bcrypt.hash(password, 10)

    const name = [first_name, last_name].filter(Boolean).join(' ')

    // The users table uses id, name, password, role and status columns.
    // Department is collected by the form but is not part of that table.
    // Employee → Active immediately. IT Manager → Pending until Admin approves.
    const requestedRole = (role === 'IT Manager') ? 'IT Manager' : 'Employee'
    const initialStatus  = (requestedRole === 'IT Manager') ? 'Pending' : 'Active'

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password_hash, phone || null, requestedRole, initialStatus]
    )

    res.status(201).json({
      message: requestedRole === 'IT Manager'
        ? 'IT Manager account submitted. Awaiting Admin approval.'
        : 'Account created successfully! Please log in.',
      userId: result.insertId
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
    const [rows] = await pool.query(
      'SELECT id, name, email, password, phone, role, status FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const user = rows[0]

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
