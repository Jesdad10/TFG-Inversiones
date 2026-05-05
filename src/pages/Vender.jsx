import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { articulosService } from '../services/articulos'
import Navbar from '../components/Navbar'
import './Vender.css'

const CATEGORIAS = ['Rifles AEG', 'Pistolas GBB', 'Sniper', 'Accesorios', 'Equipamiento', 'Piezas']
const CONDICIONES = ['Nuevo', 'Como nuevo', 'Bueno', 'Aceptable']

const CRYPTO_RATES = { ETH: 2500, BTC: 95000 }

const ENVIO_TIERS = [
  { id: 'ligero',     label: 'Ligero',     desc: 'Hasta 1 kg',    precio: 4.99  },
  { id: 'medio',      label: 'Medio',      desc: '1 – 3 kg',      precio: 8.99  },
  { id: 'pesado',     label: 'Pesado',     desc: '3 – 10 kg',     precio: 15.99 },
  { id: 'muy_pesado', label: 'Muy pesado', desc: 'Más de 10 kg',  precio: 24.99 },
]

const TAMANOS = [
  { id: 'pequeno', label: 'Pequeño',      desc: 'hasta 30 × 20 × 15 cm' },
  { id: 'mediano', label: 'Mediano',      desc: 'hasta 50 × 40 × 30 cm' },
  { id: 'grande',  label: 'Grande',       desc: 'hasta 80 × 60 × 40 cm' },
  { id: 'extra',   label: 'Extra grande', desc: 'más de 80 × 60 × 40 cm' },
]

const MAX_FOTOS = 5
const COMISION  = 0.03

const FORM_VACIO = {
  titulo: '', categoria: '', condicion: '', descripcion: '',
  crypto: 'ETH', precio: '', pesoTier: '', tamano: '',
}

export default function Vender() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [user, setUser]           = useState(null)
  const [fotos, setFotos]         = useState([])
  const [form, setForm]           = useState(FORM_VACIO)
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors]       = useState({})

  useEffect(() => {
    if (!authService.estaLogueado()) { navigate('/login'); return }
    try {
      const token   = localStorage.getItem('token')
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      setUser({ nombre: payload.nombre, email: payload.email })
    } catch (_) {}
    authService.me().then(d => { if (d?.usuario) setUser(d.usuario) }).catch(() => {})
  }, [navigate])

  // ── cálculos en tiempo real ────────────────────────────────────
  const precioNum   = parseFloat(form.precio) || 0
  const tasa        = CRYPTO_RATES[form.crypto]
  const precioEUR   = precioNum * tasa
  const comisionEUR = precioEUR * COMISION
  const envioTier   = ENVIO_TIERS.find(t => t.id === form.pesoTier)
  const envioEUR    = envioTier?.precio || 0
  const netoEUR     = precioEUR - comisionEUR - envioEUR

  // ── fotos ──────────────────────────────────────────────────────
  const openPicker = () => fileRef.current?.click()

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    const restantes = MAX_FOTOS - fotos.length
    files.slice(0, restantes).forEach(file => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > height) { if (width > MAX) { height = Math.round(height * MAX / width); width = MAX } }
        else                { if (height > MAX) { width = Math.round(width * MAX / height); height = MAX } }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        setFotos(prev => prev.length < MAX_FOTOS ? [...prev, canvas.toDataURL('image/jpeg', 0.85)] : prev)
        setErrors(p => ({ ...p, fotos: '' }))
      }
      img.src = url
    })
  }

  const removeFoto = (i) => setFotos(prev => prev.filter((_, idx) => idx !== i))

  // ── campos ─────────────────────────────────────────────────────
  const handleField = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  const setTile = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }))
  }

  // ── validación ─────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.titulo.trim())           e.titulo      = 'El título es obligatorio'
    if (!form.categoria)               e.categoria   = 'Selecciona una categoría'
    if (!form.condicion)               e.condicion   = 'Selecciona la condición'
    if (!form.descripcion.trim())      e.descripcion = 'Añade una descripción'
    if (!form.precio || precioNum <= 0) e.precio     = 'Introduce un precio válido'
    if (!form.pesoTier)                e.pesoTier    = 'Selecciona el peso del paquete'
    if (!form.tamano)                  e.tamano      = 'Selecciona el tamaño del paquete'
    if (fotos.length === 0)            e.fotos       = 'Sube al menos una foto'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      document.querySelector('.err-msg')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setLoading(true)
    try {
      await articulosService.crear({
        titulo:       form.titulo,
        descripcion:  form.descripcion,
        categoria:    form.categoria,
        condicion:    form.condicion,
        crypto:       form.crypto,
        precio_crypto: precioNum,
        precio_eur:   precioEUR,
        peso_tier:    form.pesoTier,
        tamano:       form.tamano,
        envio_precio: envioEUR,
        comision:     comisionEUR,
        neto_eur:     netoEUR,
        fotos,
      })
      setSubmitted(true)
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  // ── pantalla de éxito ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="vender-root">
        <Navbar user={user} activePage="vender" />
        <main className="vender-main">
          <div className="vender-success">
            <div className="success-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2>¡Artículo publicado!</h2>
            <p>Tu anuncio ya está disponible en el catálogo.</p>
            <div className="success-actions">
              <button className="btn-go-dash" onClick={() => navigate('/dashboard')}>Ir al inicio</button>
              <button className="btn-otro" onClick={() => { setForm(FORM_VACIO); setFotos([]); setSubmitted(false) }}>
                Publicar otro
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── formulario principal ───────────────────────────────────────
  return (
    <div className="vender-root">
      <Navbar user={user} activePage="vender" />

      <main className="vender-main">
        <div className="vender-container">

          <div className="vender-page-header">
            <h1>Publicar artículo</h1>
            <p>Completa los detalles de tu réplica o accesorio de airsoft</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── FOTOS ────────────────────────────────────── */}
            <div className="vender-section">
              <h2 className="vs-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Fotos
                <span className="vs-counter">{fotos.length} / {MAX_FOTOS}</span>
              </h2>

              <div className="fotos-grid">
                {fotos.map((src, i) => (
                  <div key={i} className={`fslot fslot--filled${i === 0 ? ' fslot--main' : ''}`}>
                    <img src={src} alt={`foto ${i + 1}`} />
                    {i === 0 && <span className="fslot-badge">Principal</span>}
                    <button type="button" className="fslot-del" onClick={() => removeFoto(i)}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {fotos.length < MAX_FOTOS && (
                  <div className={`fslot fslot--add${errors.fotos ? ' fslot--err' : ''}`} onClick={openPicker}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>{fotos.length === 0 ? 'Añadir fotos' : 'Añadir más'}</span>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                  </div>
                )}
              </div>
              {errors.fotos && <p className="err-msg">{errors.fotos}</p>}
              <p className="vs-hint">La primera foto será la imagen principal del anuncio.</p>
            </div>

            {/* ── INFORMACIÓN ──────────────────────────────── */}
            <div className="vender-section">
              <h2 className="vs-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Información del artículo
              </h2>

              <div className="vgrid">
                <div className="vf" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="titulo">Título del anuncio *</label>
                  <input
                    id="titulo" name="titulo" type="text"
                    className={`vi${errors.titulo ? ' vi--err' : ''}`}
                    placeholder="Ej: Tokyo Marui M4A1 SOPMOD AEG — estado perfecto"
                    maxLength={80} value={form.titulo} onChange={handleField}
                  />
                  <div className="vf-foot">
                    {errors.titulo ? <span className="err-msg">{errors.titulo}</span> : <span />}
                    <span className="char-cnt">{form.titulo.length}/80</span>
                  </div>
                </div>

                <div className="vf">
                  <label>Categoría *</label>
                  <div className={`tile-wrap${errors.categoria ? ' tile-wrap--err' : ''}`}>
                    {CATEGORIAS.map(c => (
                      <button key={c} type="button"
                        className={`tile${form.categoria === c ? ' tile--on' : ''}`}
                        onClick={() => setTile('categoria', c)}
                      >{c}</button>
                    ))}
                  </div>
                  {errors.categoria && <span className="err-msg">{errors.categoria}</span>}
                </div>

                <div className="vf">
                  <label>Condición *</label>
                  <div className={`tile-wrap${errors.condicion ? ' tile-wrap--err' : ''}`}>
                    {CONDICIONES.map(c => (
                      <button key={c} type="button"
                        className={`tile${form.condicion === c ? ' tile--on' : ''}`}
                        onClick={() => setTile('condicion', c)}
                      >{c}</button>
                    ))}
                  </div>
                  {errors.condicion && <span className="err-msg">{errors.condicion}</span>}
                </div>

                <div className="vf" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="descripcion">Descripción *</label>
                  <textarea
                    id="descripcion" name="descripcion"
                    className={`vta${errors.descripcion ? ' vi--err' : ''}`}
                    placeholder="Describe el artículo: estado detallado, accesorios incluidos, modificaciones realizadas, tiempo de uso, defectos si los hay..."
                    maxLength={600} value={form.descripcion} onChange={handleField}
                  />
                  <div className="vf-foot">
                    {errors.descripcion ? <span className="err-msg">{errors.descripcion}</span> : <span />}
                    <span className="char-cnt">{form.descripcion.length}/600</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PRECIO ───────────────────────────────────── */}
            <div className="vender-section">
              <h2 className="vs-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Precio
              </h2>

              <div className="crypto-toggle">
                {['ETH', 'BTC'].map(c => (
                  <button key={c} type="button"
                    className={`crypto-btn${form.crypto === c ? ' crypto-btn--on' : ''}`}
                    onClick={() => setTile('crypto', c)}
                  >
                    <span className="crypto-sym">{c === 'ETH' ? 'Ξ' : '₿'}</span>
                    {c === 'ETH' ? 'Ethereum' : 'Bitcoin'}
                  </button>
                ))}
              </div>

              <div className="precio-row">
                <div className="vf" style={{ flex: 1 }}>
                  <label>Precio en {form.crypto} *</label>
                  <div className={`precio-box${errors.precio ? ' vi--err' : ''}`}>
                    <input
                      name="precio" type="number" min="0"
                      step={form.crypto === 'ETH' ? '0.001' : '0.00001'}
                      className="precio-inp"
                      placeholder={form.crypto === 'ETH' ? '0.000' : '0.00000'}
                      value={form.precio} onChange={handleField}
                    />
                    <span className="precio-sym">{form.crypto === 'ETH' ? 'Ξ' : '₿'}</span>
                  </div>
                  {errors.precio && <span className="err-msg">{errors.precio}</span>}
                </div>

                <div className="eur-card">
                  <p className="eur-label">Equivalente en euros</p>
                  <p className="eur-amount">
                    {precioEUR > 0
                      ? precioEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
                      : '—'}
                  </p>
                  <p className="eur-rate">1 {form.crypto} ≈ {tasa.toLocaleString('es-ES')} €</p>
                </div>
              </div>
            </div>

            {/* ── ENVÍO ────────────────────────────────────── */}
            <div className="vender-section">
              <h2 className="vs-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Envío
              </h2>

              <div className="vgrid">
                <div className="vf">
                  <label>Peso aproximado *</label>
                  <div className={`ship-list${errors.pesoTier ? ' tile-wrap--err' : ''}`}>
                    {ENVIO_TIERS.map(t => (
                      <button key={t.id} type="button"
                        className={`ship-row${form.pesoTier === t.id ? ' ship-row--on' : ''}`}
                        onClick={() => setTile('pesoTier', t.id)}
                      >
                        <span className="ship-name">{t.label}</span>
                        <span className="ship-desc">{t.desc}</span>
                        <span className="ship-price">{t.precio.toFixed(2)} €</span>
                      </button>
                    ))}
                  </div>
                  {errors.pesoTier && <span className="err-msg">{errors.pesoTier}</span>}
                </div>

                <div className="vf">
                  <label>Tamaño del paquete *</label>
                  <div className={`ship-list${errors.tamano ? ' tile-wrap--err' : ''}`}>
                    {TAMANOS.map(t => (
                      <button key={t.id} type="button"
                        className={`ship-row${form.tamano === t.id ? ' ship-row--on' : ''}`}
                        onClick={() => setTile('tamano', t.id)}
                      >
                        <span className="ship-name">{t.label}</span>
                        <span className="ship-desc">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                  {errors.tamano && <span className="err-msg">{errors.tamano}</span>}
                </div>
              </div>
            </div>

            {/* ── RESUMEN ──────────────────────────────────── */}
            {precioEUR > 0 && (
              <div className="vender-section">
                <h2 className="vs-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Resumen de ingresos
                </h2>

                <div className="resumen-card">
                  <div className="r-row">
                    <span>Precio de venta</span>
                    <span className="r-val">
                      {precioNum} {form.crypto === 'ETH' ? 'Ξ' : '₿'} ≈ {precioEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div className="r-row r-row--neg">
                    <span>Comisión plataforma (3%)</span>
                    <span>− {comisionEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="r-row r-row--neg">
                    <span>Gastos de envío{envioTier ? ` (${envioTier.label})` : ''}</span>
                    <span>{envioTier ? `− ${envioEUR.toFixed(2)} €` : <em>Selecciona el peso</em>}</span>
                  </div>
                  <div className="r-sep" />
                  <div className="r-row r-row--total">
                    <span>Recibirás</span>
                    <span className={netoEUR >= 0 ? 'neto-ok' : 'neto-bad'}>
                      {netoEUR >= 0
                        ? netoEUR.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
                        : 'Precio insuficiente para cubrir los gastos'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── PUBLICAR ─────────────────────────────────── */}
            <div className="vender-submit">
              {errors.submit && <p className="err-msg" style={{ textAlign: 'center', marginBottom: '12px' }}>{errors.submit}</p>}
              <button type="submit" className="btn-publicar" disabled={loading}>
                {loading && <span className="pub-spinner" />}
                {loading ? 'Publicando...' : 'Publicar artículo'}
              </button>
              <p className="submit-note">Tu artículo se publicará inmediatamente en el catálogo.</p>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}
