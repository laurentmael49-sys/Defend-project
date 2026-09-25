const LoanModel = require('../models/LoanModel')
const AssetModel = require('../models/AssetModel')
const UserModel = require('../models/UserModel')
const NotificationModel = require('../models/NotificationModel')
const AuditModel = require('../models/AuditModel')

const loanController = {
  // GET all loans (optionally filtered by user_id)
  async getLoans(req, res) {
    try {
      const { user_id } = req.query
      const rows = await LoanModel.findAll(user_id)
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // GET pending returns (Admin / IT Manager only)
  async getPendingReturns(req, res) {
    try {
      const role = req.user?.role || ''
      if (role !== 'Admin' && role !== 'IT Manager') {
        return res.status(403).json({ error: 'Forbidden: Admin or IT Manager access required.' })
      }

      const rows = await LoanModel.findPendingReturns()
      res.json(rows)
    } catch (err) {
      console.error('[pending-returns] Error:', err)
      res.status(500).json({ error: err.message })
    }
  },

  // POST create loan (IT Manager approves request)
  async createLoan(req, res) {
    try {
      const { asset_id, user_id, start_date, end_date, reason } = req.body
      const loanId = await LoanModel.create({ asset_id, user_id, start_date, end_date, reason })
      
      // Update asset status to loaned
      await AssetModel.updateStatus(asset_id, 'loaned')

      // Write audit log
      await AuditModel.createLog(
        user_id || null,
        'Create Loan',
        `Loan issued for asset #${asset_id}`
      )

      res.status(201).json({ id: loanId, message: 'Loan created' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // PATCH request return
  async requestReturn(req, res) {
    try {
      const loanId = req.params.id
      const requestingUserId = req.user?.id
      const requestingRole = req.user?.role || ''

      const loan = await LoanModel.findById(loanId)
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found.' })
      }
      if (loan.returned) {
        return res.status(400).json({ error: 'This loan has already been marked as returned.' })
      }
      if (loan.return_requested) {
        return res.status(400).json({ error: 'A return request is already pending approval.' })
      }

      if (requestingRole === 'Employee' && loan.user_id !== requestingUserId) {
        return res.status(403).json({ error: 'You can only submit a return for your own loans.' })
      }

      await LoanModel.requestReturn(loanId)

      // Audit log
      await AuditModel.createLog(
        requestingUserId,
        'Return Requested',
        `Employee submitted return request for loan #${loanId} (asset #${loan.asset_id})`
      )

      // Notify Admins & IT Managers
      const admins = await UserModel.findAdminsAndManagers()
      if (admins.length > 0) {
        const borrower = await UserModel.findById(loan.user_id)
        const asset = await AssetModel.findById(loan.asset_id)
        const msg = `Return Pending: ${borrower?.name || 'An employee'} submitted a return for ${asset?.name || 'an asset'}.`
        const notifValues = admins.map(a => [a.id, msg, 'return_request'])
        await NotificationModel.createBulkNotifications(notifValues)
      }

      res.json({ message: 'Return request submitted. An IT Manager will inspect and approve.' })
    } catch (err) {
      console.error('[request-return] Error:', err)
      res.status(500).json({ error: err.message })
    }
  },

  // PUT process return (Admin / IT Manager approves return)
  async processReturn(req, res) {
    try {
      const { returned, asset_id, condition, notes, admin_user_id } = req.body
      await LoanModel.processReturn(req.params.id, returned)

      if (returned && asset_id) {
        const newAssetStatus = condition === 'maintenance' ? 'maintenance' : 'available'
        await AssetModel.updateStatus(asset_id, newAssetStatus)

        const detailsNote = notes
          ? ` Condition: ${condition || 'Good'}. Notes: ${notes}`
          : ` Condition: ${condition || 'Good'}`

        await AuditModel.createLog(
          admin_user_id || null,
          'Process Return',
          `Returned asset #${asset_id} for loan #${req.params.id}.${detailsNote}`
        )
      }

      res.json({ message: 'Return approved and processed successfully.' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = loanController
