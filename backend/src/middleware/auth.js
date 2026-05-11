<<<<<<< HEAD
const jwt = require('jsonwebtoken')
const { db } = require('../db')

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = header.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const sesionesSnap = await db
      .collection('sesiones')
      .where('token', '==', token)
      .limit(1)
      .get()

    if (sesionesSnap.empty) {
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    const sesion = sesionesSnap.docs[0].data()
    const expiraEn = toDate(sesion.expira_en)

    if (!expiraEn || expiraEn <= new Date()) {
      await sesionesSnap.docs[0].ref.delete()
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    const usuarioDoc = await db.collection('usuarios').doc(payload.id).get()

    if (!usuarioDoc.exists) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    const usuario = usuarioDoc.data()

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Cuenta desactivada' })
    }

    if (usuario.bloqueado) {
      return res.status(403).json({
        error: 'bloqueado',
        motivo: usuario.motivo_bloqueo || null,
      })
    }

    req.usuario = {
      id: usuarioDoc.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

module.exports = authMiddleware
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

function limpiarWallet(wallet) {
  const w = String(wallet || '').trim()
  return w || ''
}

export const authService = {
  register: async (nombre, email, password, wallet = '') => {
    const walletLimpia = limpiarWallet(wallet)

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const user = cred.user

    await updateProfile(user, {
      displayName: nombre,
    })

    const usuario = {
      email,
      fechaRegistro: new Date().toISOString(),
      nombre,
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
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const user = cred.user

    const snap = await getDoc(doc(db, 'usuarios', user.uid))

    if (!snap.exists()) {
      throw new Error('El usuario existe en Firebase Auth, pero no tiene documento en Firestore')
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

    const datosPermitidos = {
      nombre: datos.nombre || '',
      wallet: limpiarWallet(datos.wallet),
    }

    await updateDoc(doc(db, 'usuarios', user.uid), datosPermitidos)

    if (datosPermitidos.nombre) {
      await updateProfile(user, {
        displayName: datosPermitidos.nombre,
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
    if (token) localStorage.setItem('token', token)
  },

  borrarSesion: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('uid')
  },

  estaLogueado: () => {
    return !!localStorage.getItem('token') || !!auth.currentUser
  },
}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
