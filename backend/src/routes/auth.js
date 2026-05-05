const router    = require('express').Router()
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool      = require('../db')
const authMiddleware = require('../middleware/auth')

// ─── Helpers ───────────────────────────────────────────────────────────────

function expiresDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7) // 7 días
  return d
}

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

function validarInput(req, res) {
  const errores = validationResult(req)
  if (!errores.isEmpty()) {
    res.status(422).json({ error: errores.array()[0].msg })
    return false
  }
  return true
}

// ─── POST /api/auth/register ───────────────────────────────────────────────

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('fecha_nacimiento')
      .notEmpty().withMessage('La fecha de nacimiento es obligatoria')
      .isISO8601().withMessage('Formato de fecha no válido'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { nombre, email, password, wallet, fecha_nacimiento } = req.body

    const hoy = new Date()
    const nacimiento = new Date(fecha_nacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    if (edad < 18) {
      return res.status(403).json({ error: 'Debes ser mayor de 18 años para registrarte' })
    }

    try {
      // Comprobar email duplicado
      const [existe] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      )
      if (existe.length > 0) {
        return res.status(409).json({ error: 'El email ya está registrado' })
      }

      // Comprobar wallet duplicada (si se envía)
      if (wallet) {
        const [walletExiste] = await pool.query(
          'SELECT id FROM usuarios WHERE wallet = ?',
          [wallet]
        )
        if (walletExiste.length > 0) {
          return res.status(409).json({ error: 'Esta wallet ya está registrada' })
        }
      }

      const hash = await bcrypt.hash(password, 12)

      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, wallet, fecha_nacimiento) VALUES (?, ?, ?, ?, ?)',
        [nombre, email, hash, wallet || null, fecha_nacimiento]
      )

      const usuarioId = result.insertId
      const token = generarToken({ id: usuarioId, nombre, email, rol: 'user' })

      await pool.query(
        'INSERT INTO sesiones (usuario_id, token, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
        [
          usuarioId,
          token,
          req.ip,
          req.headers['user-agent'] || null,
          expiresDate(),
        ]
      )

      return res.status(201).json({
        mensaje: 'Usuario registrado correctamente',
        token,
        usuario: { id: usuarioId, nombre, email, rol: 'user' },
      })
    } catch (err) {
      console.error('[register]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// ─── POST /api/auth/login ──────────────────────────────────────────────────

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { email, password } = req.body

    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?',
        [email]
      )

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' })
      }

      const usuario = rows[0]

      if (!usuario.activo) {
        return res.status(403).json({ error: 'Cuenta desactivada' })
      }

      const coincide = await bcrypt.compare(password, usuario.password_hash)
      if (!coincide) {
        return res.status(401).json({ error: 'Credenciales incorrectas' })
      }

      const token = generarToken({
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol,
      })

      await pool.query(
        'INSERT INTO sesiones (usuario_id, token, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
        [
          usuario.id,
          token,
          req.ip,
          req.headers['user-agent'] || null,
          expiresDate(),
        ]
      )

      return res.json({
        mensaje: 'Login correcto',
        token,
        usuario: {
          id:     usuario.id,
          nombre: usuario.nombre,
          email:  usuario.email,
          rol:    usuario.rol,
        },
      })
    } catch (err) {
      console.error('[login]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// ─── POST /api/auth/login-wallet ───────────────────────────────────────────

router.post(
  '/login-wallet',
  [body('wallet').notEmpty().withMessage('La wallet es obligatoria')],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { wallet } = req.body

    try {
      const [rows] = await pool.query(
        'SELECT id, nombre, email, rol, activo FROM usuarios WHERE wallet = ?',
        [wallet]
      )

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Wallet no registrada' })
      }

      const usuario = rows[0]

      if (!usuario.activo) {
        return res.status(403).json({ error: 'Cuenta desactivada' })
      }

      const token = generarToken({
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      })

      await pool.query(
        'INSERT INTO sesiones (usuario_id, token, ip, user_agent, expira_en) VALUES (?, ?, ?, ?, ?)',
        [
          usuario.id,
          token,
          req.ip,
          req.headers['user-agent'] || null,
          expiresDate(),
        ]
      )

      return res.json({
        mensaje: 'Login con wallet correcto',
        token,
        usuario: {
          id:     usuario.id,
          nombre: usuario.nombre,
          email:  usuario.email,
          rol:    usuario.rol,
        },
      })
    } catch (err) {
      console.error('[login-wallet]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

// ─── POST /api/auth/logout ─────────────────────────────────────────────────

router.post('/logout', authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1]

  try {
    await pool.query('DELETE FROM sesiones WHERE token = ?', [token])
    return res.json({ mensaje: 'Sesión cerrada correctamente' })
  } catch (err) {
    console.error('[logout]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── GET /api/auth/me ──────────────────────────────────────────────────────

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, wallet, rol, created_at,
              telefono, pais, ciudad, direccion, genero, bio, avatar, fecha_nacimiento
       FROM usuarios WHERE id = ?`,
      [req.usuario.id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    return res.json({ usuario: rows[0] })
  } catch (err) {
    console.error('[me]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── PUT /api/auth/me ──────────────────────────────────────────────────────

router.put(
  '/me',
  authMiddleware,
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('telefono').optional({ checkFalsy: true }).trim(),
    body('genero').optional({ checkFalsy: true }).trim(),
    body('fecha_nacimiento').optional({ checkFalsy: true }).isISO8601().withMessage('Formato de fecha no válido'),
    body('pais').optional({ checkFalsy: true }).trim(),
    body('ciudad').optional({ checkFalsy: true }).trim(),
    body('direccion').optional({ checkFalsy: true }).trim(),
    body('bio').optional({ checkFalsy: true }).isLength({ max: 300 }).withMessage('La bio no puede superar 300 caracteres'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { nombre, telefono, genero, fecha_nacimiento, pais, ciudad, direccion, bio, avatar } = req.body

    try {
      await pool.query(
        `UPDATE usuarios SET
          nombre          = ?,
          telefono        = ?,
          genero          = ?,
          fecha_nacimiento = ?,
          pais            = ?,
          ciudad          = ?,
          direccion       = ?,
          bio             = ?,
          avatar          = ?
         WHERE id = ?`,
        [
          nombre,
          telefono        || null,
          genero          || null,
          fecha_nacimiento || null,
          pais            || null,
          ciudad          || null,
          direccion       || null,
          bio             || null,
          avatar          || null,
          req.usuario.id,
        ]
      )

      const [rows] = await pool.query(
        `SELECT id, nombre, email, wallet, rol, created_at,
                telefono, pais, ciudad, direccion, genero, bio, avatar, fecha_nacimiento
         FROM usuarios WHERE id = ?`,
        [req.usuario.id]
      )

      return res.json({ mensaje: 'Perfil actualizado correctamente', usuario: rows[0] })
    } catch (err) {
      console.error('[put /me]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

module.exports = router