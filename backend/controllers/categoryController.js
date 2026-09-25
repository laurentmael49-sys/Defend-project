const CategoryModel = require('../models/CategoryModel')

const categoryController = {
  // GET categories
  async getCategories(req, res) {
    try {
      const rows = await CategoryModel.findAll()
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // POST add category
  async addCategory(req, res) {
    try {
      const { name } = req.body
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' })
      }
      const insertId = await CategoryModel.create(name.trim())
      res.status(201).json({ id: insertId, message: 'Category added' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // DELETE category
  async deleteCategory(req, res) {
    try {
      await CategoryModel.delete(req.params.id)
      res.json({ message: 'Category deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = categoryController
