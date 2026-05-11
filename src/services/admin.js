import { initializeApp, getApps } from 'firebase/app'

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'

import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore'

import { db, firebaseConfig } from '../firebase/firebase'

function getSecondaryAuth() {
  const appName = 'AdminSecondaryApp'
  const existing = getApps().find((app) => app.name === appName)
  const secondaryApp = existing || initializeApp(firebaseConfig, appName)
  return getAuth(secondaryApp)
}

function limpiarTexto(valor) {
  return String(valor || '').trim()
}

function limpiarEmail(valor) {
  return String(valor || '').trim().toLowerCase()
}

function limpiarNumero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

export const adminService = {
  listarUsuarios: async () => {
    const q = query(collection(db, 'usuarios'), orderBy('fechaRegistro', 'desc'))
    const snap = await getDocs(q)

    return snap.docs.map((d) => ({
      id: d.id,
      activo: true,
      ...d.data(),
    }))
  },

  crearUsuario: async ({ nombre, email, password, wallet, rol }) => {
    const nombreLimpio = limpiarTexto(nombre)
    const emailLimpio = limpiarEmail(email)
    const walletLimpia = limpiarTexto(wallet)
    const rolFinal = limpiarTexto(rol) || 'usuario'

    if (!nombreLimpio) throw new Error('El nombre es obligatorio')
    if (!emailLimpio) throw new Error('El email es obligatorio')
    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres')
    }
    if (!walletLimpia) throw new Error('La wallet es obligatoria')

    const secondaryAuth = getSecondaryAuth()

    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      emailLimpio,
      password
    )

    const user = cred.user

    await updateProfile(user, {
      displayName: nombreLimpio,
    })

    const usuario = {
      email: emailLimpio,
      fechaRegistro: new Date().toISOString(),
      nombre: nombreLimpio,
      rol: rolFinal,
      wallet: walletLimpia,
      activo: true,
    }

    await setDoc(doc(db, 'usuarios', user.uid), usuario)

    await signOut(secondaryAuth)

    return {
      id: user.uid,
      ...usuario,
    }
  },

  darBajaUsuario: async (id) => {
    await updateDoc(doc(db, 'usuarios', id), {
      activo: false,
      fechaBaja: new Date().toISOString(),
    })

    return true
  },

  activarUsuario: async (id) => {
    await updateDoc(doc(db, 'usuarios', id), {
      activo: true,
      fechaBaja: '',
    })

    return true
  },

  listarProductos: async () => {
    const q = query(collection(db, 'products'), orderBy('fechaCreacion', 'desc'))
    const snap = await getDocs(q)

    return snap.docs.map((d) => ({
      id: d.id,
      activo: true,
      ...d.data(),
    }))
  },

  crearProducto: async (datos) => {
    const titulo = limpiarTexto(datos.titulo)
    const categoria = limpiarTexto(datos.categoria)
    const condicion = limpiarTexto(datos.condicion)
    const descripcion = limpiarTexto(datos.descripcion)
    const marca = limpiarTexto(datos.marca)
    const modelo = limpiarTexto(datos.modelo)
    const numeroSerie = limpiarTexto(datos.numeroSerie)

    const precioEUR = limpiarNumero(datos.precioEUR)
    const precioETH = limpiarNumero(datos.precioETH)
    const ethRateEUR = limpiarNumero(datos.ethRateEUR)

    if (!titulo) throw new Error('El título es obligatorio')
    if (!categoria) throw new Error('La categoría es obligatoria')
    if (!condicion) throw new Error('La condición es obligatoria')
    if (!precioEUR || precioEUR <= 0) throw new Error('El precio en euros es obligatorio')
    if (!precioETH || precioETH <= 0) throw new Error('No se ha podido calcular el precio en ETH')

    const producto = {
      titulo,
      categoria,
      condicion,
      descripcion,
      marca,
      modelo,
      numeroSerie,

      precioEUR,
      precioETH,
      ethRateEUR,

      estado: 'activo',
      activo: true,
      fechaCreacion: new Date().toISOString(),

      imagen: limpiarTexto(datos.imagen),

      walletActual: '',
      propietarioActual: '',
      propietariosAnteriores: [],
      numPropietarios: 0,

      contrato: '',
      tokenId: '',
      txHashCreacion: '',
      txHashUltimaTransferencia: '',
      estadoBlockchain: 'pendiente_mint',
    }

    const ref = await addDoc(collection(db, 'products'), producto)

    return {
      id: ref.id,
      ...producto,
    }
  },

  darBajaProducto: async (id) => {
    await updateDoc(doc(db, 'products', id), {
      activo: false,
      estado: 'baja',
      fechaBaja: new Date().toISOString(),
    })

    return true
  },

  activarProducto: async (id) => {
    await updateDoc(doc(db, 'products', id), {
      activo: true,
      estado: 'activo',
      fechaBaja: '',
    })

    return true
  },
}