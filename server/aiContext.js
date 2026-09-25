const { pool } = require('./config/db')

/**
 * Builds a role-filtered context object from the database for the current user.
 * @param {Object} user - User object containing { id, role, name, email }
 * @returns {Promise<Object>} Role-filtered context object
 */
async function buildContext(user) {
  try {
    const userId = user?.id || null
    const rawRole = user?.role || 'user'
    const normalizedRole = rawRole.toLowerCase()
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'it manager'

    let assets = []
    let loans = []
    let userProfile = null
    let usersList = undefined
    let summary = {}

    const todayStr = new Date().toISOString().split('T')[0]
    const todayDate = new Date(todayStr)

    if (isAdmin) {
      // ── ADMIN / IT MANAGER ROLE ───────────────────────────────────────
      // 1. All assets with assigned borrower info if currently on loan
      const [assetRows] = await pool.query(`
        SELECT a.id, a.name, a.category, a.status, a.price, a.serial_no, a.description,
               u.name as assigned_to_user, u.email as assigned_to_email
        FROM assets a
        LEFT JOIN loans l ON a.id = l.asset_id AND l.returned = 0
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY a.created_at DESC
      `)
      assets = assetRows

      // 2. All loans with borrower info
      const [loanRows] = await pool.query(`
        SELECT l.id as loan_id, l.asset_id, a.name as asset_name, a.category,
               u.name as borrower_name, u.email as borrower_email,
               l.start_date, l.end_date, l.returned, l.reason
        FROM loans l
        JOIN assets a ON l.asset_id = a.id
        JOIN users u ON l.user_id = u.id
        ORDER BY l.start_date DESC
      `)

      loans = loanRows.map(l => {
        const isReturned = Boolean(l.returned)
        const dueDateStr = l.end_date ? new Date(l.end_date).toISOString().split('T')[0] : null
        const isOverdue = !isReturned && dueDateStr && new Date(dueDateStr) < todayDate
        return {
          loan_id: l.loan_id,
          asset_name: l.asset_name,
          category: l.category,
          borrower_name: l.borrower_name,
          borrower_email: l.borrower_email,
          start_date: l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : 'N/A',
          due_date: dueDateStr || 'No return date set',
          status: isReturned ? 'Returned' : (isOverdue ? 'OVERDUE' : 'Active'),
          is_overdue: isOverdue,
          reason: l.reason || 'N/A'
        }
      })

      // 3. All users list (admin only)
      const [userRows] = await pool.query(
        'SELECT id, name, email, role, status FROM users ORDER BY name ASC'
      )
      usersList = userRows

      summary = {
        total_assets: assets.length,
        total_loans: loans.length,
        active_loans: loans.filter(l => l.status === 'Active').length,
        overdue_loans: loans.filter(l => l.is_overdue).length,
        total_users: usersList.length
      }

    } else {
      // ── REGULAR USER ROLE ─────────────────────────────────────────────
      // 1. Assets currently assigned/loaned to this user + available assets
      const [userAssetRows] = await pool.query(`
        SELECT DISTINCT a.id, a.name, a.category, a.status, a.description
        FROM assets a
        LEFT JOIN loans l ON a.id = l.asset_id AND l.user_id = ? AND l.returned = 0
        WHERE l.user_id = ? OR a.status = 'available'
      `, [userId || 0, userId || 0])

      assets = userAssetRows

      // 2. ONLY loans where this user is the borrower
      if (userId) {
        const [userLoanRows] = await pool.query(`
          SELECT l.id as loan_id, a.name as asset_name, a.category,
                 l.start_date, l.end_date, l.returned, l.reason
          FROM loans l
          JOIN assets a ON l.asset_id = a.id
          WHERE l.user_id = ?
          ORDER BY l.start_date DESC
        `, [userId])

        loans = userLoanRows.map(l => {
          const isReturned = Boolean(l.returned)
          const dueDateStr = l.end_date ? new Date(l.end_date).toISOString().split('T')[0] : null
          const isOverdue = !isReturned && dueDateStr && new Date(dueDateStr) < todayDate
          return {
            loan_id: l.loan_id,
            asset_name: l.asset_name,
            category: l.category,
            start_date: l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : 'N/A',
            due_date: dueDateStr || 'No return date set',
            status: isReturned ? 'Returned' : (isOverdue ? 'OVERDUE' : 'Active'),
            is_overdue: isOverdue,
            reason: l.reason || 'N/A'
          }
        })

        // 3. Own profile info
        const [profileRows] = await pool.query(
          'SELECT id, name, email, role FROM users WHERE id = ?',
          [userId]
        )
        if (profileRows.length > 0) {
          userProfile = profileRows[0]
        }
      }

      summary = {
        my_total_loans: loans.length,
        my_active_loans: loans.filter(l => l.status === 'Active').length,
        my_overdue_loans: loans.filter(l => l.is_overdue).length
      }
    }

    const context = {
      currentUser: {
        id: user?.id || null,
        name: user?.name || 'Guest User',
        role: rawRole
      },
      summary,
      userProfile,
      assets,
      loans,
      users: usersList
    }

    // Dev-mode console log
    console.log(`[DEV MODE] AI Context for ${user?.name || 'Guest'} (${rawRole}): ${assets.length} assets, ${loans.length} loans included.`)

    return context
  } catch (error) {
    console.error('Error building AI context:', error)
    return { error: 'Failed to fetch asset context from database.' }
  }
}

module.exports = { buildContext }
