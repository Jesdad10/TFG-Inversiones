<<<<<<< HEAD
const BASE = 'http://localhost:3001/api/articulos'

function token() {
  return localStorage.getItem('token')
}

function authHeaders(json = false) {
  const headers = {
    Authorization: `Bearer ${token()}`,
  }

  if (json) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

export const articulosService = {
  crear: (datos) =>
    fetch(BASE, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al publicar el artículo')
      return data
    }),

  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString()

    return fetch(`${BASE}${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener artículos')
      return data
    })
  },

  misProductos: () =>
    fetch(`${BASE}/mis`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener tus productos')
      return data
    }),

  eliminar: (id) =>
    fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al eliminar')
      return data
    }),

  comprar: (id, txHash) =>
    fetch(`${BASE}/${id}/comprar`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ txHash }),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al comprar el artículo')
      return data
    }),

  armeria: () =>
    fetch(`${BASE}/armeria`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener tu armería')
      return data
    }),

  venderArma: (id, datos) =>
    fetch(`${BASE}/armeria/${id}/vender`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al poner el arma en venta')
      return data
    }),

  quitarVentaArma: (id) =>
    fetch(`${BASE}/armeria/${id}/quitar-venta`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({}),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al quitar el arma de venta')
      return data
    }),
=======
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'

import { auth, db } from '../firebase/firebase'

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
    categoria: data.categoria || 'Accesorios',
    condicion: data.condicion || 'Nuevo',

    marca: data.marca || '',
    modelo: data.modelo || '',
    numeroSerie: data.numeroSerie || '',

    estado: data.estado || 'en_venta',
    activo: data.activo !== false,
    enVenta: data.enVenta !== false,

    precioEUR,
    precioETH,

    precio_eur: precioEUR,
    precio_crypto: precioETH,
    crypto: data.crypto || 'ETH',

    imagen: data.imagen || '',
    foto_principal: data.foto_principal || data.imagen || data.fotos?.[0] || '',

    fechaCreacion: data.fechaCreacion || data.created_at || '',
    created_at: data.created_at || data.fechaCreacion || '',

    seller: data.ownerNombre || data.seller || data.vendedor_nombre || 'AK-MARKET',
    seller_avatar: data.seller_avatar || '',

    ownerUid: data.ownerUid || '',
    ownerNombre: data.ownerNombre || '',
    ownerEmail: data.ownerEmail || '',
    ownerWallet: data.ownerWallet || '',

    walletActual: data.walletActual || data.ownerWallet || '',
    propietarioActual: data.propietarioActual || data.ownerWallet || '',

    propietariosAnteriores: Array.isArray(data.propietariosAnteriores)
      ? data.propietariosAnteriores
      : [],

    numPropietarios: numero(data.numPropietarios),

    contrato: data.contrato || '',
    tokenId: data.tokenId || '',
    txHashCreacion: data.txHashCreacion || '',
    txHashUltimaTransferencia: data.txHashUltimaTransferencia || '',
    estadoBlockchain: data.estadoBlockchain || 'pendiente_mint',
  }
}

export const articulosService = {
  listar: async () => {
    const snap = await getDocs(collection(db, 'products'))

    const articulos = snap.docs
      .map((d) => normalizarProducto(d.id, d.data()))
      .filter((p) => p.activo !== false)
      .filter((p) => p.enVenta !== false)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return { articulos }
  },

  misProductos: async () => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('Debes iniciar sesión')
    }

    const snap = await getDocs(collection(db, 'products'))

    const articulos = snap.docs
      .map((d) => normalizarProducto(d.id, d.data()))
      .filter((p) => p.usuario_id === user.uid || p.ownerUid === user.uid)
      .filter((p) => p.activo !== false)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return { articulos }
  },

  crear: async (datos) => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('Debes iniciar sesión para publicar un artículo')
    }

    const precioEUR = numero(datos.precioEUR ?? datos.precio_eur)
    const precioETH = numero(datos.precioETH ?? datos.precio_crypto)
    const fecha = new Date().toISOString()

    const producto = {
      titulo: datos.titulo || '',
      descripcion: datos.descripcion || '',
      categoria: datos.categoria || '',
      condicion: datos.condicion || '',

      marca: datos.marca || '',
      modelo: datos.modelo || '',
      numeroSerie: datos.numeroSerie || '',

      precioEUR,
      precioETH,
      ethRateEUR: numero(datos.ethRateEUR),

      precio_eur: precioEUR,
      precio_crypto: precioETH,
      crypto: 'ETH',

      estado: 'reventa',
      activo: true,
      enVenta: true,

      fechaCreacion: fecha,
      created_at: fecha,

      imagen: datos.imagen || datos.foto_principal || datos.fotos?.[0] || '',
      foto_principal: datos.imagen || datos.foto_principal || datos.fotos?.[0] || '',

      usuario_id: user.uid,
      vendedor_email: user.email || '',
      seller: user.displayName || user.email || 'Usuario',

      ownerUid: user.uid,
      ownerNombre: user.displayName || '',
      ownerEmail: user.email || '',
      ownerWallet: '',

      walletActual: '',
      propietarioActual: '',
      propietariosAnteriores: [],
      numPropietarios: 1,

      contrato: '',
      tokenId: '',
      txHashCreacion: '',
      txHashUltimaTransferencia: '',
      estadoBlockchain: 'pendiente_mint',
    }

    const ref = await addDoc(collection(db, 'products'), producto)

    return {
      mensaje: 'Artículo publicado correctamente',
      id: ref.id,
    }
  },

  eliminar: async (id) => {
    const ref = doc(db, 'products', id)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      throw new Error('El producto no existe')
    }

    await updateDoc(ref, {
      activo: false,
      estado: 'baja',
      enVenta: false,
      fechaBaja: new Date().toISOString(),
    })

    return {
      mensaje: 'Artículo dado de baja correctamente',
    }
  },
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
}