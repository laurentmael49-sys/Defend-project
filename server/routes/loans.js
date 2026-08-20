const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

// GET all loans or filter by user_id
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query
    let query = `SELECT l.*, a.name as asset_name, a.category, u.name as user_name
                 FROM loans l JOIN assets a ON l.asset_id=a.id JOIN users u ON l.user_id=u.id`
    const params = []
    if (user_id) { query += ' WHERE l.user_id = ?'; params.push(user_id) }
    query += ' ORDER BY l.start_date DESC'
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST create loan (IT Manager approves request)
router.post('/', async (req, res) => {
  try {
    const { asset_id, user_id, start_date, end_date, reason } = req.body
    const [result] = await pool.query(
      'INSERT INTO loans (asset_id, user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [asset_id, user_id, start_date, end_date || null, reason]
    )
    await pool.query('UPDATE assets SET status="loaned" WHERE id=?', [asset_id])
    res.status(201).json({ id: result.insertId, message: 'Loan created' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT process return
router.put('/:id', async (req, res) => {
  try {
    const { returned, asset_id } = req.body
    await pool.query('UPDATE loans SET returned=? WHERE id=?', [returned, req.params.id])
    if (returned && asset_id) {
      await pool.query('UPDATE assets SET status="available" WHERE id=?', [asset_id])
    }
    res.json({ message: 'Loan updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
