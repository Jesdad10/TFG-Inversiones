const router = require('express').Router()
const { db, admin } = require('../db')
const authMiddleware = require('../middleware/auth')

router.use(authMiddleware)

function fecha(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return value
}

function normalizarNotificacion(id, data) {
  return {
    id,
    tipo: data.tipo,
    titulo: data.titulo,
    mensaje: data.mensaje,
    leida: data.leida === true,
    created_at: fecha(data.created_at),
  }
}

// ─── GET /api/notificaciones ──────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const snap = await db
      .collection('notificaciones')
      .where('usuario_id', '==', req.usuario.id)
      .get()

    const notificaciones = snap.docs
      .map(doc => normalizarNotificacion(doc.id, doc.data()))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 50)

    const noLeidas = notificaciones.filter(n => !n.leida).length

    return res.json({
      notificaciones,
      no_leidas: noLeidas,
    })
  } catch (err) {
    console.error('[notificaciones get]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/notificaciones/:id/leer ────────────────────────────────────

router.put('/:id/leer', async (req, res) => {
  try {
    const ref = db.collection('notificaciones').doc(req.params.id)
    const doc = await ref.get()

    if (!doc.exists || doc.data().usuario_id !== req.usuario.id) {
      return res.status(404).json({ error: 'Notificación no encontrada' })
    }

    await ref.update({
      leida: true,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.json({ mensaje: 'Notificación marcada como leída' })
  } catch (err) {
    console.error('[notificaciones leer]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/notificaciones/leer-todas ──────────────────────────────────

router.put('/leer-todas', async (req, res) => {
  try {
    const snap = await db
      .collection('notificaciones')
      .where('usuario_id', '==', req.usuario.id)
      .get()

    const batch = db.batch()

    snap.forEach(doc => {
      batch.update(doc.ref, {
        leida: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()

    return res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
  } catch (err) {
    console.error('[notificaciones leer-todas]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router