const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

// GET all users (Admin only)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET single user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update profile (name, email, phone, optional password)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    // If email is changing, check it's not already taken by another user
    if (email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.params.id])
      if (existing.length > 0) {
        return res.status(409).json({ error: 'This email is already in use by another account.' })
      }
    }

    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET name=?, email=?, phone=?, password=? WHERE id=?', [name, email || null, phone || null, hashed, req.params.id])
    } else {
      await pool.query('UPDATE users SET name=?, email=?, phone=? WHERE id=?', [name, email || null, phone || null, req.params.id])
    }
    const [rows] = await pool.query('SELECT id, name, email, phone, role, status FROM users WHERE id=?', [req.params.id])
    res.json({ message: 'Profile updated', user: rows[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update role (Admin only)
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body

    // Enforce single IT Manager rule: if setting role to IT Manager, demote any existing IT Manager to Employee
    if (role === 'IT Manager') {
      await pool.query("UPDATE users SET role='Employee' WHERE role='IT Manager' AND id != ?", [req.params.id])
    }

    await pool.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id])
    res.json({ message: 'Role updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update status (Admin only)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE users SET status=? WHERE id=?', [status, req.params.id])
    res.json({ message: 'Status updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
