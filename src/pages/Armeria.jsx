import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { authService } from '../services/auth'
import { articulosService } from '../services/articulos'
import './Armeria.css'

const ESTADOS = ['Nuevo', 'Como nuevo', 'Bueno', 'Aceptable']

const ETH_EUR_RATE = 2500
const BASE_ARTICULOS = 'http://localhost:3001/api/articulos'

function calcularPrecioEUR(precioEth) {
  const n = Number(precioEth)

  if (!Number.isFinite(n) || n <= 0) {
    return ''
  }

  return (n * ETH_EUR_RATE).toFixed(2)
}

function token() {
  return localStorage.getItem('token')
}

async function pedirHistorialArma(armaId) {
  const res = await fetch(`${BASE_ARTICULOS}/armeria/${armaId}/historial`, {
    headers: {
      Authorization: `Bearer ${token()}`,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al obtener el historial del arma')
  }

  return data
}

export default function Armeria() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [armas, setArmas] = useState([])
  const [loading, setLoading] = useState(true)

  const [armaSeleccionada, setArmaSeleccionada] = useState(null)
  const [form, setForm] = useState({
    precio_crypto: '',
    precio_eur: '',
    condicion: 'Bueno',
    observacion: '',
  })

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [historialModal, setHistorialModal] = useState(null)
  const [historialData, setHistorialData] = useState(null)
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialError, setHistorialError] = useState('')

  useEffect(() => {
    if (!authService.estaLogueado()) {
      navigate('/login')
      return
    }

    authService.me()
      .then(data => {
        if (data?.usuario) setUser(data.usuario)
      })
      .catch(() => {})

    cargarArmeria()
  }, [navigate])

  const cargarArmeria = () => {
    setLoading(true)

    articulosService.armeria()
      .then(data => {
        setArmas(data.armas || [])
      })
      .catch(() => {
        setArmas([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const abrirVenta = (arma) => {
    setArmaSeleccionada(arma)
    setError('')

    setForm({
      precio_crypto: '',
      precio_eur: '',
      condicion: arma.condicion_actual || 'Bueno',
      observacion: arma.observacion || '',
    })
  }

  const cerrarVenta = () => {
    if (guardando) return
    setArmaSeleccionada(null)
    setError('')
  }

  const cambiarForm = (e) => {
    const { name, value } = e.target

    if (name === 'precio_crypto') {
      setForm(prev => ({
        ...prev,
        precio_crypto: value,
        precio_eur: calcularPrecioEUR(value),
      }))

      setError('')
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))

    setError('')
  }

  const venderArma = async () => {
    if (!armaSeleccionada) return

    if (!form.precio_crypto || Number(form.precio_crypto) <= 0) {
      setError('Introduce un precio válido en ETH.')
      return
    }

    if (!form.condicion) {
      setError('Selecciona el estado actual del arma.')
      return
    }

    const precioEURCalculado = calcularPrecioEUR(form.precio_crypto)

    setGuardando(true)

    try {
      await articulosService.venderArma(armaSeleccionada.id, {
        precio_crypto: Number(form.precio_crypto),
        precio_eur: precioEURCalculado ? Number(precioEURCalculado) : null,
        condicion: form.condicion,
        observacion: form.observacion,
      })

      setArmaSeleccionada(null)
      cargarArmeria()
    } catch (err) {
      setError(err.message || 'Error al poner el arma en venta.')
    } finally {
      setGuardando(false)
    }
  }

  const quitarVenta = async (arma) => {
    if (!arma?.id) return

    const ok = window.confirm('¿Seguro que quieres quitar esta arma de la venta?')

    if (!ok) return

    try {
      await articulosService.quitarVentaArma(arma.id)
      cargarArmeria()
    } catch (err) {
      alert(err.message || 'Error al quitar de venta')
    }
  }

  const abrirHistorial = async (arma) => {
    setHistorialModal(arma)
    setHistorialData(null)
    setHistorialError('')
    setHistorialLoading(true)

    try {
      const data = await pedirHistorialArma(arma.id)
      setHistorialData(data)
    } catch (err) {
      setHistorialError(err.message || 'Error al cargar el historial')
    } finally {
      setHistorialLoading(false)
    }
  }

  const cerrarHistorial = () => {
    setHistorialModal(null)
    setHistorialData(null)
    setHistorialError('')
    setHistorialLoading(false)
  }

  return (
    <div className="ar-root">
      <Navbar user={user} activePage="armeria" />

      <main className="ar-main">
        <section className="ar-header">
          <div>
            <p className="ar-kicker">Inventario personal</p>
            <h1>Mi armería</h1>
            <span>
              Aquí aparecen las armas que has comprado en AK-MARKET. Puedes revenderlas durante 24 horas o retirarlas cuando quieras.
            </span>
          </div>

          <button className="ar-btn-primary" onClick={() => navigate('/dashboard')}>
            Ir al catálogo
          </button>
        </section>

        {loading ? (
          <div className="ar-empty">
            <span className="ar-spinner" />
            <p>Cargando tu armería...</p>
          </div>
        ) : armas.length === 0 ? (
          <div className="ar-empty">
            <h2>No tienes armas compradas</h2>
            <p>Cuando compres una réplica en la web aparecerá aquí automáticamente.</p>
            <button className="ar-btn-primary" onClick={() => navigate('/dashboard')}>
              Comprar ahora
            </button>
          </div>
        ) : (
          <div className="ar-grid">
            {armas.map(arma => (
              <ArmaCard
                key={arma.id}
                arma={arma}
                onVender={() => abrirVenta(arma)}
                onQuitarVenta={() => quitarVenta(arma)}
                onHistorial={() => abrirHistorial(arma)}
              />
            ))}
          </div>
        )}
      </main>

      {armaSeleccionada && (
        <div className="ar-modal-backdrop" onClick={cerrarVenta}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <h2>Poner en venta</h2>

            <p>
              Vas a publicar <strong>{armaSeleccionada.arma_nombre}</strong> otra vez en el marketplace.
              La publicación estará activa durante <strong>24 horas</strong>.
            </p>

            {error && <div className="ar-error">{error}</div>}

            <div className="ar-form">
              <label>
                Precio ETH
                <input
                  type="number"
                  name="precio_crypto"
                  min="0"
                  step="0.00001"
                  value={form.precio_crypto}
                  onChange={cambiarForm}
                  placeholder="0.003"
                />
              </label>

              <label>
                Precio aproximado €
                <input
                  type="text"
                  name="precio_eur"
                  value={form.precio_eur ? `${form.precio_eur} €` : ''}
                  placeholder="Se calcula automáticamente"
                  readOnly
                />
              </label>

              <label>
                Estado actual
                <select
                  name="condicion"
                  value={form.condicion}
                  onChange={cambiarForm}
                >
                  {ESTADOS.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </label>

              <label className="ar-form-full">
                Observación
                <textarea
                  name="observacion"
                  value={form.observacion}
                  onChange={cambiarForm}
                  placeholder="Ej: usada 3 veces, incluye cargador, pequeñas marcas en la culata..."
                  rows="4"
                />
              </label>
            </div>

            <div className="ar-modal-actions">
              <button className="ar-btn-secondary" onClick={cerrarVenta} disabled={guardando}>
                Cancelar
              </button>

              <button className="ar-btn-danger" onClick={venderArma} disabled={guardando}>
                {guardando ? 'Publicando...' : 'Poner en venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historialModal && (
        <HistorialModal
          arma={historialModal}
          data={historialData}
          loading={historialLoading}
          error={historialError}
          onClose={cerrarHistorial}
        />
      )}
    </div>
  )
}

function ArmaCard({ arma, onVender, onQuitarVenta, onHistorial }) {
  const cryptoSym = arma.crypto === 'BTC' ? '₿' : 'Ξ'

  const precioCrypto = Number(arma.precio_compra_crypto || 0).toString()

  const precioEur = Number(arma.precio_compra_eur || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const fecha = arma.created_at
    ? new Date(arma.created_at).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  const fechaExpira = arma.venta_expira_en
    ? new Date(arma.venta_expira_en).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <article className="ar-card">
      <div className="ar-card-img">
        {arma.foto_principal ? (
          <img src={arma.foto_principal} alt={arma.arma_nombre} />
        ) : (
          <div className="ar-no-img">
            <span>AK</span>
          </div>
        )}

        <span className={`ar-state ar-state--${arma.estado_propiedad}`}>
          {textoEstado(arma.estado_propiedad, arma.en_venta)}
        </span>
      </div>

      <div className="ar-card-body">
        <h3>{arma.arma_nombre}</h3>

        <div className="ar-tags">
          {arma.arma_categoria && <span>{arma.arma_categoria}</span>}
          {arma.condicion_actual && <span>{arma.condicion_actual}</span>}
          {arma.arma_marca && <span>{arma.arma_marca}</span>}
          <span>{arma.numero_duenos || 1} dueño{Number(arma.numero_duenos || 1) === 1 ? '' : 's'}</span>
        </div>

        <div className="ar-info">
          {arma.arma_modelo && <p><strong>Modelo:</strong> {arma.arma_modelo}</p>}
          {arma.arma_numero_serie && <p><strong>Nº serie:</strong> {arma.arma_numero_serie}</p>}
          {fecha && <p><strong>Compra:</strong> {fecha}</p>}
          {arma.tx_hash && (
            <p>
              <strong>Tx:</strong> {arma.tx_hash.slice(0, 10)}...{arma.tx_hash.slice(-6)}
            </p>
          )}
        </div>

        {arma.observacion && (
          <p className="ar-obs">{arma.observacion}</p>
        )}

        {arma.en_venta && fechaExpira && (
          <p className="ar-expira">
            En venta hasta: {fechaExpira}
          </p>
        )}

        <div className="ar-price">
          <div>
            <strong>{precioCrypto} {cryptoSym}</strong>
            <span>Compra ≈ {precioEur}€</span>
          </div>
        </div>

        {arma.etherscan_url && (
          <a
            className="ar-etherscan-btn"
            href={arma.etherscan_url}
            target="_blank"
            rel="noreferrer"
          >
            Ver transacción en Etherscan
          </a>
        )}

        <button
          className="ar-history-btn"
          onClick={onHistorial}
        >
          Ver historial del arma
        </button>

        {arma.estado_propiedad === 'vendida' ? (
          <button
            className="ar-sell-btn"
            disabled
          >
            Vendida
          </button>
        ) : arma.en_venta ? (
          <button
            className="ar-remove-sale-btn"
            onClick={onQuitarVenta}
          >
            Quitar de venta
          </button>
        ) : (
          <button
            className="ar-sell-btn"
            onClick={onVender}
          >
            Vender esta arma
          </button>
        )}
      </div>
    </article>
  )
}

function HistorialModal({ arma, data, loading, error, onClose }) {
  const historial = data?.historial || []
  const numeroDuenos = data?.numero_duenos || arma.numero_duenos || 1

  return (
    <div className="ar-modal-backdrop" onClick={onClose}>
      <div className="ar-modal ar-history-modal" onClick={e => e.stopPropagation()}>
        <h2>Historial del arma</h2>

        <p>
          <strong>{arma.arma_nombre}</strong> ha tenido <strong>{numeroDuenos}</strong> dueño{Number(numeroDuenos) === 1 ? '' : 's'}.
        </p>

        {loading && (
          <div className="ar-history-loading">
            <span className="ar-spinner" />
            <p>Cargando historial...</p>
          </div>
        )}

        {error && (
          <div className="ar-error">{error}</div>
        )}

        {!loading && !error && (
          <>
            {historial.length === 0 ? (
              <div className="ar-history-empty">
                Todavía no hay transacciones anteriores registradas para esta arma.
              </div>
            ) : (
              <div className="ar-history-list">
                {historial.map(tx => (
                  <div className="ar-history-item" key={tx.id}>
                    <div className="ar-history-top">
                      <span>Transacción #{tx.orden}</span>
                      <strong>{tx.precio_crypto} {tx.crypto || 'ETH'}</strong>
                    </div>

                    <div className="ar-history-grid">
                      <p>
                        <span>Precio aprox.</span>
                        <strong>{Number(tx.precio_eur || 0).toLocaleString('es-ES')}€</strong>
                      </p>

                      <p>
                        <span>Red</span>
                        <strong>{tx.red || 'sepolia'}</strong>
                      </p>

                      <p>
                        <span>Fecha</span>
                        <strong>{formatearFecha(tx.created_at)}</strong>
                      </p>

                      <p>
                        <span>Bloque</span>
                        <strong>{tx.bloque_pago || '—'}</strong>
                      </p>
                    </div>

                    {tx.tx_hash && (
                      <div className="ar-history-hash">
                        <span>Tx hash</span>
                        <code>{tx.tx_hash}</code>

                        <a
                          href={tx.etherscan_url || `https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver en Etherscan
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="ar-modal-actions">
          <button className="ar-btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'

  return new Date(valor).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function textoEstado(estado, enVenta) {
  if (estado === 'vendida') return 'Vendida'
  if (enVenta || estado === 'en_venta') return 'En venta'
  if (estado === 'disponible') return 'Disponible'
  if (estado === 'bloqueada') return 'Bloqueada'
  return estado || 'Disponible'
}