<<<<<<< HEAD
const BASE       = 'http://localhost:3001/api/auth'
const BASE_ADMIN = 'http://localhost:3001/api/admin'
const BASE_NOTIF = 'http://localhost:3001/api/notificaciones'

async function peticion(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || 'Error desconocido')
    err.data = data
    throw err
  }

  return data
}

function authHeaders() {
  const token = localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: authHeaders(),
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error desconocido')
  }

  return data
}

export const authService = {
  register: (nombre, email, password, fecha_nacimiento) =>
    peticion('/register', { nombre, email, password, fecha_nacimiento }),

  login: (email, password) =>
    peticion('/login', { email, password }),

  loginWallet: (wallet) =>
    peticion('/login-wallet', { wallet }),

  logout: () => {
    const token = localStorage.getItem('token')

    return fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => localStorage.removeItem('token'))
  },

  me: () => {
    const token = localStorage.getItem('token')

    return fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
  },

  updateMe: (datos) => {
    const token = localStorage.getItem('token')

    return fetch(`${BASE}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al actualizar el perfil')
      return data
    })
  },

  guardarSesion: (token) => localStorage.setItem('token', token),
  borrarSesion: () => localStorage.removeItem('token'),
  estaLogueado: () => !!localStorage.getItem('token'),

  getNotificaciones: () =>
    apiFetch(BASE_NOTIF),

  marcarNotificacionLeida: (id) =>
    apiFetch(`${BASE_NOTIF}/${id}/leer`, { method: 'PUT' }),

  marcarTodasLeidas: () =>
    apiFetch(`${BASE_NOTIF}/leer-todas`, { method: 'PUT' }),

  adminGetStats: () =>
    apiFetch(`${BASE_ADMIN}/stats`),

  adminGetUsuarios: () =>
    apiFetch(`${BASE_ADMIN}/usuarios`),

  adminCrearUsuario: (datos) =>
    apiFetch(`${BASE_ADMIN}/usuarios`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  adminBloquearUsuario: (id, motivo) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}/bloquear`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    }),

  adminDesbloquearUsuario: (id) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}/desbloquear`, { method: 'PUT' }),

  adminCambiarRol: (id, rol, password) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ rol, password }),
    }),

  adminEliminarUsuario: (id) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}`, { method: 'DELETE' }),

  adminGetArticulos: () =>
    apiFetch(`${BASE_ADMIN}/articulos`),

  adminEliminarArticulo: (id, motivo) =>
    apiFetch(`${BASE_ADMIN}/articulos/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ motivo }),
    }),

  adminGetHistorial: () =>
    apiFetch(`${BASE_ADMIN}/historial`),

  adminGetHistorialArmas: () =>
    apiFetch(`${BASE_ADMIN}/historial-armas`),

  adminGetHistorialArma: (id) =>
    apiFetch(`${BASE_ADMIN}/historial-armas/${id}`),

  adminReconstruirHistorialArmas: () =>
    apiFetch(`${BASE_ADMIN}/historial-armas/reconstruir`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
=======
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'

import { auth, db } from '../firebase/firebase'

function esperarUsuario() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(user)
    })
  })
}

async function usuarioActual() {
  return auth.currentUser || await esperarUsuario()
}

function limpiarTexto(valor) {
  return String(valor || '').trim()
}

function limpiarWallet(wallet) {
  return String(wallet || '').trim()
}

export const authService = {
  register: async (nombre, email, password, wallet) => {
    const nombreLimpio = limpiarTexto(nombre)
    const emailLimpio = limpiarTexto(email).toLowerCase()
    const walletLimpia = limpiarWallet(wallet)

    if (!nombreLimpio) {
      throw new Error('El nombre es obligatorio')
    }

    if (!emailLimpio) {
      throw new Error('El email es obligatorio')
    }

    if (!walletLimpia) {
      throw new Error('La wallet es obligatoria')
    }

    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres')
    }

    const cred = await createUserWithEmailAndPassword(
      auth,
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
      rol: 'usuario',
      wallet: walletLimpia,
    }

    await setDoc(doc(db, 'usuarios', user.uid), usuario)

    const token = await user.getIdToken()

    localStorage.setItem('token', token)
    localStorage.setItem('uid', user.uid)

    return {
      mensaje: 'Usuario registrado correctamente',
      token,
      usuario: {
        id: user.uid,
        ...usuario,
      },
    }
  },

  login: async (email, password) => {
    const emailLimpio = limpiarTexto(email).toLowerCase()

    if (!emailLimpio) {
      throw new Error('El email es obligatorio')
    }

    if (!password) {
      throw new Error('La contraseña es obligatoria')
    }

    const cred = await signInWithEmailAndPassword(
      auth,
      emailLimpio,
      password
    )

    const user = cred.user

    const snap = await getDoc(doc(db, 'usuarios', user.uid))

    if (!snap.exists()) {
      throw new Error('El usuario existe en Firebase Auth, pero no tiene perfil en Firestore')
    }

    const token = await user.getIdToken()

    localStorage.setItem('token', token)
    localStorage.setItem('uid', user.uid)

    return {
      mensaje: 'Login correcto',
      token,
      usuario: {
        id: user.uid,
        ...snap.data(),
      },
    }
  },

  logout: async () => {
    await signOut(auth)
    localStorage.removeItem('token')
    localStorage.removeItem('uid')
  },

  me: async () => {
    const user = await usuarioActual()

    if (!user) {
      localStorage.removeItem('token')
      localStorage.removeItem('uid')
      return null
    }

    const snap = await getDoc(doc(db, 'usuarios', user.uid))

    if (!snap.exists()) {
      return null
    }

    const token = await user.getIdToken()

    localStorage.setItem('token', token)
    localStorage.setItem('uid', user.uid)

    return {
      token,
      usuario: {
        id: user.uid,
        ...snap.data(),
      },
    }
  },

  updateMe: async (datos) => {
    const user = await usuarioActual()

    if (!user) {
      throw new Error('No hay sesión activa')
    }

    const datosActualizados = {}

    if (typeof datos.nombre !== 'undefined') {
      datosActualizados.nombre = limpiarTexto(datos.nombre)
    }

    if (typeof datos.wallet !== 'undefined') {
      datosActualizados.wallet = limpiarWallet(datos.wallet)
    }

    await updateDoc(doc(db, 'usuarios', user.uid), datosActualizados)

    if (datosActualizados.nombre) {
      await updateProfile(user, {
        displayName: datosActualizados.nombre,
      })
    }

    const snap = await getDoc(doc(db, 'usuarios', user.uid))

    return {
      mensaje: 'Perfil actualizado correctamente',
      usuario: {
        id: user.uid,
        ...snap.data(),
      },
    }
  },

  guardarSesion: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    }
  },

  borrarSesion: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('uid')
  },

  estaLogueado: () => {
    return !!localStorage.getItem('token') || !!auth.currentUser
  },
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
}