import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from '../firebase'

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

function normalizarArticulo(id, data) {
  return {
    id,
    titulo: data.titulo || '',
    descripcion: data.descripcion || '',
    categoria: data.categoria || '',
    condicion: data.condicion || '',
    crypto: data.crypto || 'ETH',
    precio_crypto: data.precio_crypto || '',
    precio_eur: data.precio_eur || '',
    peso_tier: data.peso_tier || '',
    tamano: data.tamano || '',
    envio_precio: data.envio_precio || 0,
    comision: data.comision || 0,
    neto_eur: data.neto_eur || 0,
    fotos: data.fotos || [],
    foto_principal: data.foto_principal || data.fotos?.[0] || '',
    estado: data.estado || 'activo',
    usuario_id: data.usuario_id || '',
    created_at: data.created_at || '',
  }
}

export const articulosService = {
  crear: async (datos) => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('Debes iniciar sesión para publicar un artículo')
    }

    const articulo = {
      ...datos,
      usuario_id: user.uid,
      vendedor_email: user.email,
      estado: 'activo',
      foto_principal: datos.fotos?.[0] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at_server: serverTimestamp(),
      updated_at_server: serverTimestamp(),
    }

    const ref = await addDoc(collection(db, 'articulos'), articulo)

    return {
      mensaje: 'Artículo publicado correctamente',
      id: ref.id,
    }
  },

  listar: async () => {
    const q = query(
      collection(db, 'articulos'),
      where('estado', '==', 'activo'),
      orderBy('created_at', 'desc')
    )

    const snap = await getDocs(q)

    const articulos = snap.docs.map((d) =>
      normalizarArticulo(d.id, d.data())
    )

    return { articulos }
  },

  misProductos: async () => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('Debes iniciar sesión')
    }

    const q = query(
      collection(db, 'articulos'),
      where('usuario_id', '==', user.uid),
      orderBy('created_at', 'desc')
    )

    const snap = await getDocs(q)

    const articulos = snap.docs.map((d) =>
      normalizarArticulo(d.id, d.data())
    )

    return { articulos }
  },

  eliminar: async (id) => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('Debes iniciar sesión')
    }

    const ref = doc(db, 'articulos', id)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      throw new Error('El artículo no existe')
    }

    const articulo = snap.data()

    if (articulo.usuario_id !== user.uid) {
      throw new Error('No puedes eliminar un artículo que no es tuyo')
    }

    await deleteDoc(ref)

    return {
      mensaje: 'Artículo eliminado correctamente',
    }
  },
}