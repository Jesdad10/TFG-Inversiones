const BASE = 'http://localhost:3001/api/auth'
const BASE_ADMIN = 'http://localhost:3001/api/admin'
const BASE_NOTIF = 'http://localhost:3001/api/notificaciones'

async function peticion(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

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
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || 'Error desconocido')
    err.data = data
    throw err
  }

  return data
}

export const authService = {
  register: (nombre, email, password, fecha_nacimiento) =>
    peticion('/register', {
      nombre,
      email,
      password,
      fecha_nacimiento,
    }),

  login: (email, password) =>
    peticion('/login', {
      email,
      password,
    }),

  loginWallet: (wallet) =>
    peticion('/login-wallet', {
      wallet,
    }),

  logout: () => {
    const token = localStorage.getItem('token')

    return fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).finally(() => {
      localStorage.removeItem('token')
    })
  },

  me: () => {
    const token = localStorage.getItem('token')

    return fetch(`${BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}))

      if (!r.ok) {
        throw new Error(data.error || 'Error al obtener usuario')
      }

      return data
    })
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
      const data = await r.json().catch(() => ({}))

      if (!r.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil')
      }

      return data
    })
  },

  guardarSesion: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    }
  },

  borrarSesion: () => {
    localStorage.removeItem('token')
  },

  estaLogueado: () => {
    return !!localStorage.getItem('token')
  },

  getNotificaciones: () =>
    apiFetch(BASE_NOTIF),

  crearNotificacion: (datos) =>
    apiFetch(BASE_NOTIF, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  marcarNotificacionLeida: (id) =>
    apiFetch(`${BASE_NOTIF}/${id}/leer`, {
      method: 'PUT',
    }),

  marcarTodasLeidas: () =>
    apiFetch(`${BASE_NOTIF}/leer-todas`, {
      method: 'PUT',
    }),

  cambiarPassword: (datos) =>
    apiFetch(`${BASE}/password`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  bajaCuenta: (datos) =>
    apiFetch(`${BASE}/baja`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  reportarIncidencia: (datos) =>
    apiFetch(`${BASE}/incidencias`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

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
      body: JSON.stringify({
        motivo,
      }),
    }),

  adminDesbloquearUsuario: (id) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}/desbloquear`, {
      method: 'PUT',
    }),

  adminCambiarRol: (id, rol, password) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}/rol`, {
      method: 'PUT',
      body: JSON.stringify({
        rol,
        password,
      }),
    }),

  adminEliminarUsuario: (id) =>
    apiFetch(`${BASE_ADMIN}/usuarios/${id}`, {
      method: 'DELETE',
    }),

  adminGetArticulos: () =>
    apiFetch(`${BASE_ADMIN}/articulos`),

  adminEliminarArticulo: (id, motivo) =>
    apiFetch(`${BASE_ADMIN}/articulos/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({
        motivo,
      }),
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
}