import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore'

import { auth, db } from '../firebase/firebase'
import { authService } from './auth'

function esperarUsuario() {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub()
      resolve(user)
    })
  })
}

async function usuarioActual() {
  return auth.currentUser || await esperarUsuario()
}

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function normalizarProducto(id, data) {
  const precioEUR = numero(data.precioEUR ?? data.precio_eur)
  const precioETH = numero(data.precioETH ?? data.precio_crypto)

  return {
    id,

    titulo: data.titulo || 'Producto sin título',
    descripcion: data.descripcion || '',
    categoria: data.categoria || '',
    condicion: data.condicion || '',
    marca: data.marca || '',
    modelo: data.modelo || '',
    numeroSerie: data.numeroSerie || '',

    precioEUR,
    precioETH,
    precio_eur: precioEUR,
    precio_crypto: precioETH,
    crypto: data.crypto || 'ETH',

    imagen: data.imagen || data.foto_principal || '',
    foto_principal: data.foto_principal || data.imagen || '',

    activo: data.activo !== false,
    estado: data.estado || 'en_venta',
    enVenta: data.enVenta !== false,

    ownerUid: data.ownerUid || '',
    ownerNombre: data.ownerNombre || '',
    ownerEmail: data.ownerEmail || '',
    ownerWallet: data.ownerWallet || '',

    propietarioActual: data.propietarioActual || data.ownerWallet || '',
    walletActual: data.walletActual || data.ownerWallet || '',

    propietariosAnteriores: Array.isArray(data.propietariosAnteriores)
      ? data.propietariosAnteriores
      : [],

    numPropietarios: numero(data.numPropietarios),

    contrato: data.contrato || '',
    tokenId: data.tokenId || '',
    txHashCreacion: data.txHashCreacion || '',
    txHashUltimaTransferencia: data.txHashUltimaTransferencia || '',
    estadoBlockchain: data.estadoBlockchain || 'pendiente_mint',

    fechaCreacion: data.fechaCreacion || data.created_at || '',
    created_at: data.created_at || data.fechaCreacion || '',
    fechaUltimaOperacion: data.fechaUltimaOperacion || '',
  }
}

async function obtenerUsuarioLogueado() {
  const firebaseUser = await usuarioActual()

  if (!firebaseUser) {
    throw new Error('Debes iniciar sesión')
  }

  const data = await authService.me()

  if (!data?.usuario) {
    throw new Error('No se ha podido obtener el usuario')
  }

  return {
    uid: firebaseUser.uid,
    email: data.usuario.email || firebaseUser.email || '',
    nombre: data.usuario.nombre || firebaseUser.displayName || '',
    wallet: data.usuario.wallet || '',
  }
}

async function obtenerProducto(productId) {
  const ref = doc(db, 'products', productId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('El producto no existe')
  }

  return {
    ref,
    producto: normalizarProducto(snap.id, snap.data()),
    raw: snap.data(),
  }
}

async function registrarHistorial(productId, movimiento) {
  await addDoc(collection(db, 'products', productId, 'historial'), {
    ...movimiento,
    fecha: new Date().toISOString(),
  })
}

function calcularPrecioETH(precioEUR, ethRateEUR) {
  const eur = numero(precioEUR)
  const rate = numero(ethRateEUR)

  if (!eur || !rate) return 0

  return Number((eur / rate).toFixed(8))
}

export const armeriaService = {
  listarMiArmeria: async () => {
    const usuario = await obtenerUsuarioLogueado()

    const snap = await getDocs(collection(db, 'products'))

    const productos = snap.docs
      .map((d) => normalizarProducto(d.id, d.data()))
      .filter((p) => p.ownerUid === usuario.uid)
      .filter((p) => p.activo !== false)
      .sort((a, b) => {
        const fa = new Date(a.fechaUltimaOperacion || a.fechaCreacion || 0)
        const fb = new Date(b.fechaUltimaOperacion || b.fechaCreacion || 0)
        return fb - fa
      })

    return {
      usuario,
      productos,
    }
  },

  listarHistorial: async (productId) => {
    const snap = await getDocs(collection(db, 'products', productId, 'historial'))

    return snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },

  comprarProducto: async (productId) => {
    const usuario = await obtenerUsuarioLogueado()
    const { ref, producto } = await obtenerProducto(productId)

    if (!producto.activo) {
      throw new Error('Este producto no está activo')
    }

    if (!producto.enVenta) {
      throw new Error('Este producto no está en venta')
    }

    if (!usuario.wallet) {
      throw new Error('Tu usuario no tiene wallet asignada')
    }

    if (producto.ownerUid === usuario.uid) {
      throw new Error('Este producto ya pertenece a tu armería')
    }

    const fecha = new Date().toISOString()

    const anteriorPropietario = producto.ownerUid
      ? {
          uid: producto.ownerUid,
          nombre: producto.ownerNombre || '',
          email: producto.ownerEmail || '',
          wallet: producto.ownerWallet || '',
          fechaHasta: fecha,
        }
      : null

    const propietariosAnteriores = anteriorPropietario
      ? [...producto.propietariosAnteriores, anteriorPropietario]
      : producto.propietariosAnteriores

    const numPropietarios = producto.ownerUid
      ? producto.numPropietarios + 1
      : 1

    await updateDoc(ref, {
      estado: 'comprado',
      enVenta: false,
      activo: true,

      ownerUid: usuario.uid,
      ownerNombre: usuario.nombre,
      ownerEmail: usuario.email,
      ownerWallet: usuario.wallet,

      propietarioActual: usuario.wallet,
      walletActual: usuario.wallet,

      propietariosAnteriores,
      numPropietarios,

      fechaUltimaOperacion: fecha,

      txHashUltimaTransferencia: '',
      estadoBlockchain: producto.estadoBlockchain || 'pendiente_mint',
    })

    await registrarHistorial(productId, {
      tipo: producto.ownerUid ? 'transferencia' : 'compra',

      fromUid: producto.ownerUid || '',
      fromNombre: producto.ownerNombre || 'AK-MARKET',
      fromEmail: producto.ownerEmail || '',
      fromWallet: producto.ownerWallet || '',

      toUid: usuario.uid,
      toNombre: usuario.nombre,
      toEmail: usuario.email,
      toWallet: usuario.wallet,

      precioEUR: producto.precioEUR,
      precioETH: producto.precioETH,

      txHash: '',
      red: 'sepolia',
      estadoBlockchain: 'pendiente',
    })

    return {
      mensaje: 'Producto añadido a tu armería',
    }
  },

  ponerEnVenta: async (productId, precioEUR, ethRateEUR) => {
    const usuario = await obtenerUsuarioLogueado()
    const { ref, producto } = await obtenerProducto(productId)

    if (producto.ownerUid !== usuario.uid) {
      throw new Error('No puedes vender un producto que no es tuyo')
    }

    const precioEURFinal = numero(precioEUR)
    const precioETHFinal = calcularPrecioETH(precioEURFinal, ethRateEUR)

    if (!precioEURFinal || precioEURFinal <= 0) {
      throw new Error('Introduce un precio en euros válido')
    }

    if (!precioETHFinal || precioETHFinal <= 0) {
      throw new Error('No se ha podido calcular el precio en ETH')
    }

    const fecha = new Date().toISOString()

    await updateDoc(ref, {
      estado: 'reventa',
      enVenta: true,
      activo: true,

      precioEUR: precioEURFinal,
      precioETH: precioETHFinal,
      precio_eur: precioEURFinal,
      precio_crypto: precioETHFinal,

      fechaUltimaOperacion: fecha,
    })

    await registrarHistorial(productId, {
      tipo: 'puesta_en_venta',

      fromUid: usuario.uid,
      fromNombre: usuario.nombre,
      fromEmail: usuario.email,
      fromWallet: usuario.wallet,

      toUid: '',
      toNombre: '',
      toEmail: '',
      toWallet: '',

      precioEUR: precioEURFinal,
      precioETH: precioETHFinal,

      txHash: '',
      red: 'sepolia',
      estadoBlockchain: 'sin_transaccion',
    })

    return {
      mensaje: 'Producto puesto a la venta',
    }
  },

  quitarDeVenta: async (productId) => {
    const usuario = await obtenerUsuarioLogueado()
    const { ref, producto } = await obtenerProducto(productId)

    if (producto.ownerUid !== usuario.uid) {
      throw new Error('No puedes modificar un producto que no es tuyo')
    }

    await updateDoc(ref, {
      estado: 'comprado',
      enVenta: false,
      fechaUltimaOperacion: new Date().toISOString(),
    })

    await registrarHistorial(productId, {
      tipo: 'retirada_de_venta',

      fromUid: usuario.uid,
      fromNombre: usuario.nombre,
      fromEmail: usuario.email,
      fromWallet: usuario.wallet,

      toUid: '',
      toNombre: '',
      toEmail: '',
      toWallet: '',

      precioEUR: producto.precioEUR,
      precioETH: producto.precioETH,

      txHash: '',
      red: 'sepolia',
      estadoBlockchain: 'sin_transaccion',
    })

    return {
      mensaje: 'Producto retirado de la venta',
    }
  },
}