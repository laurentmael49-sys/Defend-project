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
const aiRoutes = require('./routes/ai')
const auditController = require('./controllers/auditController')
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
app.use('/api/ai', aiRoutes)            // AI Assistant API
// Audit and Backup routes
app.get('/api/audit', auditController.getAuditLogs)
app.get('/api/backup', auditController.getBackup)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
