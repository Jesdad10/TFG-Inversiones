const router        = require('express').Router()
const pool          = require('../db')
const authMiddleware = require('../middleware/auth')

router.use(authMiddleware)

// ─── GET /api/notificaciones ──────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, tipo, titulo, mensaje, leida, created_at
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.usuario.id]
    )
    const noLeidas = rows.filter(n => !n.leida).length
    return res.json({ notificaciones: rows, no_leidas: noLeidas })
  } catch (err) {
    console.error('[notificaciones get]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/notificaciones/:id/leer ────────────────────────────────────

router.put('/:id/leer', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.usuario.id]
    )
    return res.json({ mensaje: 'Notificación marcada como leída' })
  } catch (err) {
    console.error('[notificaciones leer]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/notificaciones/leer-todas ──────────────────────────────────

router.put('/leer-todas', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?',
      [req.usuario.id]
    )
    return res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' })
  } catch (err) {
    console.error('[notificaciones leer-todas]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
