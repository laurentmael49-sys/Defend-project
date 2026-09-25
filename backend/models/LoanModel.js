const { pool } = require('../config/db')

const LoanModel = {
  // Ensure return_requested columns exist on table
  async initReturnColumns() {
    try {
      await pool.query(`
        ALTER TABLE loans
          ADD COLUMN IF NOT EXISTS return_requested TINYINT(1) NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS return_requested_at DATETIME NULL
      `)
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.error('[LoanModel] Migration warning:', err.message)
      }
    }
  },

  // Find all loans (optionally filtered by user_id)
  async findAll(userId = null) {
    let query = `
      SELECT l.*, a.name as asset_name, a.category, u.name as user_name
      FROM loans l 
      JOIN assets a ON l.asset_id=a.id 
      JOIN users u ON l.user_id=u.id
    `
    const params = []
    if (userId) {
      query += ' WHERE l.user_id = ?'
      params.push(userId)
    }
    query += ' ORDER BY l.start_date DESC'
    const [rows] = await pool.query(query, params)
    return rows
  },

  // Find single loan by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM loans WHERE id = ?', [id])
    return rows[0] || null
  },

  // Find pending returns for Admin & IT Managers
  async findPendingReturns() {
    const [rows] = await pool.query(`
      SELECT l.*, a.name as asset_name, a.category, u.name as user_name, u.email as user_email
      FROM loans l
      JOIN assets a ON l.asset_id = a.id
      JOIN users u ON l.user_id = u.id
      WHERE l.return_requested = 1 AND l.returned = 0
      ORDER BY l.return_requested_at ASC
    `)
    return rows
  },

  // Create a new loan
  async create({ asset_id, user_id, start_date, end_date, reason }) {
    const [result] = await pool.query(
      'INSERT INTO loans (asset_id, user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [asset_id, user_id, start_date, end_date || null, reason]
    )
    return result.insertId
  },

  // Request loan return
  async requestReturn(id) {
    const [result] = await pool.query(
      'UPDATE loans SET return_requested = 1, return_requested_at = NOW() WHERE id = ?',
      [id]
    )
    return result
  },

  // Process loan return completion
  async processReturn(id, returned) {
    const isReturned = returned ? 1 : 0
    const [result] = await pool.query(
      'UPDATE loans SET returned=?, return_requested=0, return_requested_at=NULL WHERE id=?',
      [isReturned, id]
    )
    return result
  }
}

// Run initial migration
LoanModel.initReturnColumns()

module.exports = LoanModel
