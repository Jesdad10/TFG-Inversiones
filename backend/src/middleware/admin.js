const authMiddleware = require('./auth')

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.usuario?.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' })
    }
    next()
  })
}

module.exports = adminMiddleware
