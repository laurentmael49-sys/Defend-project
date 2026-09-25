const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const auditController = require('../controllers/auditController')

// GET /api/categories - list all categories
router.get('/', categoryController.getCategories)

// POST /api/categories - create a new category
router.post('/', categoryController.addCategory)

// DELETE /api/categories/:id - remove a category
router.delete('/:id', categoryController.deleteCategory)

// GET /api/categories/audit - audit logs endpoint
router.get('/audit', auditController.getAuditLogs)

module.exports = router
