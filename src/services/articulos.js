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

async function leerRespuesta(r, mensajeError) {
  const data = await r.json().catch(() => ({}))

  if (!r.ok) {
    throw new Error(data.error || mensajeError)
  }

  return data
}

export const articulosService = {
  crear: (datos) =>
    fetch(BASE, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then((r) => leerRespuesta(r, 'Error al publicar el artículo')),

  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString()

    return fetch(`${BASE}${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(),
    }).then((r) => leerRespuesta(r, 'Error al obtener artículos'))
  },

  misProductos: () =>
    fetch(`${BASE}/mis`, {
      headers: authHeaders(),
    }).then((r) => leerRespuesta(r, 'Error al obtener tus productos')),

  eliminar: (id) =>
    fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then((r) => leerRespuesta(r, 'Error al eliminar')),

  comprar: (id, txHash) =>
    fetch(`${BASE}/${id}/comprar`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ txHash }),
    }).then((r) => leerRespuesta(r, 'Error al comprar el artículo')),

  armeria: () =>
    fetch(`${BASE}/armeria`, {
      headers: authHeaders(),
    }).then((r) => leerRespuesta(r, 'Error al obtener tu armería')),

  venderArma: (id, datos) =>
    fetch(`${BASE}/armeria/${id}/vender`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(datos),
    }).then((r) => leerRespuesta(r, 'Error al poner el arma en venta')),

  quitarVentaArma: (id) =>
    fetch(`${BASE}/armeria/${id}/quitar-venta`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({}),
    }).then((r) => leerRespuesta(r, 'Error al quitar el arma de venta')),

  historialArma: (id) =>
    fetch(`${BASE}/armeria/${id}/historial`, {
      headers: authHeaders(),
    }).then((r) => leerRespuesta(r, 'Error al obtener el historial del arma')),
}