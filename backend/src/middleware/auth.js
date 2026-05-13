const jwt = require('jsonwebtoken')
const { db } = require('../db')

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const sesionesSnap = await db
      .collection('sesiones')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (sesionesSnap.empty) {
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    const sesion = sesionesSnap.docs[0].data()
    const expiraEn = toDate(sesion.expira_en)

    if (!expiraEn || expiraEn <= new Date()) {
      await sesionesSnap.docs[0].ref.delete()
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    const usuarioDoc = await db.collection('usuarios').doc(payload.id).get()

    if (!usuarioDoc.exists) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    const usuario = usuarioDoc.data()

    if (usuario.activo === false) {
      return res.status(403).json({ error: 'Cuenta desactivada' })
    }

    if (usuario.bloqueado === true) {
      return res.status(403).json({
        error: 'bloqueado',
        motivo: usuario.motivo_bloqueo || null,
      })
    }

    req.usuario = {
      id: usuarioDoc.id,
      nombre: usuario.nombre || payload.nombre || '',
      email: usuario.email || payload.email || '',
      rol: usuario.rol || payload.rol || 'user',
      wallet: usuario.wallet || null,
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = authMiddleware