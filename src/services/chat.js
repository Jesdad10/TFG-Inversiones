const BASE = 'http://localhost:3001/api/chat'

function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function req(url, options = {}) {
  const res = await fetch(url, { headers: authHeaders(), ...options })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Error de red')
  return data
}

export const chatService = {
  getMiChat: () =>
    req(`${BASE}/`),

  getBadge: () =>
    req(`${BASE}/badge`),

  enviarMensaje: (texto) =>
    req(`${BASE}/mensaje`, {
      method: 'POST',
      body: JSON.stringify({ texto }),
    }),

  adminGetUnread: () =>
    req(`${BASE}/admin/unread`),

  adminGetChats: () =>
    req(`${BASE}/admin`),

  adminGetMensajes: (chatId) =>
    req(`${BASE}/admin/${encodeURIComponent(chatId)}/mensajes`),

  adminReply: (chatId, texto) =>
    req(`${BASE}/admin/${encodeURIComponent(chatId)}/reply`, {
      method: 'POST',
      body: JSON.stringify({ texto }),
    }),

  adminSetEstado: (chatId, status) =>
    req(`${BASE}/admin/${encodeURIComponent(chatId)}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
}
