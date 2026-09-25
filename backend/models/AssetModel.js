const { pool } = require('../config/db')

const AssetModel = {
  // Find all assets ordered by creation
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM assets ORDER BY created_at DESC')
    return rows
  },

  // Find single asset by ID
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM assets WHERE id = ?', [id])
    return rows[0] || null
  },

  // Create an asset
  async create({ name, category, status, price, description, serial_no }) {
    const [result] = await pool.query(
      'INSERT INTO assets (name, category, status, price, description, serial_no) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, status, price, description, serial_no]
    )
    return result.insertId
  },

  // Update an existing asset
  async update(id, { name, category, status, price, description, serial_no }) {
    const [result] = await pool.query(
      'UPDATE assets SET name=?, category=?, status=?, price=?, description=?, serial_no=? WHERE id=?',
      [name, category, status, price, description, serial_no, id]
    )
    return result
  },

  // Update asset status (e.g. available, loaned, maintenance)
  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE assets SET status=? WHERE id=?', [status, id])
    return result
  },

  // Delete an asset
  async delete(id) {
    const [result] = await pool.query('DELETE FROM assets WHERE id = ?', [id])
    return result
  }
}

module.exports = AssetModel
