const BASE = 'http://localhost:3001/api/articulos'

function token() {
  return localStorage.getItem('token')
}

export const articulosService = {
  crear: (datos) =>
    fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(datos),
    }).then(async (r) => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Error al publicar el artículo')
      return data
    }),

  listar: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return fetch(`${BASE}${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).then((r) => r.json())
  },
}
