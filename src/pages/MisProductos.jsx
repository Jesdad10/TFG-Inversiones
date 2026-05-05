import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { articulosService } from '../services/articulos'
import Navbar from '../components/Navbar'
import './MisProductos.css'

export default function MisProductos() {
  const navigate = useNavigate()
  const [user, setUser]           = useState(null)
  const [productos, setProductos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    if (!authService.estaLogueado()) { navigate('/login'); return }

    try {
      const token   = localStorage.getItem('token')
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      setUser({ nombre: payload.nombre, email: payload.email })
    } catch (_) {}

    authService.me().then(d => { if (d?.usuario) setUser(d.usuario) }).catch(() => {})

    articulosService.misProductos()
      .then(d => { if (d?.articulos) setProductos(d.articulos) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [navigate])

  const pedirConfirmacion = (id) => setConfirmId(id)
  const cancelar          = ()   => setConfirmId(null)

  const confirmarEliminar = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      await articulosService.eliminar(confirmId)
      setProductos(prev => prev.filter(p => p.id !== confirmId))
      setConfirmId(null)
    } catch (_) {}
    setDeleting(false)
  }

  return (
    <div className="mp-root">
      <Navbar user={user} />

      <main className="mp-main">
        <div className="mp-container">

          <div className="mp-header">
            <div>
              <h1>Mis productos</h1>
              <p>{loading ? '' : `${productos.length} ${productos.length === 1 ? 'artículo publicado' : 'artículos publicados'}`}</p>
            </div>
            <button className="mp-btn-vender" onClick={() => navigate('/vender')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Publicar artículo
            </button>
          </div>

          {loading ? (
            <div className="mp-loading">
              <span className="mp-spinner" />
              <p>Cargando tus artículos...</p>
            </div>
          ) : productos.length === 0 ? (
            <div className="mp-empty">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3A2E2E" strokeWidth="1.2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <p>Aún no has publicado ningún artículo</p>
              <span>Empieza vendiendo tu primera réplica o accesorio</span>
              <button className="mp-btn-vender" onClick={() => navigate('/vender')}>Publicar ahora</button>
            </div>
          ) : (
            <div className="mp-grid">
              {productos.map(p => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  onEliminar={() => pedirConfirmacion(p.id)}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modal confirmación eliminar */}
      {confirmId && (
        <div className="mp-modal-backdrop" onClick={cancelar}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3>¿Eliminar artículo?</h3>
            <p>Esta acción no se puede deshacer. El artículo dejará de aparecer en el catálogo.</p>
            <div className="mp-modal-actions">
              <button className="mp-btn-cancel" onClick={cancelar} disabled={deleting}>
                Cancelar
              </button>
              <button className="mp-btn-delete" onClick={confirmarEliminar} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductoCard({ producto, onEliminar }) {
  const cryptoSym = producto.crypto === 'BTC' ? '₿' : 'Ξ'
  const precioStr = parseFloat(producto.precio_crypto).toString()
  const eurStr    = parseFloat(producto.precio_eur).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const fecha     = new Date(producto.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <article className="mp-card">
      <div className="mp-card-img">
        {producto.foto_principal
          ? <img src={producto.foto_principal} alt={producto.titulo} />
          : (
            <div className="mp-card-noimg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A2E2E" strokeWidth="1.2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )
        }
        <span className={`mp-card-estado mp-card-estado--${producto.estado}`}>
          {producto.estado === 'activo' ? 'Activo' : producto.estado}
        </span>
      </div>

      <div className="mp-card-body">
        <div className="mp-card-top">
          <h3 className="mp-card-titulo">{producto.titulo}</h3>
          <button className="mp-card-del" onClick={onEliminar} title="Eliminar artículo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>

        <div className="mp-card-tags">
          <span className="mp-tag">{producto.categoria}</span>
          <span className={`mp-tag mp-tag--cond${producto.condicion === 'Nuevo' ? ' new' : ''}`}>
            {producto.condicion}
          </span>
        </div>

        <div className="mp-card-footer">
          <div className="mp-card-precio">
            <span className="mp-precio-crypto">{precioStr} {cryptoSym}</span>
            <span className="mp-precio-eur">≈ {eurStr}€</span>
          </div>
          <span className="mp-card-fecha">{fecha}</span>
        </div>
      </div>
    </article>
  )
}
