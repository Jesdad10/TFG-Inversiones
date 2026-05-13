import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import { authService } from '../services/auth'
import { articulosService } from '../services/articulos'
import Navbar from '../components/Navbar'
import './Dashboard.css'

const CATEGORIES = [
  { label: 'Todos', icon: null },
  { label: 'Rifles AEG', icon: '🎯' },
  { label: 'Pistolas GBB', icon: '🔫' },
  { label: 'Sniper', icon: '🎯' },
  { label: 'Francotirador', icon: '🎯' },
  { label: 'Accesorios', icon: '⚙️' },
  { label: 'Equipamiento', icon: '🪖' },
  { label: 'Piezas', icon: '🔧' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [filters, setFilters] = useState({ precio: '', condicion: '', orden: '' })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [tick, setTick] = useState(Date.now())

  useEffect(() => {
    if (!authService.estaLogueado()) {
      navigate('/login')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      setUser({ nombre: payload.nombre, email: payload.email, rol: payload.rol })
    } catch (_) {}

    authService.me()
      .then(data => {
        if (data?.usuario) setUser(data.usuario)
      })
      .catch(() => {})

    articulosService.listar()
      .then(data => {
        if (data?.articulos) setProducts(data.articulos)
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const filtered = products.filter(p => {
    if (activeCategory !== 'Todos' && p.categoria !== activeCategory) return false

    const texto = `${p.titulo || ''} ${p.categoria || ''} ${p.descripcion || ''}`.toLowerCase()

    if (search && !texto.includes(search.toLowerCase())) return false
    if (filters.condicion && p.condicion !== filters.condicion) return false

    const eur = parseFloat(p.precio_eur) || 0

    if (filters.precio === '<100' && eur >= 100) return false
    if (filters.precio === '100-250' && (eur < 100 || eur > 250)) return false
    if (filters.precio === '250-500' && (eur < 250 || eur > 500)) return false
    if (filters.precio === '>500' && eur <= 500) return false

    return true
  }).sort((a, b) => {
    if (filters.orden === 'precio_asc') return (parseFloat(a.precio_eur) || 0) - (parseFloat(b.precio_eur) || 0)
    if (filters.orden === 'precio_desc') return (parseFloat(b.precio_eur) || 0) - (parseFloat(a.precio_eur) || 0)
    if (filters.orden === 'reciente') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    return 0
  })

  const activeFiltersCount = [filters.precio, filters.condicion, filters.orden].filter(Boolean).length

  return (
    <div className="dashboard-root">
      <Navbar user={user} activePage="inicio" />

      <main className="dash-main">
        <section className="search-hero">
          <div className="search-hero__inner">
            <p className="hero-welcome">
              Bienvenido de nuevo, <span>{user?.nombre?.split(' ')[0] || 'Operador'}</span>
            </p>

            <h1 className="hero-title">Encuentra tu próxima réplica</h1>
            <p className="hero-sub">Compra y vende réplicas de airsoft pagando con ETH de prueba en Sepolia.</p>

            <div className="search-bar">
              <svg className="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                className="search-bar__input"
                type="text"
                placeholder="Buscar réplicas, marcas, accesorios..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              {search && (
                <button className="search-bar__clear" onClick={() => setSearch('')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

              <button className="search-bar__btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Buscar
              </button>
            </div>
          </div>

          <div className="hero-orb hero-orb--1" />
          <div className="hero-orb hero-orb--2" />
          <div className="hero-grid" />
        </section>

        <section className="categories-section">
          <div className="categories-scroll">
            {CATEGORIES.map(({ label }) => (
              <button
                key={label}
                className={`cat-pill${activeCategory === label ? ' active' : ''}`}
                onClick={() => setActiveCategory(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="filters-section">
          <div className="filters-bar">
            <div className="filters-left">
              <div className="filters-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filtros
                {activeFiltersCount > 0 && <span className="filters-count">{activeFiltersCount}</span>}
              </div>

              <select
                className="filter-select"
                value={filters.precio}
                onChange={e => setFilters(f => ({ ...f, precio: e.target.value }))}
              >
                <option value="">Precio</option>
                <option value="<100">Menos de 100€</option>
                <option value="100-250">100€ — 250€</option>
                <option value="250-500">250€ — 500€</option>
                <option value=">500">Más de 500€</option>
              </select>

              <select
                className="filter-select"
                value={filters.condicion}
                onChange={e => setFilters(f => ({ ...f, condicion: e.target.value }))}
              >
                <option value="">Condición</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Como nuevo">Como nuevo</option>
                <option value="Bueno">Bueno</option>
                <option value="Aceptable">Aceptable</option>
              </select>

              {activeFiltersCount > 0 && (
                <button
                  className="filter-clear-btn"
                  onClick={() => setFilters({ precio: '', condicion: '', orden: '' })}
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="filters-right">
              <span className="results-count">
                <strong>{filtered.length}</strong> {filtered.length === 1 ? 'artículo' : 'artículos'}
              </span>

              <select
                className="filter-select"
                value={filters.orden}
                onChange={e => setFilters(f => ({ ...f, orden: e.target.value }))}
              >
                <option value="">Ordenar por</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="reciente">Más recientes</option>
              </select>
            </div>
          </div>
        </section>

        <section className="products-section">
          {loadingProducts ? (
            <div className="empty-state">
              <span className="loading-spinner" />
              <p style={{ marginTop: '16px', color: '#8A7070' }}>Cargando artículos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#5A4545" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <p>{products.length === 0 ? 'Aún no hay artículos publicados' : 'Sin resultados'}</p>
              <span>{products.length === 0 ? 'Sé el primero en publicar una réplica' : 'Prueba otros términos o quita los filtros'}</span>

              {products.length > 0 && (
                <button
                  className="empty-reset"
                  onClick={() => {
                    setSearch('')
                    setActiveCategory('Todos')
                    setFilters({ precio: '', condicion: '', orden: '' })
                  }}
                >
                  Restablecer búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  tick={tick}
                  onOpen={() => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          tick={tick}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}

function tiempoRestante(fechaExpira) {
  if (!fechaExpira) return null

  const fin = new Date(fechaExpira).getTime()
  const ahora = Date.now()
  const diff = fin - ahora

  if (!Number.isFinite(fin)) return null
  if (diff <= 0) return 'Expirando'

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (dias > 0) return `${dias}d ${horas}h`
  if (horas > 0) return `${horas}h ${minutos}min`

  return `${minutos}min`
}

function esReventa(product) {
  return Boolean(product.usuario_arma_id && product.venta_expira_en)
}

async function cambiarASepolia() {
  if (!window.ethereum) {
    throw new Error('Necesitas MetaMask para comprar con ETH de prueba.')
  }

  const sepoliaChainId = '0xaa36a7'

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: sepoliaChainId }],
    })
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: sepoliaChainId,
          chainName: 'Sepolia test network',
          nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
    } else {
      throw switchError
    }
  }
}

async function pagarConSepolia(product) {
  if (!window.ethereum) {
    throw new Error('Necesitas tener MetaMask instalado.')
  }

  if (product.crypto !== 'ETH') {
    throw new Error('Solo puedes comprar artículos en ETH usando Sepolia.')
  }

  const walletDestino = import.meta.env.VITE_MARKET_WALLET_ADDRESS

  if (!walletDestino) {
    throw new Error('Falta configurar VITE_MARKET_WALLET_ADDRESS en el .env del frontend.')
  }

  await cambiarASepolia()

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  const precioEth = String(product.precio_crypto || '').trim()

  if (!precioEth || Number(precioEth) <= 0) {
    throw new Error('El artículo no tiene un precio ETH válido.')
  }

  const value = ethers.parseEther(precioEth)

  const tx = await signer.sendTransaction({
    to: walletDestino,
    value,
  })

  await tx.wait()

  return tx.hash
}

async function comprarProducto(product) {
  const txHash = await pagarConSepolia(product)
  await articulosService.comprar(product.id, txHash)
  window.location.href = '/armeria'
}

function ProductCard({ product, tick, onOpen }) {
  const cryptoSym = product.crypto === 'BTC' ? '₿' : 'Ξ'
  const restante = tiempoRestante(product.venta_expira_en)
  const productoReventa = esReventa(product)

  const precioStr = parseFloat(product.precio_crypto || 0).toString()
  const eurStr = parseFloat(product.precio_eur || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <article className="product-card" onClick={onOpen}>
      <div className="product-img">
        {product.foto_principal ? (
          <img src={product.foto_principal} alt={product.titulo} className="product-photo" />
        ) : (
          <div className="product-img__icon">
            <CategorySVG category={product.categoria} />
          </div>
        )}

        {productoReventa && restante && (
          <span className="product-countdown">
            Termina en {restante}
          </span>
        )}

        <span className="product-cat-tag">{product.categoria}</span>
      </div>

      <div className="product-body">
        <h3 className="product-name">{product.titulo}</h3>

        <div className="product-meta">
          <span className={`product-cond${productoReventa ? ' used' : product.condicion === 'Nuevo' ? ' new' : ' used'}`}>
            {productoReventa ? 'Reventa' : product.condicion}
          </span>

          <span className="product-owners-chip">
            {product.numero_duenos || 1} dueño{Number(product.numero_duenos || 1) === 1 ? '' : 's'}
          </span>
        </div>

        <p className="product-seller">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {product.seller}
        </p>

        <div className="product-footer">
          <div className="product-price">
            <p className="price-eth">{precioStr} {cryptoSym}</p>
            <p className="price-eur">= {eurStr}€</p>
          </div>

          <button
            className="btn-buy"
            onClick={async (e) => {
              e.stopPropagation()

              try {
                await comprarProducto(product)
              } catch (err) {
                alert(err.message || 'Error al comprar con MetaMask')
              }
            }}
          >
            Comprar
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductModal({ product, tick, onClose }) {
  const cryptoSym = product.crypto === 'BTC' ? '₿' : 'Ξ'
  const restante = tiempoRestante(product.venta_expira_en)
  const productoReventa = esReventa(product)

  const precioCrypto = parseFloat(product.precio_crypto || 0).toString()

  const precioEur = parseFloat(product.precio_eur || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const fechaCreacion = product.created_at
    ? new Date(product.created_at).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Sin fecha'

  const fechaExpira = product.venta_expira_en
    ? new Date(product.venta_expira_en).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal" onClick={e => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="product-modal-img">
          {product.foto_principal ? (
            <img src={product.foto_principal} alt={product.titulo} />
          ) : (
            <div className="product-modal-noimg">
              <CategorySVG category={product.categoria} />
            </div>
          )}

          {productoReventa && restante && (
            <span className="product-modal-countdown">
              Termina en {restante}
            </span>
          )}
        </div>

        <div className="product-modal-body">
          <div className="product-modal-head">
            <div>
              <p className="product-modal-kicker">
                {productoReventa ? 'Producto en reventa' : 'Producto del marketplace'}
              </p>

              <h2>{product.titulo}</h2>
            </div>

            <span className={`product-cond${productoReventa ? ' used' : product.condicion === 'Nuevo' ? ' new' : ' used'}`}>
              {productoReventa ? 'Reventa' : product.condicion}
            </span>
          </div>

          <p className="product-modal-desc">
            {product.descripcion || product.observacion_venta || 'Este artículo no tiene descripción.'}
          </p>

          <div className="product-modal-info">
            <div>
              <span>Categoría</span>
              <strong>{product.categoria || 'Sin categoría'}</strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>{product.condicion || 'Sin estado'}</strong>
            </div>

            <div>
              <span>Vendedor</span>
              <strong>{product.seller || 'Usuario'}</strong>
            </div>

            <div>
              <span>Número de dueños</span>
              <strong>{product.numero_duenos || 1}</strong>
            </div>

            <div>
              <span>Publicado</span>
              <strong>{fechaCreacion}</strong>
            </div>

            <div>
              <span>Precio ETH</span>
              <strong>{precioCrypto} {cryptoSym}</strong>
            </div>

            <div>
              <span>Precio aproximado</span>
              <strong>{precioEur}€</strong>
            </div>

            {fechaExpira && (
              <div>
                <span>Disponible hasta</span>
                <strong>{fechaExpira}</strong>
              </div>
            )}

            {product.historial_arma_id && (
              <div>
                <span>ID historial</span>
                <strong>{product.historial_arma_id}</strong>
              </div>
            )}

            {product.tx_hash && (
              <div>
                <span>Última tx</span>
                <strong>{product.tx_hash.slice(0, 10)}...{product.tx_hash.slice(-6)}</strong>
              </div>
            )}
          </div>

          {product.tx_hash && (
            <div className="product-modal-note">
              <span>Transacción blockchain</span>
              <p>{product.tx_hash}</p>
              <a
                href={product.etherscan_url || `https://sepolia.etherscan.io/tx/${product.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="product-modal-etherscan"
              >
                Ver en Etherscan
              </a>
            </div>
          )}

          {product.observacion_venta && (
            <div className="product-modal-note">
              <span>Observación del vendedor</span>
              <p>{product.observacion_venta}</p>
            </div>
          )}

          <div className="product-modal-actions">
            <button className="product-modal-secondary" onClick={onClose}>
              Cerrar
            </button>

            <button
              className="product-modal-buy"
              onClick={async () => {
                try {
                  await comprarProducto(product)
                } catch (err) {
                  alert(err.message || 'Error al comprar con MetaMask')
                }
              }}
            >
              Comprar con MetaMask
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategorySVG({ category }) {
  if (category === 'Pistolas GBB') return (
    <svg width="54" height="40" viewBox="0 0 54 40" fill="none">
      <rect x="8" y="11" width="26" height="13" rx="2" fill="white" opacity="0.3" />
      <rect x="34" y="14" width="16" height="4.5" rx="1" fill="white" opacity="0.3" />
      <rect x="48" y="12" width="2" height="9" rx="0.5" fill="white" opacity="0.3" />
      <path d="M24,24 L28,24 L27,36 Q25.5,38 24,36 L24,24Z" fill="white" opacity="0.25" />
      <rect x="10" y="24" width="12" height="4" rx="1" fill="white" opacity="0.15" />
    </svg>
  )

  if (category === 'Sniper' || category === 'Francotirador') return (
    <svg width="80" height="26" viewBox="0 0 80 26" fill="none">
      <rect x="5" y="10" width="28" height="8" rx="1.5" fill="white" opacity="0.3" />
      <rect x="33" y="11" width="42" height="4" rx="1" fill="white" opacity="0.3" />
      <rect x="73" y="9" width="2.5" height="9" rx="0.5" fill="white" opacity="0.3" />
      <rect x="14" y="6" width="10" height="4" rx="1" fill="white" opacity="0.2" />
      <path d="M2,23 L2,16 L6,14 L6,10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
      <path d="M2,23 L7,23 L8,19 L8,10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
      <path d="M19,18 L24,18 L23,25 Q21.5,26.5 20,25Z" fill="white" opacity="0.2" />
    </svg>
  )

  if (category === 'Accesorios') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )

  if (category === 'Equipamiento') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )

  if (category === 'Piezas') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )

  return (
    <svg width="72" height="30" viewBox="0 0 72 30" fill="none">
      <rect x="10" y="11" width="20" height="10" rx="2" fill="white" opacity="0.3" />
      <rect x="18" y="8" width="16" height="3" rx="1" fill="white" opacity="0.25" />
      <rect x="30" y="12" width="28" height="4" rx="1" fill="white" opacity="0.3" />
      <rect x="56" y="10" width="2.5" height="10" rx="0.5" fill="white" opacity="0.3" />
      <path d="M3,26 L3,19 L7,17 L7,11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M3,26 L8.5,26 L9,22 L9,11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M25,21 L28.5,21 L28,28 Q26.5,29.5 25.5,28Z" fill="white" opacity="0.25" />
      <path d="M13,21 L17.5,21 Q18.5,28.5 15.5,29.5 Q12.5,28.5 13,21Z" fill="white" opacity="0.25" />
    </svg>
  )
}