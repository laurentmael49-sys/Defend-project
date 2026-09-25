const express = require('express')
const router = express.Router()
const assetController = require('../controllers/assetController')

// GET /api/assets - list all assets
router.get('/', assetController.getAllAssets)

// POST /api/assets - create a new asset
router.post('/', assetController.createAsset)

// PUT /api/assets/:id - update an existing asset
router.put('/:id', assetController.updateAsset)

// DELETE /api/assets/:id - remove an asset
router.delete('/:id', assetController.deleteAsset)

module.exports = router
