const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const { db, admin } = require('../db')
const authMiddleware = require('../middleware/auth')

function expiresDate() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
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

function fecha(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return value
}

function normalizarWallet(wallet) {
  if (!wallet) return null
  return String(wallet).trim().toLowerCase()
}

async function crearSesion(usuario, req, token) {
  const ref = db.collection('sesiones').doc()

  await ref.set({
    id: ref.id,
    usuario_id: usuario.id,
    token,
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null,
    expira_en: expiresDate(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  })
}

async function buscarUsuarioPorEmail(email) {
  const snap = await db
    .collection('usuarios')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  }
}

async function buscarUsuarioPorWallet(wallet) {
  const walletNormalizada = normalizarWallet(wallet)

  const snap = await db
    .collection('usuarios')
    .where('wallet', '==', walletNormalizada)
    .limit(1)
    .get()

  if (snap.empty) return null

  const doc = snap.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  }
}

function respuestaUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre || '',
    email: usuario.email || '',
    wallet: usuario.wallet || null,
    rol: usuario.rol || 'user',
    activo: usuario.activo !== false,
    bloqueado: usuario.bloqueado === true,
    motivo_bloqueo: usuario.motivo_bloqueo || null,
    telefono: usuario.telefono || null,
    pais: usuario.pais || null,
    ciudad: usuario.ciudad || null,
    direccion: usuario.direccion || null,
    genero: usuario.genero || null,
    bio: usuario.bio || null,
    avatar: usuario.avatar || null,
    fecha_nacimiento: usuario.fecha_nacimiento || null,
    created_at: fecha(usuario.created_at),
    updated_at: fecha(usuario.updated_at),
  }
}

// ─── POST /api/auth/register ───────────────────────────────────────────────

router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('fecha_nacimiento')
      .notEmpty()
      .withMessage('La fecha de nacimiento es obligatoria')
      .isISO8601()
      .withMessage('Formato de fecha no válido'),
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
      const existeEmail = await buscarUsuarioPorEmail(email)

      if (existeEmail) {
        return res.status(409).json({ error: 'El email ya está registrado' })
      }

      const walletNormalizada = normalizarWallet(wallet)

      if (walletNormalizada) {
        const existeWallet = await buscarUsuarioPorWallet(walletNormalizada)

        if (existeWallet) {
          return res.status(409).json({ error: 'Esta wallet ya está registrada' })
        }
      }

      const hash = await bcrypt.hash(password, 12)
      const ref = db.collection('usuarios').doc()

      const usuario = {
        id: ref.id,
        nombre,
        email,
        password_hash: hash,
        wallet: walletNormalizada,

        rol: 'user',
        activo: true,
        bloqueado: false,
        motivo_bloqueo: null,
        bloqueado_en: null,

        fecha_nacimiento,
        telefono: null,
        genero: null,
        pais: null,
        ciudad: null,
        direccion: null,
        bio: null,
        avatar: null,

        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await ref.set(usuario)

      const token = generarToken({
        id: ref.id,
        nombre,
        email,
        rol: 'user',
      })

      await crearSesion({ id: ref.id }, req, token)

      return res.status(201).json({
        mensaje: 'Usuario registrado correctamente',
        token,
        usuario: {
          id: ref.id,
          nombre,
          email,
          rol: 'user',
        },
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
      const usuario = await buscarUsuarioPorEmail(email)

      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales incorrectas' })
      }

      if (usuario.activo === false) {
        return res.status(403).json({ error: 'Cuenta desactivada' })
      }

      if (usuario.bloqueado === true) {
        return res.status(403).json({
          error: 'bloqueado',
          motivo: usuario.motivo_bloqueo || null,
        })
      }

      let hashLogin = usuario.password_hash || ''

      if (hashLogin.startsWith('$2b$')) {
        hashLogin = '$2a$' + hashLogin.slice(4)
      }

      const coincide = await bcrypt.compare(password, hashLogin)

      if (!coincide) {
        return res.status(401).json({ error: 'Credenciales incorrectas' })
      }

      const token = generarToken({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol || 'user',
      })

      await crearSesion(usuario, req, token)

      return res.json({
        mensaje: 'Login correcto',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol || 'user',
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
  [
    body('wallet')
      .trim()
      .notEmpty()
      .withMessage('La wallet es obligatoria'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const wallet = normalizarWallet(req.body.wallet)

    try {
      const usuario = await buscarUsuarioPorWallet(wallet)

      if (!usuario) {
        return res.status(404).json({ error: 'Wallet no registrada' })
      }

      if (usuario.activo === false) {
        return res.status(403).json({ error: 'Cuenta desactivada' })
      }

      if (usuario.bloqueado === true) {
        return res.status(403).json({
          error: 'bloqueado',
          motivo: usuario.motivo_bloqueo || null,
        })
      }

      const token = generarToken({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol || 'user',
      })

      await crearSesion(usuario, req, token)

      return res.json({
        mensaje: 'Login con wallet correcto',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          wallet: usuario.wallet,
          rol: usuario.rol || 'user',
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
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' })
  }

  try {
    const sesiones = await db
      .collection('sesiones')
      .where('token', '==', token)
      .get()

    const batch = db.batch()

    sesiones.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    return res.json({ mensaje: 'Sesión cerrada correctamente' })
  } catch (err) {
    console.error('[logout]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// ─── GET /api/auth/me ──────────────────────────────────────────────────────

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection('usuarios').doc(req.usuario.id).get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const usuario = {
      id: doc.id,
      ...doc.data(),
    }

    return res.json({
      usuario: respuestaUsuario(usuario),
    })
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
    body('nombre').optional({ checkFalsy: true }).trim(),
    body('telefono').optional({ checkFalsy: true }).trim(),
    body('genero').optional({ checkFalsy: true }).trim(),
    body('fecha_nacimiento').optional({ checkFalsy: true }).isISO8601().withMessage('Formato de fecha no válido'),
    body('pais').optional({ checkFalsy: true }).trim(),
    body('ciudad').optional({ checkFalsy: true }).trim(),
    body('direccion').optional({ checkFalsy: true }).trim(),
    body('bio').optional({ checkFalsy: true }).isLength({ max: 300 }).withMessage('La bio no puede superar 300 caracteres'),
    body('wallet').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    try {
      const userRef = db.collection('usuarios').doc(req.usuario.id)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      const actual = userDoc.data()

      const {
        nombre,
        telefono,
        genero,
        fecha_nacimiento,
        pais,
        ciudad,
        direccion,
        bio,
        avatar,
        wallet,
      } = req.body

      const datos = {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      if (nombre !== undefined) datos.nombre = nombre
      if (telefono !== undefined) datos.telefono = telefono || null
      if (genero !== undefined) datos.genero = genero || null
      if (fecha_nacimiento !== undefined) datos.fecha_nacimiento = fecha_nacimiento || null
      if (pais !== undefined) datos.pais = pais || null
      if (ciudad !== undefined) datos.ciudad = ciudad || null
      if (direccion !== undefined) datos.direccion = direccion || null
      if (bio !== undefined) datos.bio = bio || null
      if (avatar !== undefined) datos.avatar = avatar || null

      if (wallet !== undefined) {
        const walletNormalizada = normalizarWallet(wallet)

        if (walletNormalizada) {
          const existeWallet = await buscarUsuarioPorWallet(walletNormalizada)

          if (existeWallet && existeWallet.id !== req.usuario.id) {
            return res.status(409).json({ error: 'Esta wallet ya está registrada' })
          }
        }

        datos.wallet = walletNormalizada
      }

      await userRef.update(datos)

      const actualizadoDoc = await userRef.get()
      const actualizado = {
        id: actualizadoDoc.id,
        ...actual,
        ...actualizadoDoc.data(),
      }

      return res.json({
        mensaje: 'Perfil actualizado correctamente',
        usuario: respuestaUsuario(actualizado),
      })
    } catch (err) {
      console.error('[updateMe]', err)
      return res.status(500).json({ error: 'Error al actualizar el perfil' })
    }
  }
)

module.exports = router