const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const { db, admin } = require('../db')
const adminMiddleware = require('../middleware/admin')

router.use(adminMiddleware)

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

function numero(valor, defecto = 0) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : defecto
}

function usuarioSalida(id, data) {
  return {
    id,
    nombre: data.nombre || '',
    email: data.email || '',
    wallet: data.wallet || null,
    rol: data.rol || 'user',
    activo: data.activo === false ? 0 : 1,
    bloqueado: data.bloqueado === true ? 1 : 0,
    motivo_bloqueo: data.motivo_bloqueo || null,
    bloqueado_en: fecha(data.bloqueado_en),
    fecha_nacimiento: data.fecha_nacimiento || null,
    pais: data.pais || null,
    ciudad: data.ciudad || null,
    telefono: data.telefono || null,
    avatar: data.avatar || null,
    created_at: fecha(data.created_at),
  }
}

function articuloSalida(id, data, extra = {}) {
  const fotos = Array.isArray(data.fotos) ? data.fotos : []

  return {
    id,
    titulo: data.titulo || '',
    descripcion: data.descripcion || '',
    categoria: data.categoria || '',
    condicion: data.condicion || '',
    crypto: data.crypto || 'ETH',
    precio_crypto: Number(data.precio_crypto || 0),
    precio_eur: Number(data.precio_eur || 0),
    estado: data.estado || 'activo',

    usuario_id: data.usuario_id || null,
    comprador_id: data.comprador_id || null,
    usuario_arma_id: data.usuario_arma_id || null,
    articulo_origen_id: data.articulo_origen_id || null,
    compra_id: data.compra_id || null,

    historial_arma_id: data.historial_arma_id || null,
    numero_duenos: numero(data.numero_duenos || 1, 1),

    tx_hash: data.tx_hash || null,
    red: data.red || null,
    etherscan_url: data.tx_hash ? `https://sepolia.etherscan.io/tx/${data.tx_hash}` : null,

    venta_expira_en: fecha(data.venta_expira_en),
    fecha_venta_inicio: fecha(data.fecha_venta_inicio),

    eliminado_por_admin: data.eliminado_por_admin === true ? 1 : 0,
    retirado_por_admin: data.retirado_por_admin === true ? 1 : 0,
    motivo_eliminacion: data.motivo_eliminacion || null,
    motivo_retirada: data.motivo_retirada || null,
    admin_eliminador_id: data.admin_eliminador_id || null,
    eliminado_admin_en: fecha(data.eliminado_admin_en),
    retirado_admin_en: fecha(data.retirado_admin_en),

    created_at: fecha(data.created_at),
    updated_at: fecha(data.updated_at),
    foto: data.foto_principal || fotos[0] || null,

    ...extra,
  }
}

function historialArmaSalida(id, data, extra = {}) {
  return {
    id,
    arma_nombre: data.arma_nombre || '',
    arma_categoria: data.arma_categoria || '',
    arma_marca: data.arma_marca || '',
    arma_modelo: data.arma_modelo || '',
    arma_numero_serie: data.arma_numero_serie || '',
    primera_publicacion_articulo_id: data.primera_publicacion_articulo_id || null,
    ultimo_articulo_id: data.ultimo_articulo_id || null,
    ultima_compra_id: data.ultima_compra_id || null,
    propietario_actual_id: data.propietario_actual_id || null,
    propietario_anterior_id: data.propietario_anterior_id || null,
    numero_duenos: numero(data.numero_duenos || 1, 1),
    transacciones_totales: numero(data.transacciones_totales || 0, 0),
    duenios_ids: Array.isArray(data.duenios_ids) ? data.duenios_ids : [],
    created_at: fecha(data.created_at),
    updated_at: fecha(data.updated_at),
    ...extra,
  }
}

function transaccionArmaSalida(id, data) {
  return {
    id,
    historial_arma_id: data.historial_arma_id || null,
    compra_id: data.compra_id || null,
    articulo_id: data.articulo_id || null,
    orden: numero(data.orden || 1, 1),
    tipo: data.tipo || 'compra',
    vendedor_id: data.vendedor_id || null,
    vendedor_nombre: data.vendedor_nombre || null,
    vendedor_email: data.vendedor_email || null,
    comprador_id: data.comprador_id || null,
    comprador_nombre: data.comprador_nombre || null,
    comprador_email: data.comprador_email || null,
    titulo: data.titulo || '',
    categoria: data.categoria || '',
    condicion: data.condicion || '',
    crypto: data.crypto || 'ETH',
    precio_crypto: Number(data.precio_crypto || 0),
    precio_eur: Number(data.precio_eur || 0),
    tx_hash: data.tx_hash || null,
    red: data.red || 'sepolia',
    etherscan_url: data.tx_hash ? `https://sepolia.etherscan.io/tx/${data.tx_hash}` : null,
    wallet_comprador: data.wallet_comprador || null,
    wallet_destino: data.wallet_destino || null,
    importe_pagado_eth: data.importe_pagado_eth || null,
    bloque_pago: data.bloque_pago || null,
    created_at: fecha(data.created_at),
  }
}

async function registrarHistorial(adminId, accion, entidadTipo, entidadId, detalle = null) {
  const ref = db.collection('historial_admin').doc()

  await ref.set({
    id: ref.id,
    admin_id: adminId,
    accion,
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    detalle,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  })
}

async function crearNotificacion(usuarioId, tipo, titulo, mensaje) {
  if (!usuarioId) return

  const ref = db.collection('notificaciones').doc()

  await ref.set({
    id: ref.id,
    usuario_id: usuarioId,
    tipo,
    titulo,
    mensaje,
    leida: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  })
}

async function borrarSesionesUsuario(usuarioId) {
  const snap = await db.collection('sesiones').where('usuario_id', '==', usuarioId).get()
  const batch = db.batch()

  snap.forEach(doc => {
    batch.delete(doc.ref)
  })

  await batch.commit()
}

async function obtenerUsuarioBasico(usuarioId) {
  if (!usuarioId) return null

  try {
    const doc = await db.collection('usuarios').doc(usuarioId).get()

    if (!doc.exists) return null

    const u = doc.data()

    return {
      id: doc.id,
      nombre: u.nombre || 'Usuario',
      email: u.email || '',
      wallet: u.wallet || null,
      avatar: u.avatar || null,
      rol: u.rol || 'user',
    }
  } catch (_) {
    return null
  }
}

function fechaExpiracionAdmin() {
  const d = new Date()
  d.setHours(d.getHours() + 24)
  return d
}

async function caducarProductosAdmin() {
  const snap = await db
    .collection('articulos')
    .where('estado', '==', 'activo')
    .get()

  const promesas = []

  for (const doc of snap.docs) {
    const data = doc.data()

    if (!data.admin_publicacion) continue
    if (!data.venta_expira_en) continue

    const expira = typeof data.venta_expira_en.toDate === 'function'
      ? data.venta_expira_en.toDate()
      : new Date(data.venta_expira_en)

    if (expira <= new Date()) {
      promesas.push(doc.ref.update({
        estado: 'expirado',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }))
    }
  }

  await Promise.all(promesas)
}

async function reconstruirHistorialCompra(compraDoc) {
  const compra = compraDoc.data()

  if (compra.historial_arma_id) {
    return null
  }

  const articuloId = compra.articulo_id
  const compradorId = compra.comprador_id
  const vendedorId = compra.vendedor_id

  if (!articuloId || !compradorId || !vendedorId || !compra.tx_hash) {
    return null
  }

  const articuloRef = db.collection('articulos').doc(articuloId)
  const articuloDoc = await articuloRef.get()
  const articulo = articuloDoc.exists ? articuloDoc.data() : {}

  const vendedor = await obtenerUsuarioBasico(vendedorId)
  const comprador = await obtenerUsuarioBasico(compradorId)

  const historialRef = db.collection('historial_armas').doc()
  const transRef = historialRef.collection('transacciones').doc()

  const titulo = compra.titulo || articulo.titulo || ''
  const categoria = compra.categoria || articulo.categoria || ''
  const condicion = compra.condicion || articulo.condicion || ''

  await historialRef.set({
    id: historialRef.id,
    arma_nombre: titulo,
    arma_categoria: categoria,
    arma_marca: articulo.arma_marca || articulo.marca || '',
    arma_modelo: articulo.arma_modelo || articulo.modelo || '',
    arma_numero_serie: articulo.arma_numero_serie || articulo.numero_serie || '',
    primera_publicacion_articulo_id: articuloId,
    ultimo_articulo_id: articuloId,
    ultima_compra_id: compraDoc.id,
    propietario_actual_id: compradorId,
    propietario_anterior_id: vendedorId,
    numero_duenos: 2,
    transacciones_totales: 1,
    duenios_ids: [vendedorId, compradorId],
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  })

  await transRef.set({
    id: transRef.id,
    historial_arma_id: historialRef.id,
    compra_id: compraDoc.id,
    articulo_id: articuloId,
    orden: 1,
    tipo: 'compra',
    vendedor_id: vendedorId,
    vendedor_nombre: vendedor?.nombre || null,
    vendedor_email: vendedor?.email || null,
    comprador_id: compradorId,
    comprador_nombre: comprador?.nombre || null,
    comprador_email: comprador?.email || null,
    titulo,
    categoria,
    condicion,
    crypto: compra.crypto || articulo.crypto || 'ETH',
    precio_crypto: Number(compra.precio_crypto || articulo.precio_crypto || 0),
    precio_eur: Number(compra.precio_eur || articulo.precio_eur || 0),
    tx_hash: compra.tx_hash,
    red: compra.red || 'sepolia',
    wallet_comprador: compra.wallet_comprador || null,
    wallet_destino: compra.wallet_destino || null,
    importe_pagado_eth: compra.importe_pagado_eth || null,
    bloque_pago: compra.bloque_pago || null,
    created_at: compra.created_at || admin.firestore.FieldValue.serverTimestamp(),
  })

  await compraDoc.ref.update({
    historial_arma_id: historialRef.id,
    numero_duenos: 2,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {})

  await articuloRef.update({
    historial_arma_id: historialRef.id,
    numero_duenos: 2,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }).catch(() => {})

  const armasSnap = await db
    .collection('usuario_armas')
    .where('compra_id', '==', compraDoc.id)
    .get()

  const batch = db.batch()

  armasSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      historial_arma_id: historialRef.id,
      numero_duenos: 2,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  if (!armasSnap.empty) {
    await batch.commit()
  }

  return historialRef.id
}

router.get('/stats', async (req, res) => {
  try {
    await caducarProductosAdmin()

    const usuariosSnap = await db.collection('usuarios').get()
    const articulosSnap = await db.collection('articulos').get()
    const historialesSnap = await db.collection('historial_armas').get()

    const usuarios = usuariosSnap.docs.map(doc => doc.data())
    const articulos = articulosSnap.docs.map(doc => doc.data())
    const historialesArmas = historialesSnap.docs.map(doc => doc.data())

    const total_usuarios = usuarios.length
    const bloqueados = usuarios.filter(u => u.bloqueado === true).length
    const admins = usuarios.filter(u => u.rol === 'admin').length
    const productos_activos = articulos.filter(a => a.estado === 'activo').length
    const total_productos = articulos.length
    const armas_con_historial = historialesArmas.length
    const transacciones_armas = historialesArmas.reduce((acc, h) => acc + numero(h.transacciones_totales || 0, 0), 0)

    const ahora = new Date()
    const inicio = new Date()
    inicio.setMonth(inicio.getMonth() - 11)
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)

    const mapa = {}

    for (let i = 0; i < 12; i++) {
      const d = new Date(inicio)
      d.setMonth(inicio.getMonth() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      mapa[key] = 0
    }

    usuarios.forEach(u => {
      const f = fecha(u.created_at)
      if (!f) return

      const d = new Date(f)
      if (d < inicio || d > ahora) return

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (mapa[key] !== undefined) mapa[key]++
    })

    const registros_por_mes = Object.entries(mapa).map(([mes, total]) => ({ mes, total }))

    return res.json({
      registros_por_mes,
      totales: {
        total_usuarios,
        bloqueados,
        admins,
        productos_activos,
        total_productos,
        armas_con_historial,
        transacciones_armas,
      },
    })
  } catch (err) {
    console.error('[admin stats]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/usuarios', async (req, res) => {
  try {
    const snap = await db.collection('usuarios').get()

    const usuarios = snap.docs
      .map(doc => usuarioSalida(doc.id, doc.data()))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ usuarios })
  } catch (err) {
    console.error('[admin usuarios]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

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
      const existe = await db.collection('usuarios').where('email', '==', email).limit(1).get()

      if (!existe.empty) {
        return res.status(409).json({ error: 'El email ya está registrado' })
      }

      const hash = await bcrypt.hash(password, 12)
      const ref = db.collection('usuarios').doc()

      await ref.set({
        id: ref.id,
        nombre,
        email,
        password_hash: hash,
        wallet: null,
        rol,
        activo: true,
        bloqueado: false,
        motivo_bloqueo: null,
        bloqueado_en: null,
        fecha_nacimiento: null,
        telefono: null,
        genero: null,
        pais: null,
        ciudad: null,
        direccion: null,
        bio: null,
        avatar: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      await registrarHistorial(
        req.usuario.id,
        'crear_usuario',
        'usuario',
        ref.id,
        `Creado por admin: ${nombre} (${email}) con rol ${rol}`
      )

      return res.status(201).json({
        mensaje: 'Usuario creado correctamente',
        id: ref.id,
      })
    } catch (err) {
      console.error('[admin crear usuario]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

router.put('/usuarios/:id/bloquear', async (req, res) => {
  const { id } = req.params
  const { motivo } = req.body

  try {
    const ref = db.collection('usuarios').doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await ref.update({
      bloqueado: true,
      motivo_bloqueo: motivo || null,
      bloqueado_en: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    await borrarSesionesUsuario(id)

    await crearNotificacion(
      id,
      'cuenta_bloqueada',
      'Cuenta bloqueada',
      motivo
        ? `Tu cuenta ha sido bloqueada temporalmente. Motivo: ${motivo}. Contacta con soporte para más información.`
        : 'Tu cuenta ha sido bloqueada temporalmente. Contacta con soporte para más información.'
    )

    await registrarHistorial(
      req.usuario.id,
      'bloquear_usuario',
      'usuario',
      id,
      motivo ? `Motivo: ${motivo}` : null
    )

    return res.json({ mensaje: 'Usuario bloqueado correctamente' })
  } catch (err) {
    console.error('[admin bloquear]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put('/usuarios/:id/desbloquear', async (req, res) => {
  const { id } = req.params

  try {
    const ref = db.collection('usuarios').doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await ref.update({
      bloqueado: false,
      motivo_bloqueo: null,
      bloqueado_en: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    await registrarHistorial(req.usuario.id, 'desbloquear_usuario', 'usuario', id, null)

    return res.json({ mensaje: 'Usuario desbloqueado correctamente' })
  } catch (err) {
    console.error('[admin desbloquear]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.put(
  '/usuarios/:id/rol',
  [
    body('rol').isIn(['user', 'admin']).withMessage('Rol no válido'),
    body('password').notEmpty().withMessage('Se requiere tu contraseña para confirmar'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const { id } = req.params
    const { rol, password } = req.body

    try {
      const adminDoc = await db.collection('usuarios').doc(req.usuario.id).get()

      if (!adminDoc.exists) {
        return res.status(404).json({ error: 'Admin no encontrado' })
      }

      let hashParaComparar = adminDoc.data().password_hash || ''

      if (hashParaComparar.startsWith('$2b$')) {
        hashParaComparar = '$2a$' + hashParaComparar.slice(4)
      }

      const coincide = await bcrypt.compare(password, hashParaComparar)

      if (!coincide) {
        return res.status(403).json({ error: 'Contraseña incorrecta' })
      }

      const userRef = db.collection('usuarios').doc(id)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      await userRef.update({
        rol,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      await registrarHistorial(req.usuario.id, 'cambiar_rol', 'usuario', id, `Nuevo rol: ${rol}`)

      return res.json({ mensaje: 'Rol actualizado correctamente' })
    } catch (err) {
      console.error('[admin cambiar rol]', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
)

router.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params

  if (id === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })
  }

  try {
    const ref = db.collection('usuarios').doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await borrarSesionesUsuario(id)

    await ref.update({
      activo: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    await registrarHistorial(req.usuario.id, 'eliminar_usuario', 'usuario', id, null)

    return res.json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (err) {
    console.error('[admin eliminar usuario]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/articulos', async (req, res) => {
  try {
    await caducarProductosAdmin()

    const snap = await db.collection('articulos').get()
    const porId = new Map()

    for (const doc of snap.docs) {
      porId.set(doc.id, { id: doc.id, data: doc.data() })
    }

    const articulos = []

    for (const item of porId.values()) {
      const data = item.data

      let usuario_nombre = 'Usuario'
      let usuario_email = ''
      let comprador_nombre = null
      let comprador_email = null
      let admin_nombre = null
      let propietario_es_admin = false

      if (data.usuario_id) {
        const userDoc = await db.collection('usuarios').doc(data.usuario_id).get()

        if (userDoc.exists) {
          const u = userDoc.data()
          usuario_nombre = u.nombre || 'Usuario'
          usuario_email = u.email || ''
          propietario_es_admin = u.rol === 'admin'
        }
      }

      if (data.comprador_id) {
        const compradorDoc = await db.collection('usuarios').doc(data.comprador_id).get()

        if (compradorDoc.exists) {
          const c = compradorDoc.data()
          comprador_nombre = c.nombre || 'Usuario'
          comprador_email = c.email || ''
        }
      }

      if (data.admin_eliminador_id) {
        const adminDoc = await db.collection('usuarios').doc(data.admin_eliminador_id).get()
        if (adminDoc.exists) admin_nombre = adminDoc.data().nombre || null
      }

      articulos.push(articuloSalida(item.id, data, {
        usuario_nombre,
        usuario_email,
        comprador_nombre,
        comprador_email,
        admin_nombre,
        propietario_es_admin,
        accion_admin: propietario_es_admin ? 'eliminar' : 'quitar_mercado',
      }))
    }

    articulos.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ articulos })
  } catch (err) {
    console.error('[admin articulos]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.delete('/articulos/:id', async (req, res) => {
  const { id } = req.params
  const { motivo } = req.body

  try {
    const ref = db.collection('articulos').doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    const articulo = doc.data()
    const usuarioId = articulo.usuario_id
    const titulo = articulo.titulo || 'Producto'

    let propietarioEsAdmin = false

    if (usuarioId) {
      const userDoc = await db.collection('usuarios').doc(usuarioId).get()
      propietarioEsAdmin = userDoc.exists && userDoc.data().rol === 'admin'
    }

    if (propietarioEsAdmin) {
      await ref.update({
        estado: 'eliminado',
        eliminado_por_admin: true,
        motivo_eliminacion: motivo || null,
        admin_eliminador_id: req.usuario.id,
        eliminado_admin_en: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      await registrarHistorial(
        req.usuario.id,
        'eliminar_producto_admin',
        'producto',
        id,
        motivo ? `Producto admin eliminado. Motivo: ${motivo} | Producto: ${titulo}` : `Producto admin eliminado: ${titulo}`
      )

      return res.json({
        mensaje: 'Producto del admin eliminado correctamente',
        accion: 'eliminado',
      })
    }

    await ref.update({
      estado: 'retirado',
      retirado_por_admin: true,
      motivo_retirada: motivo || null,
      admin_eliminador_id: req.usuario.id,
      retirado_admin_en: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (articulo.usuario_arma_id) {
      await db.collection('usuario_armas').doc(articulo.usuario_arma_id).update({
        en_venta: false,
        articulo_venta_id: null,
        estado_propiedad: 'disponible',
        venta_expira_en: null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {})
    }

    await crearNotificacion(
      usuarioId,
      'producto_retirado',
      'Producto retirado del mercado',
      motivo
        ? `Tu producto "${titulo}" ha sido retirado del mercado por un administrador. Motivo: ${motivo}.`
        : `Tu producto "${titulo}" ha sido retirado del mercado por un administrador.`
    )

    await registrarHistorial(
      req.usuario.id,
      'retirar_producto_usuario',
      'producto',
      id,
      motivo ? `Producto de usuario retirado. Motivo: ${motivo} | Producto: ${titulo}` : `Producto de usuario retirado: ${titulo}`
    )

    return res.json({
      mensaje: 'Producto retirado del mercado correctamente',
      accion: 'retirado',
    })
  } catch (err) {
    console.error('[admin eliminar/retirar articulo]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

router.get('/historial-armas', async (req, res) => {
  try {
    const snap = await db.collection('historial_armas').get()
    const historiales = []

    for (const doc of snap.docs) {
      const data = doc.data()
      const propietarioActual = await obtenerUsuarioBasico(data.propietario_actual_id)
      const propietarioAnterior = await obtenerUsuarioBasico(data.propietario_anterior_id)

      historiales.push(historialArmaSalida(doc.id, data, {
        propietario_actual_nombre: propietarioActual?.nombre || null,
        propietario_actual_email: propietarioActual?.email || null,
        propietario_anterior_nombre: propietarioAnterior?.nombre || null,
        propietario_anterior_email: propietarioAnterior?.email || null,
      }))
    }

    historiales.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))

    return res.json({ historiales })
  } catch (err) {
    console.error('[admin historial armas]', err)
    return res.status(500).json({ error: 'Error al obtener el historial de armas' })
  }
})

router.post('/historial-armas/reconstruir', async (req, res) => {
  try {
    const comprasSnap = await db.collection('compras').get()
    let creados = 0
    let saltados = 0

    for (const doc of comprasSnap.docs) {
      const creado = await reconstruirHistorialCompra(doc)

      if (creado) {
        creados++
      } else {
        saltados++
      }
    }

    await registrarHistorial(
      req.usuario.id,
      'reconstruir_historial_armas',
      'historial_armas',
      'bulk',
      `Historiales creados: ${creados}. Saltados: ${saltados}.`
    ).catch(() => {})

    return res.json({
      mensaje: 'Historial reconstruido correctamente',
      creados,
      saltados,
    })
  } catch (err) {
    console.error('[admin reconstruir historial armas]', err)
    return res.status(500).json({ error: 'Error al reconstruir el historial de armas' })
  }
})

router.get('/historial-armas/:id', async (req, res) => {
  const { id } = req.params

  try {
    const ref = db.collection('historial_armas').doc(id)
    const doc = await ref.get()

    if (!doc.exists) {
      return res.status(404).json({ error: 'Historial de arma no encontrado' })
    }

    const data = doc.data()
    const propietarioActual = await obtenerUsuarioBasico(data.propietario_actual_id)
    const propietarioAnterior = await obtenerUsuarioBasico(data.propietario_anterior_id)
    const transSnap = await ref.collection('transacciones').get()

    const transacciones = transSnap.docs
      .map(t => transaccionArmaSalida(t.id, t.data()))
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))

    const historial = historialArmaSalida(doc.id, data, {
      propietario_actual_nombre: propietarioActual?.nombre || null,
      propietario_actual_email: propietarioActual?.email || null,
      propietario_actual_wallet: propietarioActual?.wallet || null,
      propietario_anterior_nombre: propietarioAnterior?.nombre || null,
      propietario_anterior_email: propietarioAnterior?.email || null,
      propietario_anterior_wallet: propietarioAnterior?.wallet || null,
      transacciones,
    })

    return res.json({ historial })
  } catch (err) {
    console.error('[admin historial arma detalle]', err)
    return res.status(500).json({ error: 'Error al obtener el detalle del historial del arma' })
  }
})

router.get('/historial', async (req, res) => {
  try {
    const snap = await db.collection('historial_admin').get()
    const historial = []

    for (const doc of snap.docs) {
      const data = doc.data()
      let admin_nombre = 'Admin'

      if (data.admin_id) {
        const adminDoc = await db.collection('usuarios').doc(data.admin_id).get()
        if (adminDoc.exists) admin_nombre = adminDoc.data().nombre || 'Admin'
      }

      historial.push({
        id: doc.id,
        accion: data.accion,
        entidad_tipo: data.entidad_tipo,
        entidad_id: data.entidad_id,
        detalle: data.detalle || null,
        created_at: fecha(data.created_at),
        admin_nombre,
      })
    }

    historial.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ historial: historial.slice(0, 200) })
  } catch (err) {
    console.error('[admin historial]', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router