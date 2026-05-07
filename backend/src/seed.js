const bcrypt = require('bcryptjs')
const pool   = require('./db')

async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@akmarket.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!'
  const nombre   = process.env.ADMIN_NOMBRE   || 'Admin'

  try {
    const [rows] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    )

    if (rows.length > 0) return // ya existe, no hacer nada

    const hash = await bcrypt.hash(password, 12)
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hash, 'admin', 1]
    )

    console.log(`[seed] Admin creado: ${email}`)
  } catch (err) {
    console.error('[seed] Error al crear admin:', err.message)
  }
}

module.exports = seedAdmin
