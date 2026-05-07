const router       = require('express').Router()
const bcrypt       = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const pool         = require('../db')
const adminMiddleware = require('../middleware/admin')

router.use(adminMiddleware)

// ─── Helpers ───────────────────────────────────────────────────────────────

function validarInput(req, res) {
  const errores = validationResult(req)
  if (!errores.isEmpty()) {
    res.status(422).json({ error: errores.array()[0].msg })
    return false
  }
  return true
}

async function registrarHistorial(adminId, accion, entidadTipo, entidadId, detalle = null) {
  await pool.query(
    `INSERT INTO historial_admin (admin_id, accion, entidad_tipo, entidad_id, detalle)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId, accion, entidadTipo, entidadId, detalle]
  )
}

async function crearNotificacion(usuarioId, tipo, titulo, mensaje) {
  await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje) VALUES (?, ?, ?, ?)`,
    [usuarioId, tipo, titulo, mensaje]
  )
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
// Altas de usuarios por mes (últimos 12 meses)

router.get('/stats', async (req, res) => {
  try {
    const [registros] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS mes,
        COUNT(*) AS total
      FROM usuarios
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `)

    const [totales] = await pool.query(`
      SELECT
        COUNT(*) AS total_usuarios,
        SUM(bloqueado = 1) AS bloqueados,
        SUM(rol = 'admin') AS admins,
        (SELECT COUNT(*) FROM articulos WHERE estado = 'activo') AS productos_activos,
        (SELECT COUNT(*) FROM articulos) AS total_productos
      FROM usuarios
    `)

    return res.json({ registros_por_mes: registros, totales: totales[0] })
  } catch (err) {
    console.error('[admin stats]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── GET /api/admin/usuarios ──────────────────────────────────────────────

router.get('/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, email, rol, activo, bloqueado, motivo_bloqueo,
             bloqueado_en, fecha_nacimiento, pais, ciudad, telefono,
             avatar, created_at
      FROM usuarios
      ORDER BY created_at DESC
    `)
    return res.json({ usuarios: rows })
  } catch (err) {
    console.error('[admin usuarios]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── POST /api/admin/usuarios ─────────────────────────────────────────────
// Crear usuario desde el panel admin

router.post(
  '/usuarios',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('rol').isIn(['user', 'admin']).withMessage('Rol no válido'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { nombre, email, password, rol } = req.body

    try {
      const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email])
      if (existe.length > 0) {
        return res.status(409).json({ error: 'El email ya está registrado' })
      }

      const hash = await bcrypt.hash(password, 12)
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, rol]
      )

      await registrarHistorial(req.usuario.id, 'crear_usuario', 'usuario', result.insertId,
        `Creado por admin: ${nombre} (${email}) con rol ${rol}`)

      return res.status(201).json({ mensaje: 'Usuario creado correctamente', id: result.insertId })
    } catch (err) {
      console.error('[admin crear usuario]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// ─── PUT /api/admin/usuarios/:id/bloquear ────────────────────────────────

router.put('/usuarios/:id/bloquear', async (req, res) => {
  const { id } = req.params
  const { motivo } = req.body

  try {
    await pool.query(
      `UPDATE usuarios SET bloqueado = 1, motivo_bloqueo = ?, bloqueado_en = NOW() WHERE id = ?`,
      [motivo || null, id]
    )

    // Invalidar sesiones activas del usuario
    await pool.query('DELETE FROM sesiones WHERE usuario_id = ?', [id])

    await crearNotificacion(id, 'cuenta_bloqueada', 'Cuenta bloqueada',
      motivo
        ? `Tu cuenta ha sido bloqueada temporalmente. Motivo: ${motivo}. Contacta con soporte para más información.`
        : 'Tu cuenta ha sido bloqueada temporalmente. Contacta con soporte para más información.'
    )

    await registrarHistorial(req.usuario.id, 'bloquear_usuario', 'usuario', id,
      motivo ? `Motivo: ${motivo}` : null)

    return res.json({ mensaje: 'Usuario bloqueado correctamente' })
  } catch (err) {
    console.error('[admin bloquear]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/admin/usuarios/:id/desbloquear ─────────────────────────────

router.put('/usuarios/:id/desbloquear', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query(
      `UPDATE usuarios SET bloqueado = 0, motivo_bloqueo = NULL, bloqueado_en = NULL WHERE id = ?`,
      [id]
    )

    await registrarHistorial(req.usuario.id, 'desbloquear_usuario', 'usuario', id, null)

    return res.json({ mensaje: 'Usuario desbloqueado correctamente' })
  } catch (err) {
    console.error('[admin desbloquear]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/admin/usuarios/:id/rol ─────────────────────────────────────

router.put('/usuarios/:id/rol',
  [
    body('rol').isIn(['user', 'admin']).withMessage('Rol no válido'),
    body('password').notEmpty().withMessage('Se requiere tu contraseña para confirmar'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return
    const { id } = req.params
    const { rol, password } = req.body

    try {
      const [adminRows] = await pool.query(
        'SELECT password_hash FROM usuarios WHERE id = ?',
        [req.usuario.id]
      )
      if (!adminRows.length) return res.status(404).json({ error: 'Admin no encontrado' })

      let hashParaComparar = adminRows[0].password_hash || ''
      // bcryptjs 3.x es estricto con el prefijo; normaliza $2b$ → $2a$ si es necesario
      if (hashParaComparar.startsWith('$2b$')) {
        hashParaComparar = '$2a$' + hashParaComparar.slice(4)
      }
      const coincide = await bcrypt.compare(password, hashParaComparar)
      if (!coincide) return res.status(403).json({ error: 'Contraseña incorrecta' })

      await pool.query('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id])

      await registrarHistorial(req.usuario.id, 'cambiar_rol', 'usuario', id,
        `Nuevo rol: ${rol}`)

      return res.json({ mensaje: 'Rol actualizado correctamente' })
    } catch (err) {
      console.error('[admin cambiar rol]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// ─── DELETE /api/admin/usuarios/:id ──────────────────────────────────────

router.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params

  if (Number(id) === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })
  }

  try {
    await pool.query('DELETE FROM sesiones WHERE usuario_id = ?', [id])
    await pool.query('UPDATE usuarios SET activo = 0 WHERE id = ?', [id])

    await registrarHistorial(req.usuario.id, 'eliminar_usuario', 'usuario', id, null)

    return res.json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (err) {
    console.error('[admin eliminar usuario]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── GET /api/admin/articulos ─────────────────────────────────────────────
// Todos los artículos (incluyendo eliminados), con info del dueño y del admin que eliminó

router.get('/articulos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id, a.titulo, a.descripcion, a.categoria, a.condicion,
        a.crypto, a.precio_crypto, a.precio_eur, a.estado,
        a.eliminado_por_admin, a.motivo_eliminacion, a.eliminado_admin_en,
        a.created_at,
        u.id   AS usuario_id,
        u.nombre AS usuario_nombre,
        u.email  AS usuario_email,
        adm.nombre AS admin_nombre,
        (SELECT foto FROM articulo_fotos WHERE articulo_id = a.id ORDER BY orden LIMIT 1) AS foto
      FROM articulos a
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN usuarios adm ON adm.id = a.admin_eliminador_id
      ORDER BY a.created_at DESC
    `)
    return res.json({ articulos: rows })
  } catch (err) {
    console.error('[admin articulos]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── DELETE /api/admin/articulos/:id ─────────────────────────────────────

router.delete('/articulos/:id', async (req, res) => {
  const { id } = req.params
  const { motivo } = req.body

  try {
    const [rows] = await pool.query(
      'SELECT usuario_id, titulo FROM articulos WHERE id = ?', [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    const { usuario_id, titulo } = rows[0]

    await pool.query(
      `UPDATE articulos
       SET estado = 'eliminado',
           eliminado_por_admin  = 1,
           motivo_eliminacion   = ?,
           admin_eliminador_id  = ?,
           eliminado_admin_en   = NOW()
       WHERE id = ?`,
      [motivo || null, req.usuario.id, id]
    )

    const mensajeNotif = motivo
      ? `Tu producto "${titulo}" ha sido eliminado por un administrador. Motivo: ${motivo}.`
      : `Tu producto "${titulo}" ha sido eliminado por un administrador.`

    await crearNotificacion(usuario_id, 'producto_eliminado',
      'Producto eliminado', mensajeNotif)

    await registrarHistorial(req.usuario.id, 'eliminar_producto', 'producto', id,
      motivo ? `Motivo: ${motivo} | Producto: ${titulo}` : `Producto: ${titulo}`)

    return res.json({ mensaje: 'Artículo eliminado correctamente' })
  } catch (err) {
    console.error('[admin eliminar articulo]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── GET /api/admin/historial ─────────────────────────────────────────────

router.get('/historial', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        h.id, h.accion, h.entidad_tipo, h.entidad_id, h.detalle, h.created_at,
        u.nombre AS admin_nombre
      FROM historial_admin h
      JOIN usuarios u ON u.id = h.admin_id
      ORDER BY h.created_at DESC
      LIMIT 200
    `)
    return res.json({ historial: rows })
  } catch (err) {
    console.error('[admin historial]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router
