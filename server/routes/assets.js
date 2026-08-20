const express = require('express')
const router = express.Router()
const { pool } = require('../config/db')

// GET all assets
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assets ORDER BY created_at DESC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST new asset
router.post('/', async (req, res) => {
  try {
    const { name, category, status, image_url, assigned_to, price } = req.body
    const [result] = await pool.query(
      'INSERT INTO assets (name, category, status, image_url, assigned_to, price) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, status, image_url || null, assigned_to || null, price]
    )
    res.status(201).json({ id: result.insertId, message: 'Asset created' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT update asset
router.put('/:id', async (req, res) => {
  try {
    const { name, category, status, image_url, assigned_to, price } = req.body
    await pool.query(
      'UPDATE assets SET name=?, category=?, status=?, image_url=?, assigned_to=?, price=? WHERE id=?',
      [name, category, status, image_url || null, assigned_to || null, price, req.params.id]
    )
    res.json({ message: 'Asset updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE asset
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id])
    res.json({ message: 'Asset deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
