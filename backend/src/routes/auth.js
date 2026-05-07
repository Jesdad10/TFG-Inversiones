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
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from '../firebase'

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

    await setDoc(doc(db, 'usuarios', user.uid), {
      ...usuario,
      fechaRegistroServidor: serverTimestamp(),
    })

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
}