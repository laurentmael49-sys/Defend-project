const API_BASE = 'http://localhost:5000/api'

/**
 * Builds structured client-side context for the AI prompt based on current user session.
 * @param {Object} user - Currently logged in user object
 * @returns {Promise<Object>} Formatted context object
 */
export const buildContext = async (user) => {
  try {
    const userId = user?.id
    const userRole = user?.role || 'Employee'
    const token = localStorage.getItem('token')
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

    const isAdmin = ['Admin', 'IT Manager'].includes(userRole)

    // Fetch assets
    let assets = []
    try {
      const res = await fetch(`${API_BASE}/assets`, { headers })
      if (res.ok) assets = await res.json()
    } catch (e) {
      console.warn('Could not fetch assets for AI context:', e)
    }

    // Fetch loans
    let loans = []
    try {
      const url = isAdmin ? `${API_BASE}/loans` : `${API_BASE}/loans?user_id=${userId || 0}`
      const res = await fetch(url, { headers })
      if (res.ok) loans = await res.json()
    } catch (e) {
      console.warn('Could not fetch loans for AI context:', e)
    }

    return {
      currentUser: {
        id: userId,
        name: user?.name || 'Guest User',
        role: userRole
      },
      summary: {
        total_assets: assets.length,
        total_loans: loans.length,
        active_loans: loans.filter(l => !l.returned).length
      },
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        status: a.status,
        price: a.price
      })),
      loans: loans.map(l => ({
        id: l.id,
        asset_name: l.asset_name,
        borrower_name: l.user_name,
        due_date: l.end_date,
        returned: Boolean(l.returned)
      }))
    }
  } catch (err) {
    console.error('Error building client context:', err)
    return {
      currentUser: { id: user?.id, name: user?.name, role: user?.role }
    }
  }
}
