const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { ethers } = require('ethers')
const { db, admin } = require('../db')
const authMiddleware = require('../middleware/auth')

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

function normalizarArticulo(id, data, extra = {}) {
  const fotos = Array.isArray(data.fotos) ? data.fotos : []

  return {
    id,
    usuario_id: data.usuario_id || null,
    usuario_arma_id: data.usuario_arma_id || null,
    articulo_origen_id: data.articulo_origen_id || null,
    compra_id: data.compra_id || null,

    historial_arma_id: data.historial_arma_id || null,
    numero_duenos: numero(data.numero_duenos || 1, 1),

    titulo: data.titulo || '',
    descripcion: data.descripcion || '',
    categoria: data.categoria || '',
    condicion: data.condicion || '',

    crypto: data.crypto || 'ETH',
    precio_crypto: Number(data.precio_crypto || 0),
    precio_eur: Number(data.precio_eur || 0),

    peso_tier: data.peso_tier || null,
    tamano: data.tamano || null,
    envio_precio: data.envio_precio !== undefined && data.envio_precio !== null ? Number(data.envio_precio) : null,
    comision: data.comision !== undefined && data.comision !== null ? Number(data.comision) : null,
    neto_eur: data.neto_eur !== undefined && data.neto_eur !== null ? Number(data.neto_eur) : null,

    estado: data.estado || 'activo',

    fecha_venta_inicio: fecha(data.fecha_venta_inicio),
    venta_expira_en: fecha(data.venta_expira_en),

    fotos,
    foto_principal: data.foto_principal || fotos[0] || null,

    observacion_venta: data.observacion_venta || null,

    comprador_id: data.comprador_id || null,
    eliminado_por_admin: data.eliminado_por_admin === true,
    motivo_eliminacion: data.motivo_eliminacion || null,
    admin_eliminador_id: data.admin_eliminador_id || null,
    eliminado_admin_en: fecha(data.eliminado_admin_en),

    tx_hash: data.tx_hash || null,
    red: data.red || null,
    etherscan_url: data.tx_hash ? `https://sepolia.etherscan.io/tx/${data.tx_hash}` : null,

    created_at: fecha(data.created_at),
    updated_at: fecha(data.updated_at),

    ...extra,
  }
}

function normalizarArma(id, data) {
  const fotos = Array.isArray(data.fotos) ? data.fotos : []

  return {
    id,
    usuario_id: data.usuario_id || null,

    historial_arma_id: data.historial_arma_id || null,
    numero_duenos: numero(data.numero_duenos || 1, 1),

    arma_nombre: data.arma_nombre || '',
    arma_categoria: data.arma_categoria || '',
    arma_marca: data.arma_marca || '',
    arma_modelo: data.arma_modelo || '',
    arma_numero_serie: data.arma_numero_serie || '',

    condicion_actual: data.condicion_actual || 'Bueno',
    estado_propiedad: data.estado_propiedad || 'disponible',

    precio_compra_crypto: Number(data.precio_compra_crypto || 0),
    precio_compra_eur: Number(data.precio_compra_eur || 0),
    crypto: data.crypto || 'ETH',

    fotos,
    foto_principal: data.foto_principal || fotos[0] || null,

    observacion: data.observacion || '',
    articulo_origen_id: data.articulo_origen_id || null,
    compra_id: data.compra_id || null,

    tx_hash: data.tx_hash || null,
    red: data.red || null,
    wallet_comprador: data.wallet_comprador || null,
    wallet_destino: data.wallet_destino || null,
    importe_pagado_eth: data.importe_pagado_eth || null,
    bloque_pago: data.bloque_pago || null,
    etherscan_url: data.tx_hash ? `https://sepolia.etherscan.io/tx/${data.tx_hash}` : null,

    fecha_venta_inicio: fecha(data.fecha_venta_inicio),
    venta_expira_en: fecha(data.venta_expira_en),

    en_venta: data.en_venta === true,
    articulo_venta_id: data.articulo_venta_id || null,

    created_at: fecha(data.created_at),
    updated_at: fecha(data.updated_at),
  }
}

function normalizarTransaccionHistorial(id, data, adminView = false) {
  const salida = {
    id,
    historial_arma_id: data.historial_arma_id || null,
    compra_id: data.compra_id || null,
    articulo_id: data.articulo_id || null,

    orden: numero(data.orden || 1, 1),
    tipo: data.tipo || 'compra',

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

  if (adminView) {
    salida.vendedor_id = data.vendedor_id || null
    salida.comprador_id = data.comprador_id || null
    salida.vendedor_nombre = data.vendedor_nombre || null
    salida.vendedor_email = data.vendedor_email || null
    salida.comprador_nombre = data.comprador_nombre || null
    salida.comprador_email = data.comprador_email || null
  }

  return salida
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

function fechaExpiracionVenta() {
  const d = new Date()
  d.setHours(d.getHours() + 24)
  return d
}

function estaVentaExpirada(data) {
  if (!data) return false
  if (!data.usuario_arma_id) return false
  if (data.estado !== 'activo') return false
  if (!data.venta_expira_en) return false

  const expira = typeof data.venta_expira_en.toDate === 'function'
    ? data.venta_expira_en.toDate()
    : new Date(data.venta_expira_en)

  return expira <= new Date()
}

async function quitarVentaAutomatica(articuloDoc) {
  const articulo = articuloDoc.data()

  await articuloDoc.ref.update({
    estado: 'expirado',
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
}

async function limpiarVentasExpiradas() {
  const snap = await db
    .collection('articulos')
    .where('estado', '==', 'activo')
    .get()

  const promesas = []

  snap.docs.forEach(doc => {
    if (estaVentaExpirada(doc.data())) {
      promesas.push(quitarVentaAutomatica(doc))
    }
  })

  await Promise.all(promesas)
}

async function sincronizarArmasEnVenta() {
  const snap = await db
    .collection('usuario_armas')
    .where('en_venta', '==', true)
    .get()

  const promesas = []

  for (const doc of snap.docs) {
    const arma = doc.data()

    if (!arma.articulo_venta_id) continue

    const articuloDoc = await db
      .collection('articulos')
      .doc(arma.articulo_venta_id)
      .get()

    if (!articuloDoc.exists) {
      promesas.push(doc.ref.update({
        en_venta: false,
        articulo_venta_id: null,
        estado_propiedad: 'disponible',
        venta_expira_en: null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }))

      continue
    }

    const articulo = articuloDoc.data()

    if (articulo.estado === 'vendido') {
      promesas.push(doc.ref.update({
        en_venta: false,
        articulo_venta_id: null,
        estado_propiedad: 'vendida',
        venta_expira_en: null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }))
    }

    if (articulo.estado === 'retirado' || articulo.estado === 'expirado' || articulo.estado === 'eliminado') {
      promesas.push(doc.ref.update({
        en_venta: false,
        articulo_venta_id: null,
        estado_propiedad: 'disponible',
        venta_expira_en: null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }))
    }
  }

  await Promise.all(promesas)
}

async function verificarPagoSepolia(txHash, precioEthEsperado) {
  if (!txHash) {
    throw new Error('TX_HASH_OBLIGATORIO')
  }

  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error('RPC_NO_CONFIGURADO')
  }

  if (!process.env.MARKET_WALLET_ADDRESS) {
    throw new Error('WALLET_NO_CONFIGURADA')
  }

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL)
  const tx = await provider.getTransaction(txHash)

  if (!tx) {
    throw new Error('TX_NO_EXISTE')
  }

  const receipt = await provider.getTransactionReceipt(txHash)

  if (!receipt || receipt.status !== 1) {
    throw new Error('TX_NO_CONFIRMADA')
  }

  const destinoReal = String(tx.to || '').toLowerCase()
  const destinoEsperado = String(process.env.MARKET_WALLET_ADDRESS).toLowerCase()

  if (destinoReal !== destinoEsperado) {
    throw new Error('DESTINO_INCORRECTO')
  }

  const esperadoWei = ethers.parseEther(String(precioEthEsperado))
  const pagadoWei = tx.value

  if (pagadoWei < esperadoWei) {
    throw new Error('IMPORTE_INSUFICIENTE')
  }

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value_eth: ethers.formatEther(tx.value),
    blockNumber: receipt.blockNumber,
  }
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
    }
  } catch (_) {
    return null
  }
}

async function obtenerHistorialPublico(historialArmaId) {
  if (!historialArmaId) return []

  const snap = await db
    .collection('historial_armas')
    .doc(historialArmaId)
    .collection('transacciones')
    .get()

  return snap.docs
    .map(doc => normalizarTransaccionHistorial(doc.id, doc.data(), false))
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0))
}

// ─── POST /api/articulos ─────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  [
    body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
    body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria'),
    body('categoria').notEmpty().withMessage('La categoría es obligatoria'),
    body('condicion').notEmpty().withMessage('La condición es obligatoria'),
    body('crypto').isIn(['ETH', 'BTC']).withMessage('Cripto no válida'),
    body('precio_crypto').isFloat({ min: 0.00001 }).withMessage('Precio no válido'),
    body('fotos').isArray({ min: 1 }).withMessage('Se requiere al menos una foto'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const {
      titulo,
      descripcion,
      categoria,
      condicion,
      crypto,
      precio_crypto,
      precio_eur,
      peso_tier,
      tamano,
      envio_precio,
      comision,
      neto_eur,
      fotos,
    } = req.body

    try {
      const ref = db.collection('articulos').doc()

      await ref.set({
        id: ref.id,
        usuario_id: req.usuario.id,

        usuario_arma_id: null,
        articulo_origen_id: null,
        compra_id: null,

        historial_arma_id: null,
        numero_duenos: 1,

        titulo,
        descripcion,
        categoria,
        condicion,

        crypto,
        precio_crypto: Number(precio_crypto),
        precio_eur: precio_eur !== undefined && precio_eur !== null ? Number(precio_eur) : null,

        peso_tier: peso_tier || null,
        tamano: tamano || null,
        envio_precio: envio_precio !== undefined && envio_precio !== null ? Number(envio_precio) : null,
        comision: comision !== undefined && comision !== null ? Number(comision) : null,
        neto_eur: neto_eur !== undefined && neto_eur !== null ? Number(neto_eur) : null,

        estado: 'activo',

        fecha_venta_inicio: null,
        venta_expira_en: null,

        fotos,
        foto_principal: fotos[0] || null,

        observacion_venta: null,
        comprador_id: null,

        eliminado_por_admin: false,
        motivo_eliminacion: null,
        admin_eliminador_id: null,
        eliminado_admin_en: null,

        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      return res.status(201).json({
        mensaje: 'Artículo publicado correctamente',
        id: ref.id,
      })
    } catch (err) {
      console.error('[POST /articulos]', err)
      return res.status(500).json({ error: 'Error al publicar el artículo' })
    }
  }
)

// ─── GET /api/articulos/armeria ──────────────────────────────────────────

router.get('/armeria', authMiddleware, async (req, res) => {
  try {
    await limpiarVentasExpiradas()
    await sincronizarArmasEnVenta()

    const snap = await db
      .collection('usuario_armas')
      .where('usuario_id', '==', req.usuario.id)
      .get()

    const armas = snap.docs
      .map(doc => normalizarArma(doc.id, doc.data()))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ armas })
  } catch (err) {
    console.error('[GET /articulos/armeria]', err)
    return res.status(500).json({ error: 'Error al obtener tu armería' })
  }
})

// ─── GET /api/articulos/armeria/:id/historial ────────────────────────────

router.get('/armeria/:id/historial', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const armaDoc = await db.collection('usuario_armas').doc(id).get()

    if (!armaDoc.exists) {
      return res.status(404).json({ error: 'Arma no encontrada' })
    }

    const arma = armaDoc.data()

    if (arma.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este historial' })
    }

    const historialArmaId = arma.historial_arma_id

    if (!historialArmaId) {
      return res.json({
        numero_duenos: numero(arma.numero_duenos || 1, 1),
        historial: [],
      })
    }

    const historial = await obtenerHistorialPublico(historialArmaId)

    return res.json({
      historial_arma_id: historialArmaId,
      numero_duenos: numero(arma.numero_duenos || historial.length + 1 || 1, 1),
      historial,
    })
  } catch (err) {
    console.error('[GET /articulos/armeria/:id/historial]', err)
    return res.status(500).json({ error: 'Error al obtener el historial del arma' })
  }
})

// ─── POST /api/articulos/armeria/:id/vender ──────────────────────────────

router.post('/armeria/:id/vender', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { precio_crypto, precio_eur, condicion, observacion } = req.body

  if (!precio_crypto || Number(precio_crypto) <= 0) {
    return res.status(422).json({ error: 'Introduce un precio válido' })
  }

  if (!condicion) {
    return res.status(422).json({ error: 'Selecciona el estado del arma' })
  }

  try {
    const armaRef = db.collection('usuario_armas').doc(id)
    const armaDoc = await armaRef.get()

    if (!armaDoc.exists) {
      return res.status(404).json({ error: 'Arma no encontrada' })
    }

    const arma = armaDoc.data()

    if (arma.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para vender esta arma' })
    }

    if (arma.en_venta === true) {
      return res.status(409).json({ error: 'Esta arma ya está en venta' })
    }

    if (arma.estado_propiedad === 'vendida') {
      return res.status(409).json({ error: 'Esta arma ya fue vendida' })
    }

    const fotos = Array.isArray(arma.fotos) ? arma.fotos : []
    const articuloRef = db.collection('articulos').doc()
    const ventaExpiraEn = fechaExpiracionVenta()

    await articuloRef.set({
      id: articuloRef.id,
      usuario_id: req.usuario.id,

      usuario_arma_id: armaRef.id,
      articulo_origen_id: arma.articulo_origen_id || null,
      compra_id: arma.compra_id || null,

      historial_arma_id: arma.historial_arma_id || null,
      numero_duenos: numero(arma.numero_duenos || 1, 1),

      titulo: arma.arma_nombre,
      descripcion: observacion || arma.observacion || 'Arma comprada previamente en AK-MARKET.',
      categoria: arma.arma_categoria || 'Rifles AEG',
      condicion,

      crypto: arma.crypto || 'ETH',
      precio_crypto: Number(precio_crypto),
      precio_eur: precio_eur !== undefined && precio_eur !== null ? Number(precio_eur) : null,

      peso_tier: null,
      tamano: null,
      envio_precio: null,
      comision: null,
      neto_eur: null,

      estado: 'activo',
      fecha_venta_inicio: admin.firestore.FieldValue.serverTimestamp(),
      venta_expira_en: ventaExpiraEn,

      fotos,
      foto_principal: arma.foto_principal || fotos[0] || null,

      observacion_venta: observacion || null,
      comprador_id: null,

      eliminado_por_admin: false,
      motivo_eliminacion: null,
      admin_eliminador_id: null,
      eliminado_admin_en: null,

      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    await armaRef.update({
      en_venta: true,
      articulo_venta_id: articuloRef.id,
      condicion_actual: condicion,
      estado_propiedad: 'en_venta',
      observacion: observacion || arma.observacion || null,
      fecha_venta_inicio: admin.firestore.FieldValue.serverTimestamp(),
      venta_expira_en: ventaExpiraEn,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(201).json({
      mensaje: 'Arma puesta en venta correctamente',
      articulo_id: articuloRef.id,
      venta_expira_en: ventaExpiraEn,
    })
  } catch (err) {
    console.error('[POST /articulos/armeria/:id/vender]', err)
    return res.status(500).json({ error: 'Error al poner el arma en venta' })
  }
})

// ─── POST /api/articulos/armeria/:id/quitar-venta ────────────────────────

router.post('/armeria/:id/quitar-venta', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const armaRef = db.collection('usuario_armas').doc(id)
    const armaDoc = await armaRef.get()

    if (!armaDoc.exists) {
      return res.status(404).json({ error: 'Arma no encontrada' })
    }

    const arma = armaDoc.data()

    if (arma.usuario_id !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta arma' })
    }

    if (arma.en_venta !== true || !arma.articulo_venta_id) {
      return res.status(409).json({ error: 'Esta arma no está en venta' })
    }

    const articuloRef = db.collection('articulos').doc(arma.articulo_venta_id)
    const articuloDoc = await articuloRef.get()

    if (articuloDoc.exists) {
      const articulo = articuloDoc.data()

      if (articulo.usuario_id === req.usuario.id && articulo.estado === 'activo') {
        await articuloRef.update({
          estado: 'retirado',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }

    await armaRef.update({
      en_venta: false,
      articulo_venta_id: null,
      estado_propiedad: 'disponible',
      venta_expira_en: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.json({
      mensaje: 'Arma retirada de la venta correctamente',
    })
  } catch (err) {
    console.error('[POST /articulos/armeria/:id/quitar-venta]', err)
    return res.status(500).json({ error: 'Error al quitar el arma de venta' })
  }
})

// ─── POST /api/articulos/:id/comprar ─────────────────────────────────────

router.post('/:id/comprar', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { txHash } = req.body

  const articuloRef = db.collection('articulos').doc(id)
  const compraRef = db.collection('compras').doc()
  const usuarioArmaRef = db.collection('usuario_armas').doc()

  try {
    let vendedorId = null
    let tituloArticulo = ''
    let historialArmaIdRespuesta = null
    let numeroDuenosRespuesta = 1

    await db.runTransaction(async (transaction) => {
      const articuloDoc = await transaction.get(articuloRef)

      if (!articuloDoc.exists) {
        throw new Error('ARTICULO_NO_EXISTE')
      }

      const articulo = articuloDoc.data()

      if (estaVentaExpirada(articulo)) {
        throw new Error('VENTA_EXPIRADA')
      }

      if (articulo.estado !== 'activo') {
        throw new Error('ARTICULO_NO_DISPONIBLE')
      }

      if (articulo.usuario_id === req.usuario.id) {
        throw new Error('COMPRA_PROPIA')
      }

      if (articulo.crypto !== 'ETH') {
        throw new Error('SOLO_ETH_SEPOLIA')
      }

      const pagoUsadoRef = db.collection('pagos_usados').doc(String(txHash))
      const pagoUsadoDoc = await transaction.get(pagoUsadoRef)

      if (pagoUsadoDoc.exists) {
        throw new Error('TX_YA_USADA')
      }

      const pago = await verificarPagoSepolia(txHash, articulo.precio_crypto)
      const fotos = Array.isArray(articulo.fotos) ? articulo.fotos : []

      const vendedor = await obtenerUsuarioBasico(articulo.usuario_id)
      const comprador = await obtenerUsuarioBasico(req.usuario.id)

      const numeroDuenosAnterior = numero(articulo.numero_duenos || 1, 1)
      const nuevoNumeroDuenos = numeroDuenosAnterior + 1

      const historialArmaRef = articulo.historial_arma_id
        ? db.collection('historial_armas').doc(articulo.historial_arma_id)
        : db.collection('historial_armas').doc()

      const historialArmaId = historialArmaRef.id
      const historialTransaccionRef = historialArmaRef.collection('transacciones').doc()

      vendedorId = articulo.usuario_id
      tituloArticulo = articulo.titulo || ''
      historialArmaIdRespuesta = historialArmaId
      numeroDuenosRespuesta = nuevoNumeroDuenos

      transaction.set(pagoUsadoRef, {
        tx_hash: txHash,
        articulo_id: articuloRef.id,
        comprador_id: req.usuario.id,
        historial_arma_id: historialArmaId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      transaction.set(historialArmaRef, {
        id: historialArmaId,

        arma_nombre: articulo.titulo || '',
        arma_categoria: articulo.categoria || '',
        arma_marca: articulo.marca || '',
        arma_modelo: articulo.modelo || '',
        arma_numero_serie: articulo.numero_serie || '',

        primera_publicacion_articulo_id: articulo.articulo_origen_id || articuloRef.id,
        ultimo_articulo_id: articuloRef.id,
        ultima_compra_id: compraRef.id,

        propietario_actual_id: req.usuario.id,
        propietario_anterior_id: articulo.usuario_id,

        numero_duenos: nuevoNumeroDuenos,
        transacciones_totales: nuevoNumeroDuenos - 1,

        duenios_ids: admin.firestore.FieldValue.arrayUnion(articulo.usuario_id, req.usuario.id),

        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })

      transaction.set(historialTransaccionRef, {
        id: historialTransaccionRef.id,
        historial_arma_id: historialArmaId,

        compra_id: compraRef.id,
        articulo_id: articuloRef.id,

        orden: nuevoNumeroDuenos - 1,
        tipo: 'compra',

        vendedor_id: articulo.usuario_id,
        vendedor_nombre: vendedor?.nombre || null,
        vendedor_email: vendedor?.email || null,

        comprador_id: req.usuario.id,
        comprador_nombre: comprador?.nombre || null,
        comprador_email: comprador?.email || null,

        titulo: articulo.titulo || '',
        categoria: articulo.categoria || '',
        condicion: articulo.condicion || '',

        crypto: articulo.crypto || 'ETH',
        precio_crypto: Number(articulo.precio_crypto || 0),
        precio_eur: Number(articulo.precio_eur || 0),

        tx_hash: txHash,
        red: 'sepolia',
        wallet_comprador: pago.from,
        wallet_destino: pago.to,
        importe_pagado_eth: pago.value_eth,
        bloque_pago: pago.blockNumber,

        created_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      transaction.set(compraRef, {
        id: compraRef.id,
        comprador_id: req.usuario.id,
        vendedor_id: articulo.usuario_id,

        historial_arma_id: historialArmaId,
        numero_duenos: nuevoNumeroDuenos,

        articulo_id: articuloRef.id,
        titulo: articulo.titulo || '',
        categoria: articulo.categoria || '',
        condicion: articulo.condicion || '',

        crypto: articulo.crypto || 'ETH',
        precio_crypto: Number(articulo.precio_crypto || 0),
        precio_eur: Number(articulo.precio_eur || 0),

        tx_hash: txHash,
        red: 'sepolia',
        wallet_comprador: pago.from,
        wallet_destino: pago.to,
        importe_pagado_eth: pago.value_eth,
        bloque_pago: pago.blockNumber,

        estado: 'completada',

        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      transaction.set(usuarioArmaRef, {
        id: usuarioArmaRef.id,
        usuario_id: req.usuario.id,

        historial_arma_id: historialArmaId,
        numero_duenos: nuevoNumeroDuenos,

        arma_nombre: articulo.titulo || '',
        arma_categoria: articulo.categoria || '',
        arma_marca: articulo.marca || '',
        arma_modelo: articulo.modelo || '',
        arma_numero_serie: articulo.numero_serie || '',

        condicion_actual: articulo.condicion || 'Bueno',
        estado_propiedad: 'disponible',

        precio_compra_crypto: Number(articulo.precio_crypto || 0),
        precio_compra_eur: Number(articulo.precio_eur || 0),
        crypto: articulo.crypto || 'ETH',

        tx_hash: txHash,
        red: 'sepolia',
        wallet_comprador: pago.from,
        wallet_destino: pago.to,
        importe_pagado_eth: pago.value_eth,
        bloque_pago: pago.blockNumber,

        fotos,
        foto_principal: articulo.foto_principal || fotos[0] || null,

        observacion: 'Comprada en AK-MARKET.',
        articulo_origen_id: articulo.articulo_origen_id || articuloRef.id,
        compra_id: compraRef.id,

        en_venta: false,
        articulo_venta_id: null,
        fecha_venta_inicio: null,
        venta_expira_en: null,

        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      transaction.update(articuloRef, {
        estado: 'vendido',
        comprador_id: req.usuario.id,
        compra_id: compraRef.id,

        historial_arma_id: historialArmaId,
        numero_duenos: nuevoNumeroDuenos,

        tx_hash: txHash,
        red: 'sepolia',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      if (articulo.usuario_arma_id) {
        const armaVendedorRef = db.collection('usuario_armas').doc(articulo.usuario_arma_id)

        transaction.update(armaVendedorRef, {
          en_venta: false,
          articulo_venta_id: null,
          estado_propiedad: 'vendida',
          venta_expira_en: null,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    })

    await crearNotificacion(
      vendedorId,
      'sistema',
      'Artículo vendido',
      `Tu artículo "${tituloArticulo}" ha sido comprado.`
    ).catch(() => {})

    return res.status(201).json({
      mensaje: 'Compra realizada correctamente',
      compra_id: compraRef.id,
      usuario_arma_id: usuarioArmaRef.id,
      historial_arma_id: historialArmaIdRespuesta,
      numero_duenos: numeroDuenosRespuesta,
      tx_hash: txHash,
    })
  } catch (err) {
    console.error('[POST /articulos/:id/comprar]', err)

    if (err.message === 'ARTICULO_NO_EXISTE') {
      return res.status(404).json({ error: 'Artículo no encontrado' })
    }

    if (err.message === 'ARTICULO_NO_DISPONIBLE') {
      return res.status(409).json({ error: 'Este artículo ya no está disponible' })
    }

    if (err.message === 'VENTA_EXPIRADA') {
      await limpiarVentasExpiradas().catch(() => {})
      return res.status(409).json({ error: 'Esta venta ha expirado' })
    }

    if (err.message === 'COMPRA_PROPIA') {
      return res.status(400).json({ error: 'No puedes comprar tu propio artículo' })
    }

    if (err.message === 'SOLO_ETH_SEPOLIA') {
      return res.status(400).json({ error: 'Solo se pueden comprar artículos en ETH usando Sepolia' })
    }

    if (err.message === 'TX_YA_USADA') {
      return res.status(400).json({ error: 'Esta transacción ya se ha usado para otra compra' })
    }

    if (err.message === 'TX_HASH_OBLIGATORIO') {
      return res.status(400).json({ error: 'Falta la transacción de Sepolia' })
    }

    if (err.message === 'RPC_NO_CONFIGURADO') {
      return res.status(500).json({ error: 'Falta configurar SEPOLIA_RPC_URL en el backend' })
    }

    if (err.message === 'WALLET_NO_CONFIGURADA') {
      return res.status(500).json({ error: 'Falta configurar MARKET_WALLET_ADDRESS en el backend' })
    }

    if (err.message === 'TX_NO_EXISTE') {
      return res.status(400).json({ error: 'La transacción no existe en Sepolia' })
    }

    if (err.message === 'TX_NO_CONFIRMADA') {
      return res.status(400).json({ error: 'La transacción todavía no está confirmada' })
    }

    if (err.message === 'DESTINO_INCORRECTO') {
      return res.status(400).json({ error: 'La transacción no fue enviada a la wallet correcta' })
    }

    if (err.message === 'IMPORTE_INSUFICIENTE') {
      return res.status(400).json({ error: 'El importe pagado es menor al precio del artículo' })
    }

    return res.status(500).json({ error: 'Error al comprar el artículo' })
  }
})

// ─── GET /api/articulos/mis ──────────────────────────────────────────────

router.get('/mis', authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection('articulos')
      .where('usuario_id', '==', req.usuario.id)
      .get()

    const articulos = snap.docs
      .map(doc => normalizarArticulo(doc.id, doc.data()))
      .filter(a => a.estado !== 'eliminado')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ articulos })
  } catch (err) {
    console.error('[GET /articulos/mis]', err)
    return res.status(500).json({ error: 'Error al obtener tus artículos' })
  }
})

// ─── DELETE /api/articulos/:id ───────────────────────────────────────────

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const ref = db.collection('articulos').doc(id)
    const doc = await ref.get()

    if (!doc.exists || doc.data().usuario_id !== req.usuario.id) {
      return res.status(404).json({ error: 'Artículo no encontrado o no tienes permiso' })
    }

    await ref.update({
      estado: 'eliminado',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    const data = doc.data()

    if (data.usuario_arma_id) {
      await db.collection('usuario_armas').doc(data.usuario_arma_id).update({
        en_venta: false,
        articulo_venta_id: null,
        estado_propiedad: 'disponible',
        venta_expira_en: null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {})
    }

    return res.json({ mensaje: 'Artículo eliminado correctamente' })
  } catch (err) {
    console.error('[DELETE /articulos/:id]', err)
    return res.status(500).json({ error: 'Error al eliminar el artículo' })
  }
})

// ─── GET /api/articulos ──────────────────────────────────────────────────

router.get('/', authMiddleware, async (req, res) => {
  try {
    await limpiarVentasExpiradas()

    const { categoria, condicion, crypto } = req.query

    const snap = await db
      .collection('articulos')
      .where('estado', '==', 'activo')
      .get()

    const articulos = []

    for (const doc of snap.docs) {
      const data = doc.data()

      if (categoria && data.categoria !== categoria) continue
      if (condicion && data.condicion !== condicion) continue
      if (crypto && data.crypto !== crypto) continue

      let seller = 'Usuario'
      let seller_avatar = null

      if (data.usuario_id) {
        const userDoc = await db.collection('usuarios').doc(data.usuario_id).get()

        if (userDoc.exists) {
          const u = userDoc.data()
          seller = u.nombre || 'Usuario'
          seller_avatar = u.avatar || null
        }
      }

      articulos.push(normalizarArticulo(doc.id, data, {
        seller,
        seller_avatar,
      }))
    }

    articulos.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return res.json({ articulos })
  } catch (err) {
    console.error('[GET /articulos]', err)
    return res.status(500).json({ error: 'Error al obtener los artículos' })
  }
})

module.exports = router