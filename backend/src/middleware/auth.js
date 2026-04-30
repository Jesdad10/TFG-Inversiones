const jwt = require('jsonwebtoken')
const pool = require('../db')

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Comprueba que el token sigue activo en la tabla sesiones
    const [rows] = await pool.query(
      'SELECT id FROM sesiones WHERE token = ? AND expira_en > NOW()',
      [token]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    req.usuario = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = authMiddleware