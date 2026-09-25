const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' })
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'defend_super_secret_key_2026'
    )
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' })
  }
}

module.exports = { authenticateToken }
