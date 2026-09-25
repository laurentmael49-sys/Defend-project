const UserModel = require('../models/UserModel')
const bcrypt = require('bcryptjs')

const userController = {
  // GET all users (Admin only)
  async getUsers(req, res) {
    try {
      const rows = await UserModel.findAll()
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // GET single user by ID
  async getUserById(req, res) {
    try {
      const user = await UserModel.findById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json(user)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // PUT update profile (name, email, phone, optional password)
  async updateProfile(req, res) {
    try {
      const { name, email, phone, password } = req.body

      // If email is changing, check it's not already taken by another user
      if (email) {
        const existing = await UserModel.findByEmail(email)
        if (existing && String(existing.id) !== String(req.params.id)) {
          return res.status(409).json({ error: 'This email is already in use by another account.' })
        }
      }

      let passwordHash = null
      if (password && password.trim().length > 0) {
        passwordHash = await bcrypt.hash(password, 10)
      }

      const updatedUser = await UserModel.updateProfile(req.params.id, {
        name,
        email,
        phone,
        passwordHash
      })

      res.json({ message: 'Profile updated', user: updatedUser })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // PUT update role (Admin only)
  async updateRole(req, res) {
    try {
      const { role } = req.body
      await UserModel.updateRole(req.params.id, role)
      res.json({ message: 'Role updated' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  // PUT update status (Admin only)
  async updateStatus(req, res) {
    try {
      const { status } = req.body
      await UserModel.updateStatus(req.params.id, status)
      res.json({ message: 'Status updated' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}

module.exports = userController
