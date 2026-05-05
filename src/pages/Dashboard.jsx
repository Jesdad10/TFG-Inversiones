import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import Navbar from '../components/Navbar'
import './Dashboard.css'

const CATEGORIES = [
  { label: 'Todos', icon: null },
  { label: 'Rifles AEG', icon: '🎯' },
  { label: 'Pistolas GBB', icon: '🔫' },
  { label: 'Sniper', icon: '🎯' },
  { label: 'Accesorios', icon: '⚙️' },
  { label: 'Equipamiento', icon: '🪖' },
  { label: 'Piezas', icon: '🔧' },
]

const PRODUCTS = [
  { id: 1, name: 'Tokyo Marui M4A1 SOPMOD', category: 'Rifles AEG', eth: '0.280', eur: '420', condition: 'Nuevo', rating: 4.8, reviews: 23, badge: 'Destacado', seller: 'OperadorAlpha' },
  { id: 2, name: 'WE Tech Glock 17 Gen4 GBB', category: 'Pistolas GBB', eth: '0.120', eur: '180', condition: 'Nuevo', rating: 4.6, reviews: 15, badge: null, seller: 'TacticoMadrid' },
  { id: 3, name: 'WELL MB4410 Sniper 6mm', category: 'Sniper', eth: '0.080', eur: '120', condition: 'Usado', rating: 4.2, reviews: 8, badge: null, seller: 'FrancoSevilla' },
  { id: 4, name: 'G&G CM16 Raider 2.0 AEG', category: 'Rifles AEG', eth: '0.150', eur: '220', condition: 'Nuevo', rating: 4.7, reviews: 31, badge: 'Popular', seller: 'AirsoftBCN' },
  { id: 5, name: 'KWA ATP Auto FPG GBB', category: 'Pistolas GBB', eth: '0.180', eur: '270', condition: 'Nuevo', rating: 4.9, reviews: 12, badge: null, seller: 'OperadorAlpha' },
  { id: 6, name: 'Lancer Tactical Gen 2 M4', category: 'Rifles AEG', eth: '0.100', eur: '150', condition: 'Usado', rating: 3.9, reviews: 5, badge: null, seller: 'AirsoftVLC' },
  { id: 7, name: 'Rail Noveske 14.5" KX3', category: 'Accesorios', eth: '0.040', eur: '60', condition: 'Nuevo', rating: 4.5, reviews: 19, badge: null, seller: 'PiezasAK' },
  { id: 8, name: 'Chaleco HSGI Sure-Grip', category: 'Equipamiento', eth: '0.060', eur: '90', condition: 'Nuevo', rating: 4.3, reviews: 7, badge: null, seller: 'TacticoMadrid' },
  { id: 9, name: 'ASG CZ P-09 GBB Duty', category: 'Pistolas GBB', eth: '0.095', eur: '142', condition: 'Nuevo', rating: 4.4, reviews: 11, badge: null, seller: 'FrancoSevilla' },
  { id: 10, name: 'G&G GR16 Carbine AEG', category: 'Rifles AEG', eth: '0.200', eur: '300', condition: 'Nuevo', rating: 4.8, reviews: 27, badge: 'Popular', seller: 'AirsoftBCN' },
  { id: 11, name: 'Madbull XM203 Lanzador', category: 'Accesorios', eth: '0.055', eur: '82', condition: 'Usado', rating: 4.1, reviews: 6, badge: null, seller: 'PiezasAK' },
  { id: 12, name: 'Botas Haix Scout Black Eagle', category: 'Equipamiento', eth: '0.090', eur: '135', condition: 'Nuevo', rating: 4.6, reviews: 14, badge: null, seller: 'TacticoMadrid' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [filters, setFilters] = useState({ precio: '', condicion: '', orden: '' })

  useEffect(() => {
    if (!authService.estaLogueado()) {
      navigate('/login')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      setUser({ nombre: payload.nombre, email: payload.email })
    } catch (_) {}

    authService.me()
      .then(data => { if (data?.usuario) setUser(data.usuario) })
      .catch(() => {})
  }, [navigate])

  const filtered = PRODUCTS.filter(p => {
    if (activeCategory !== 'Todos' && p.category !== activeCategory) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.condicion && p.condition !== filters.condicion) return false
    const eur = parseInt(p.eur)
    if (filters.precio === '<100' && eur >= 100) return false
    if (filters.precio === '100-250' && (eur < 100 || eur > 250)) return false
    if (filters.precio === '250-500' && (eur < 250 || eur > 500)) return false
    if (filters.precio === '>500' && eur <= 500) return false
    return true
  }).sort((a, b) => {
    if (filters.orden === 'precio_asc') return parseInt(a.eur) - parseInt(b.eur)
    if (filters.orden === 'precio_desc') return parseInt(b.eur) - parseInt(a.eur)
    if (filters.orden === 'rating') return b.rating - a.rating
    return 0
  })

  const activeFiltersCount = [filters.precio, filters.condicion, filters.orden].filter(Boolean).length

  return (
    <div className="dashboard-root">

      <Navbar user={user} activePage="inicio" />

      {/* ── MAIN ── */}
      <main className="dash-main">

        {/* SEARCH HERO */}
        <section className="search-hero">
          <div className="search-hero__inner">
            <p className="hero-welcome">
              Bienvenido de nuevo, <span>{user?.nombre?.split(' ')[0] || 'Operador'}</span>
            </p>
            <h1 className="hero-title">Encuentra tu próxima réplica</h1>
            <p className="hero-sub">+500 artículos de airsoft. Paga con ETH, recibe en 24h.</p>

            <div className="search-bar">
              <svg className="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
              <button className="search-bar__btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Buscar
              </button>
            </div>
          </div>
          <div className="hero-orb hero-orb--1" />
          <div className="hero-orb hero-orb--2" />
          <div className="hero-grid" />
        </section>

        {/* CATEGORIES */}
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

        {/* FILTERS BAR */}
        <section className="filters-section">
          <div className="filters-bar">
            <div className="filters-left">
              <div className="filters-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
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
                <option value="Usado">Usado</option>
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
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="products-section">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#5A4545" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>Sin resultados</p>
              <span>Prueba otros términos o quita los filtros</span>
              <button className="empty-reset" onClick={() => { setSearch(''); setActiveCategory('Todos'); setFilters({ precio: '', condicion: '', orden: '' }) }}>
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

/* ── PRODUCT CARD ── */
function ProductCard({ product }) {
  return (
    <article className="product-card">
      {product.badge && <span className="product-badge">{product.badge}</span>}

      <div className="product-img">
        <div className="product-img__icon">
          <CategorySVG category={product.category} />
        </div>
        <span className="product-cat-tag">{product.category}</span>
      </div>

      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-meta">
          <span className={`product-cond${product.condition === 'Nuevo' ? ' new' : ' used'}`}>
            {product.condition}
          </span>
          <div className="product-rating">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="rating-val">{product.rating}</span>
            <span className="rating-cnt">({product.reviews})</span>
          </div>
        </div>

        <p className="product-seller">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {product.seller}
        </p>

        <div className="product-footer">
          <div className="product-price">
            <p className="price-eth">{product.eth} ETH</p>
            <p className="price-eur">≈ {product.eur}€</p>
          </div>
          <button className="btn-buy">Comprar</button>
        </div>
      </div>
    </article>
  )
}

/* ── CATEGORY SVGs ── */
function CategorySVG({ category }) {
  if (category === 'Pistolas GBB') return (
    <svg width="54" height="40" viewBox="0 0 54 40" fill="none">
      <rect x="8" y="11" width="26" height="13" rx="2" fill="white" opacity="0.3"/>
      <rect x="34" y="14" width="16" height="4.5" rx="1" fill="white" opacity="0.3"/>
      <rect x="48" y="12" width="2" height="9" rx="0.5" fill="white" opacity="0.3"/>
      <path d="M24,24 L28,24 L27,36 Q25.5,38 24,36 L24,24Z" fill="white" opacity="0.25"/>
      <rect x="10" y="24" width="12" height="4" rx="1" fill="white" opacity="0.15"/>
    </svg>
  )
  if (category === 'Sniper') return (
    <svg width="80" height="26" viewBox="0 0 80 26" fill="none">
      <rect x="5" y="10" width="28" height="8" rx="1.5" fill="white" opacity="0.3"/>
      <rect x="33" y="11" width="42" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="73" y="9" width="2.5" height="9" rx="0.5" fill="white" opacity="0.3"/>
      <rect x="14" y="6" width="10" height="4" rx="1" fill="white" opacity="0.2"/>
      <path d="M2,23 L2,16 L6,14 L6,10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
      <path d="M2,23 L7,23 L8,19 L8,10" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
      <path d="M19,18 L24,18 L23,25 Q21.5,26.5 20,25Z" fill="white" opacity="0.2"/>
    </svg>
  )
  if (category === 'Accesorios') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
  if (category === 'Equipamiento') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
  if (category === 'Piezas') return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.2" opacity="0.3">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  )
  return (
    <svg width="72" height="30" viewBox="0 0 72 30" fill="none">
      <rect x="10" y="11" width="20" height="10" rx="2" fill="white" opacity="0.3"/>
      <rect x="18" y="8" width="16" height="3" rx="1" fill="white" opacity="0.25"/>
      <rect x="30" y="12" width="28" height="4" rx="1" fill="white" opacity="0.3"/>
      <rect x="56" y="10" width="2.5" height="10" rx="0.5" fill="white" opacity="0.3"/>
      <path d="M3,26 L3,19 L7,17 L7,11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M3,26 L8.5,26 L9,22 L9,11" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <path d="M25,21 L28.5,21 L28,28 Q26.5,29.5 25.5,28Z" fill="white" opacity="0.25"/>
      <path d="M13,21 L17.5,21 Q18.5,28.5 15.5,29.5 Q12.5,28.5 13,21Z" fill="white" opacity="0.25"/>
    </svg>
  )
}
