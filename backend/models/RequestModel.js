const { pool } = require('../config/db')

const RequestModel = {
  // Find all requests (optionally filtered by user_id)
  async findAll(userId = null) {
    let query = `
      SELECT r.*, a.name as asset_name, u.name as user_name 
      FROM requests r 
      JOIN assets a ON r.asset_id=a.id 
      JOIN users u ON r.user_id=u.id
    `
    const params = []
    if (userId) {
      query += ' WHERE r.user_id = ?'
      params.push(userId)
    }
    query += ' ORDER BY r.created_at DESC'
    const [rows] = await pool.query(query, params)
    return rows
  },

  // Find single request by ID with asset details
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, a.name as asset_name 
       FROM requests r 
       JOIN assets a ON r.asset_id=a.id 
       WHERE r.id = ?`,
      [id]
    )
    return rows[0] || null
  },

  // Create a new loan request
  async create({ user_id, asset_id, start_date, end_date, reason }) {
    const [result] = await pool.query(
      'INSERT INTO requests (user_id, asset_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [user_id, asset_id, start_date, end_date, reason]
    )
    return result.insertId
  },

  // Update request status (Approved, Rejected, etc.)
  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE requests SET status=? WHERE id=?', [status, id])
    return result
  }
}

module.exports = RequestModel
