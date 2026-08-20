require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDB } = require('./config/db')

// Route imports
const authRoutes = require('./routes/auth')
const assetRoutes = require('./routes/assets')
const requestRoutes = require('./routes/requests')
const loanRoutes = require('./routes/loans')
const userRoutes = require('./routes/users')
const categoryRoutes = require('./routes/categories')
const notificationRoutes = require('./routes/notifications')
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to XAMPP MySQL
connectDB()

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Defend Server is running', status: 'ok' })
})

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)        // POST /api/auth/register, /api/auth/login
app.use('/api/assets', assetRoutes)     // CRUD for assets
app.use('/api/requests', requestRoutes) // CRUD for loan requests
app.use('/api/loans', loanRoutes)       // CRUD for active loans
app.use('/api/users', userRoutes)       // User management (Admin)
app.use('/api/categories', categoryRoutes) // Category management
app.use('/api/notifications', notificationRoutes) // Dynamic alerts
// Audit log route (nested under admin)
const { pool } = require('./config/db')
app.get('/api/audit', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC LIMIT 100
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Backup route
app.get('/api/backup', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users')
    const [assets] = await pool.query('SELECT * FROM assets')
    const [loans] = await pool.query('SELECT * FROM loans')
    const [requests] = await pool.query('SELECT * FROM requests')
    const [categories] = await pool.query('SELECT * FROM categories')
    const [audit_logs] = await pool.query('SELECT * FROM audit_logs')

    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.query.user_id || null, 'System Backup', 'Database backup downloaded']
    )

    res.json({ timestamp: new Date().toISOString(), users, assets, loans, requests, categories, audit_logs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
