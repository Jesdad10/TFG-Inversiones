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
  register: (nombre, email, password, fecha_nacimiento) =>
    peticion('/register', { nombre, email, password, fecha_nacimiento }),

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

  updateMe: (datos) => {
    const token = localStorage.getItem('token')
    return fetch(`${BASE}/me`, {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al actualizar el perfil')
      return data
    })
  },

  guardarSesion: (token) => localStorage.setItem('token', token),
  borrarSesion:  ()      => localStorage.removeItem('token'),
  estaLogueado:  ()      => !!localStorage.getItem('token'),
}