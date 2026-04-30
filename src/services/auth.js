const BASE = 'http://localhost:3001/api/auth'

async function peticion(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error desconocido')
  return data
}

export const authService = {
  register: (nombre, email, password) =>
    peticion('/register', { nombre, email, password }),

  login: (email, password) =>
    peticion('/login', { email, password }),

  loginWallet: (wallet) =>
    peticion('/login-wallet', { wallet }),

  logout: () => {
    const token = localStorage.getItem('token')
    return fetch(`${BASE}/logout`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => localStorage.removeItem('token'))
  },

  me: () => {
    const token = localStorage.getItem('token')
    return fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
  },

  guardarSesion: (token) => localStorage.setItem('token', token),
  borrarSesion:  ()      => localStorage.removeItem('token'),
  estaLogueado:  ()      => !!localStorage.getItem('token'),
}