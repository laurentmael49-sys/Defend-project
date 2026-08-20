const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defend_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const connectDB = async () => {
  try {
    const conn = await pool.getConnection()
    console.log('✅ MySQL connected to defend_inventory')
    conn.release()
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = { pool, connectDB }
