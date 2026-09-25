const RequestModel = require('../models/RequestModel')
const AssetModel = require('../models/AssetModel')
const UserModel = require('../models/UserModel')
const NotificationModel = require('../models/NotificationModel')

const requestController = {
  // GET all requests (IT Manager) or filter by user_id (Employee)
  async getRequests(req, res) {
    try {
      const { user_id } = req.query
      const rows = await RequestModel.findAll(user_id)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // POST create new request
  async createRequest(req, res) {
    try {
      const { user_id, asset_id, start_date, end_date, reason } = req.body

      if (!asset_id || !user_id || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const start = new Date(start_date)
      const end = new Date(end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (start < today) {
        return res.status(400).json({ error: 'Start date cannot be in the past' })
      }
      if (end < start) {
        return res.status(400).json({ error: 'End date must be after or equal to start date' })
      }

      const asset = await AssetModel.findById(asset_id)
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }
      if (asset.status !== 'available') {
        return res.status(400).json({ error: 'Asset is not currently available for loan' })
      }

      const requestId = await RequestModel.create({
        user_id,
        asset_id,
        start_date,
        end_date,
        reason
      })

      // Notify all Admins and IT Managers
      const admins = await UserModel.findAdminsAndManagers()
      if (admins.length > 0) {
        const requester = await UserModel.findById(user_id)
        const msg = `New Request: ${requester?.name || 'An employee'} requested ${asset.name}.`
        const notifValues = admins.map(a => [a.id, msg, 'new_request'])
        await NotificationModel.createBulkNotifications(notifValues)
      }

      res.status(201).json({ id: requestId, message: 'Request submitted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // PUT update request status (Approved/Rejected)
  async updateRequestStatus(req, res) {
    try {
      const { status } = req.body
      await RequestModel.updateStatus(req.params.id, status)

      const request = await RequestModel.findById(req.params.id)
      if (request && (status === 'Approved' || status === 'Rejected')) {
        const message = status === 'Approved'
          ? `✅ Your request for ${request.asset_name} was Approved.`
          : `❌ Your request for ${request.asset_name} was Rejected.`

        await NotificationModel.createNotification(request.user_id, message, 'request_update')
      }

      res.json({ message: 'Request updated' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = requestController
