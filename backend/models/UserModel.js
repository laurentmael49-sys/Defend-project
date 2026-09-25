const { pool } = require('../config/db')

const UserModel = {
  // Find a user by email
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password, phone, role, status FROM users WHERE email = ?',
      [email]
    )
    return rows[0] || null
  },

  // Find a user by ID
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [id]
    )
    return rows[0] || null
  },

  // Find all users (excluding password)
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC'
    )
    return rows
  },

  // Create a new user
  async create({ name, email, password, phone, role, status }) {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, phone || null, role, status]
    )
    return result.insertId
  },

  // Update personal profile
  async updateProfile(id, { name, email, phone, passwordHash }) {
    if (passwordHash) {
      await pool.query(
        'UPDATE users SET name=?, email=?, phone=?, password=? WHERE id=?',
        [name, email || null, phone || null, passwordHash, id]
      )
    } else {
      await pool.query(
        'UPDATE users SET name=?, email=?, phone=? WHERE id=?',
        [name, email || null, phone || null, id]
      )
    }
    return this.findById(id)
  },

  // Update user role
  async updateRole(id, role) {
    if (role === 'IT Manager') {
      await pool.query("UPDATE users SET role='Employee' WHERE role='IT Manager' AND id != ?", [id])
    }
    const [result] = await pool.query('UPDATE users SET role=? WHERE id=?', [role, id])
    return result
  },

  // Update user status
  async updateStatus(id, status) {
    const [result] = await pool.query('UPDATE users SET status=? WHERE id=?', [status, id])
    return result
  },

  // Find all administrators and IT managers
  async findAdminsAndManagers() {
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE role IN ("Admin", "IT Manager")')
    return rows
  }
}

module.exports = UserModel
