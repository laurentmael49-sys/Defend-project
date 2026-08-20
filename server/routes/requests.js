const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

// GET all requests (IT Manager) or filter by user_id (Employee)
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query
    let query = `SELECT r.*, a.name as asset_name, u.name as user_name 
                 FROM requests r JOIN assets a ON r.asset_id=a.id JOIN users u ON r.user_id=u.id`
    const params = []
    if (user_id) { query += ' WHERE r.user_id = ?'; params.push(user_id) }
    query += ' ORDER BY r.created_at DESC'
    const [rows] = await pool.query(query, params)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST new request
router.post('/', async (req, res) => {
  try {
    const { user_id, asset_id, start_date, end_date, reason } = req.body
    const [result] = await pool.query(
      'INSERT INTO requests (user_id, asset_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
      [user_id, asset_id, start_date, end_date, reason]
    )
    res.status(201).json({ id: result.insertId, message: 'Request submitted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update request status (Approved/Rejected)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE requests SET status=? WHERE id=?', [status, req.params.id])
    res.json({ message: 'Request updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
