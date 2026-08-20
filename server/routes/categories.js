const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

// GET categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST add category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name])
    res.status(201).json({ id: result.insertId, message: 'Category added' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id])
    res.json({ message: 'Category deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET audit logs
router.get('/audit', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM audit_logs l LEFT JOIN users u ON l.user_id=u.id
      ORDER BY l.created_at DESC LIMIT 100`)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
