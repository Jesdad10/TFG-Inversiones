const router = require('express').Router()
const { db, admin } = require('../db')
const authMiddleware = require('../middleware/auth')
const adminMiddleware = require('../middleware/admin')

// ─── Rutas de usuario (requieren auth JWT) ────────────────────────────────

// GET /api/chat/ — obtener chat y mensajes del usuario actual (marca como leído)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const chatId = `user_${req.usuario.id}`
    const chatRef = db.collection('chats').doc(chatId)
    const chatSnap = await chatRef.get()

    if (!chatSnap.exists) {
      return res.json({ chat: null, mensajes: [] })
    }

    // Solo marca como leído si hay mensajes sin leer
    if ((chatSnap.data().unreadUser || 0) > 0) {
      await chatRef.update({ unreadUser: 0 }).catch(() => {})
    }

    const msgsSnap = await chatRef.collection('messages')
      .orderBy('createdAt', 'asc')
      .get()

    const mensajes = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ chat: { id: chatSnap.id, ...chatSnap.data(), unreadUser: 0 }, mensajes })
  } catch (err) {
    console.error('[chat GET /]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/chat/badge — solo comprueba mensajes no leídos, sin marcarlos
router.get('/badge', authMiddleware, async (req, res) => {
  try {
    const chatId = `user_${req.usuario.id}`
    const chatSnap = await db.collection('chats').doc(chatId).get()
    const unreadUser = chatSnap.exists ? (chatSnap.data().unreadUser || 0) : 0
    res.json({ unreadUser })
  } catch (err) {
    console.error('[chat GET /badge]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/chat/mensaje — usuario envía un mensaje
router.post('/mensaje', authMiddleware, async (req, res) => {
  try {
    const texto = (req.body.texto || '').trim()
    if (!texto) return res.status(400).json({ error: 'Mensaje vacío' })

    const chatId = `user_${req.usuario.id}`
    const chatRef = db.collection('chats').doc(chatId)
    const chatSnap = await chatRef.get()
    const ts = new Date().toISOString()

    if (!chatSnap.exists) {
      await chatRef.set({
        userId: req.usuario.id,
        userName: req.usuario.nombre,
        userEmail: req.usuario.email,
        status: 'open',
        createdAt: ts,
        lastMessage: texto,
        lastMessageAt: ts,
        unreadAdmin: 1,
        unreadUser: 0,
      })
    } else {
      await chatRef.update({
        lastMessage: texto,
        lastMessageAt: ts,
        unreadAdmin: admin.firestore.FieldValue.increment(1),
        status: 'open',
      })
    }

    const msgRef = await chatRef.collection('messages').add({
      text: texto,
      senderId: req.usuario.id,
      senderName: req.usuario.nombre,
      senderRole: 'user',
      createdAt: ts,
    })

    res.json({ ok: true, id: msgRef.id })
  } catch (err) {
    console.error('[chat POST /mensaje]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// ─── Rutas de admin (requieren auth JWT + rol admin) ──────────────────────

// GET /api/chat/admin/unread — total de mensajes sin leer para el admin (ligero)
router.get('/admin/unread', adminMiddleware, async (req, res) => {
  try {
    const chatsSnap = await db.collection('chats').get()
    let totalUnread = 0
    chatsSnap.forEach(d => { totalUnread += d.data().unreadAdmin || 0 })
    res.json({ totalUnread })
  } catch (err) {
    console.error('[chat GET /admin/unread]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/chat/admin — lista todos los chats
router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const chatsSnap = await db.collection('chats')
      .orderBy('lastMessageAt', 'desc')
      .get()

    const chats = chatsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ chats })
  } catch (err) {
    console.error('[chat GET /admin]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /api/chat/admin/:chatId/mensajes — mensajes de un chat concreto
router.get('/admin/:chatId/mensajes', adminMiddleware, async (req, res) => {
  try {
    const chatRef = db.collection('chats').doc(req.params.chatId)
    const chatSnap = await chatRef.get()

    if (!chatSnap.exists) return res.status(404).json({ error: 'Chat no encontrado' })

    await chatRef.update({ unreadAdmin: 0 }).catch(() => {})

    const msgsSnap = await chatRef.collection('messages')
      .orderBy('createdAt', 'asc')
      .get()

    const mensajes = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    res.json({ chat: { id: chatSnap.id, ...chatSnap.data(), unreadAdmin: 0 }, mensajes })
  } catch (err) {
    console.error('[chat GET /admin/:chatId/mensajes]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/chat/admin/:chatId/reply — admin responde en un chat
router.post('/admin/:chatId/reply', adminMiddleware, async (req, res) => {
  try {
    const texto = (req.body.texto || '').trim()
    if (!texto) return res.status(400).json({ error: 'Mensaje vacío' })

    const chatRef = db.collection('chats').doc(req.params.chatId)
    const chatSnap = await chatRef.get()
    if (!chatSnap.exists) return res.status(404).json({ error: 'Chat no encontrado' })

    const ts = new Date().toISOString()

    await chatRef.collection('messages').add({
      text: texto,
      senderId: 'admin',
      senderName: req.usuario.nombre || 'Soporte',
      senderRole: 'admin',
      createdAt: ts,
    })

    await chatRef.update({
      lastMessage: texto,
      lastMessageAt: ts,
      unreadUser: admin.firestore.FieldValue.increment(1),
    })

    res.json({ ok: true })
  } catch (err) {
    console.error('[chat POST /admin/:chatId/reply]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PUT /api/chat/admin/:chatId/estado — abrir o cerrar un chat
router.put('/admin/:chatId/estado', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }
    await db.collection('chats').doc(req.params.chatId).update({ status })
    res.json({ ok: true })
  } catch (err) {
    console.error('[chat PUT /admin/:chatId/estado]', err)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
