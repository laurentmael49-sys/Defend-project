const NotificationModel = require('../models/NotificationModel')

const notificationController = {
  // GET notifications for a user
  async getNotifications(req, res) {
    try {
      const { user_id, role } = req.query
      if (!user_id || !role) {
        return res.status(400).json({ error: 'Missing user_id or role' })
      }

      // 1. Fetch active loans to calculate status badges (overdue, due today, upcoming)
      const loans = await NotificationModel.getActiveLoansForUser(user_id)
      const notifications = []
      const now = new Date()

      loans.forEach(loan => {
        const endDate = new Date(loan.end_date)
        const diffTime = endDate - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 2) {
          let type, message
          if (diffDays < 0) {
            type = 'overdue'
            message = `OVERDUE: Your loan for ${loan.asset_name} was due ${Math.abs(diffDays)} days ago!`
          } else if (diffDays === 0) {
            type = 'due_today'
            message = `DUE TODAY: Please return ${loan.asset_name} today.`
          } else {
            type = 'upcoming'
            message = `REMINDER: Your loan for ${loan.asset_name} is due in ${diffDays} days.`
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

      // 2. Fetch persistent database notifications for user
      const persistentNotifs = await NotificationModel.getPersistentNotifications(user_id)

      persistentNotifs.forEach(pn => {
        notifications.push({
          id: `db_${pn.id}`,
          db_id: pn.id,
          loan_id: null,
          type: pn.type,
          message: pn.message,
          asset_name: null,
          diffDays: -999 // High priority for sorting
        })
      })

      // Sort: high priority first (persistent), then overdue, due today, upcoming
      notifications.sort((a, b) => a.diffDays - b.diffDays)

      res.json(notifications)
    } catch (err) {
      console.error('Notification error:', err)
      res.status(500).json({ error: err.message })
    }
  },

  // PUT mark persistent notification as read
  async markAsRead(req, res) {
    try {
      const id = req.params.id.replace('db_', '')
      await NotificationModel.markAsRead(id)
      res.json({ message: 'Notification marked as read' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = notificationController
