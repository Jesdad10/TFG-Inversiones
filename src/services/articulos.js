const BASE = 'http://localhost:3001/api/articulos'

function token() {
  return localStorage.getItem('token')
}

function authHeaders(json = false) {
  const headers = {
    Authorization: `Bearer ${token()}`,
  }

  if (json) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

export const articulosService = {
  crear: (datos) =>
    fetch(BASE, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al publicar el artículo')
      return data
    }),

  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString()

    return fetch(`${BASE}${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener artículos')
      return data
    })
  },

  misProductos: () =>
    fetch(`${BASE}/mis`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener tus productos')
      return data
    }),

  eliminar: (id) =>
    fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al eliminar')
      return data
    }),

  comprar: (id, txHash) =>
    fetch(`${BASE}/${id}/comprar`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ txHash }),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al comprar el artículo')
      return data
    }),

  armeria: () =>
    fetch(`${BASE}/armeria`, {
      headers: authHeaders(),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al obtener tu armería')
      return data
    }),

  venderArma: (id, datos) =>
    fetch(`${BASE}/armeria/${id}/vender`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al poner el arma en venta')
      return data
    }),

  quitarVentaArma: (id) =>
    fetch(`${BASE}/armeria/${id}/quitar-venta`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({}),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al quitar el arma de venta')
      return data
    }),
}