const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

router.get('/', async (req, res) => {
  try {
    const { user_id, role } = req.query
    if (!user_id || !role) {
      return res.status(400).json({ error: 'Missing user_id or role' })
    }

    // Determine query based on role
    let query = `SELECT l.*, a.name as asset_name, u.name as user_name 
                 FROM loans l 
                 JOIN assets a ON l.asset_id = a.id 
                 JOIN users u ON l.user_id = u.id 
                 WHERE l.returned = false AND l.end_date IS NOT NULL`
    const params = []

    if (role === 'Employee') {
      query += ` AND l.user_id = ?`
      params.push(user_id)
    }

    const [loans] = await pool.query(query, params)
    const notifications = []
    const now = new Date()

    loans.forEach(loan => {
      const endDate = new Date(loan.end_date)
      // Calculate days difference
      const diffTime = endDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 2) {
        let type, message;
        if (diffDays < 0) {
          type = 'overdue'
          message = role === 'Employee' 
            ? `OVERDUE: Your loan for ${loan.asset_name} was due ${Math.abs(diffDays)} days ago!`
            : `OVERDUE: ${loan.user_name} has not returned ${loan.asset_name}.`
        } else if (diffDays === 0) {
          type = 'due_today'
          message = role === 'Employee'
            ? `DUE TODAY: Please return ${loan.asset_name} today.`
            : `DUE TODAY: ${loan.user_name} must return ${loan.asset_name} today.`
        } else {
          type = 'upcoming'
          message = role === 'Employee'
            ? `REMINDER: Your loan for ${loan.asset_name} is due in ${diffDays} days.`
            : `REMINDER: ${loan.user_name} is scheduled to return ${loan.asset_name} in ${diffDays} days.`
        }

        notifications.push({
          id: `loan_${loan.id}_${type}`,
          loan_id: loan.id,
          type,
          message,
          asset_name: loan.asset_name,
          diffDays
        })
      }
    })

    // Sort notifications: overdue first, then due today, then upcoming
    notifications.sort((a, b) => a.diffDays - b.diffDays)

    res.json(notifications)
  } catch (err) {
    console.error('Notification error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
