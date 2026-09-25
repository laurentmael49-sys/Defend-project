const { pool } = require('../config/db')

const NotificationModel = {
  // Ensure user_notifications table exists
  async initNotificationsTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read TINYINT(1) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)
    } catch (err) {
      console.error('[NotificationModel] Table init error:', err.message)
    }
  },

  // Get active loans for date calculations (due today, overdue, upcoming)
  async getActiveLoansForUser(userId) {
    const query = `
      SELECT l.*, a.name as asset_name, u.name as user_name 
      FROM loans l 
      JOIN assets a ON l.asset_id = a.id 
      JOIN users u ON l.user_id = u.id 
      WHERE l.returned = false AND l.end_date IS NOT NULL AND l.user_id = ?
    `
    const [rows] = await pool.query(query, [userId])
    return rows
  },

  // Get unread persistent notifications for a user
  async getPersistentNotifications(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM user_notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
      [userId]
    )
    return rows
  },

  // Create a single notification
  async createNotification(userId, message, type = 'info') {
    const [result] = await pool.query(
      'INSERT INTO user_notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, message, type]
    )
    return result.insertId
  },

  // Create bulk notifications (e.g. notify all admins/managers)
  async createBulkNotifications(values) {
    if (!values || values.length === 0) return
    const [result] = await pool.query(
      'INSERT INTO user_notifications (user_id, message, type) VALUES ?',
      [values]
    )
    return result
  },

  // Mark notification as read
  async markAsRead(id) {
    const [result] = await pool.query('UPDATE user_notifications SET is_read = 1 WHERE id = ?', [id])
    return result
  }
}

// Initialize notifications table
NotificationModel.initNotificationsTable()

module.exports = NotificationModel
