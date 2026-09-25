const { pool } = require('../config/db')

const CategoryModel = {
  // Find all categories ordered by name
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC')
    return rows
  },

  // Create a new category
  async create(name) {
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name])
    return result.insertId
  },

  // Delete a category by ID
  async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id=?', [id])
    return result
  }
}

module.exports = CategoryModel
