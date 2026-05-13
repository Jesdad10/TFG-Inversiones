import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [error, setError] = useState('')
  const [bloqueado, setBloqueado] = useState(false)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')
  const [mensajeModal, setMensajeModal] = useState(null)

  const irDespuesLogin = (usuario) => {
    if (usuario?.rol === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  const controlarErrorBloqueado = (err) => {
    const errorBackend = err?.data?.error || err?.message || ''
    const motivo = err?.data?.motivo || err?.data?.motivo_bloqueo || ''

    if (errorBackend === 'bloqueado') {
      setBloqueado(true)
      setMotivoBloqueo(motivo)
      return true
    }

    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await authService.login(email.trim(), password)

      authService.guardarSesion(data.token)
      irDespuesLogin(data.usuario)
    } catch (err) {
      if (!controlarErrorBloqueado(err)) {
        setError(err.message || 'Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  const conectarWallet = async () => {
    if (!window.ethereum) {
      throw new Error('No tienes MetaMask instalado en este navegador.')
    }

    const cuentas = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    if (!cuentas || cuentas.length === 0) {
      throw new Error('No se ha podido obtener ninguna cuenta de MetaMask.')
    }

    return cuentas[0]
  }

  const handleMetaMask = async () => {
    setError('')
    setLoadingWallet(true)

    try {
      const wallet = await conectarWallet()
      const data = await authService.loginWallet(wallet.toLowerCase())

      authService.guardarSesion(data.token)
      irDespuesLogin(data.usuario)
    } catch (err) {
      if (controlarErrorBloqueado(err)) {
        return
      }

      if (err.code === 4001 || err.message?.includes('User rejected')) {
        setMensajeModal({
          titulo: 'Conexión cancelada',
          texto: 'Has cancelado la conexión con MetaMask.',
        })
      } else if (err.message?.includes('Wallet no registrada')) {
        setMensajeModal({
          titulo: 'Wallet no registrada',
          texto: 'Esta wallet no está registrada. Entra con email y contraseña y añádela desde Mi perfil.',
        })
      } else {
        setMensajeModal({
          titulo: 'Error con MetaMask',
          texto: err.message || 'No se ha podido conectar con MetaMask.',
        })
      }
    } finally {
      setLoadingWallet(false)
    }
  }

  return (
    <div className="login-root">
      {bloqueado && (
        <div className="modal-backdrop">
          <div className="login-blocked-modal">
            <div className="login-blocked-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>

            <h3>Usuario bloqueado temporalmente</h3>

            <p>
              Tu cuenta ha sido suspendida temporalmente. Por favor, contacta con el soporte para más información.
            </p>

            {motivoBloqueo && (
              <div className="login-blocked-reason">
                <strong>Motivo:</strong> {motivoBloqueo}
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => setBloqueado(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {mensajeModal && (
        <div className="modal-backdrop">
          <div className="login-blocked-modal">
            <div className="login-blocked-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3>{mensajeModal.titulo}</h3>
            <p>{mensajeModal.texto}</p>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => setMensajeModal(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="login-left">
        <div className="login-left__inner">
          <div className="brand">
            <div className="brand__icon">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <span className="brand__name">AK-MARKET</span>
          </div>

          <div className="login-left__headline">
            <h1>
              La armería
              <br />
              <span className="accent">del airsoft</span>
            </h1>

            <p>
              Compra y vende réplicas, accesorios y equipamiento de airsoft pagando con criptomonedas.
              Seguro, rápido y descentralizado.
            </p>
          </div>

          <div className="chart-container">
            <svg viewBox="0 0 400 120" className="chart-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CC1F1F" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#CC1F1F" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d="M0,90 C30,80 50,60 80,55 C110,50 130,70 160,50 C190,30 210,40 240,25 C270,10 290,30 320,20 C350,10 370,15 400,8"
                fill="none"
                stroke="#CC1F1F"
                strokeWidth="2.5"
                className="chart-line"
              />

              <path
                d="M0,90 C30,80 50,60 80,55 C110,50 130,70 160,50 C190,30 210,40 240,25 C270,10 290,30 320,20 C350,10 370,15 400,8 L400,120 L0,120 Z"
                fill="url(#chartGrad)"
                className="chart-fill"
              />
            </svg>

            <div className="chart-badge">
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="#CC1F1F" />
              </svg>
              <span>+320 ventas este mes</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span className="stat__value">500+</span>
              <span className="stat__label">Réplicas disponibles</span>
            </div>

            <div className="stat">
              <span className="stat__value">1,247</span>
              <span className="stat__label">Jugadores registrados</span>
            </div>

            <div className="stat">
              <span className="stat__value">24h</span>
              <span className="stat__label">Envío garantizado</span>
            </div>
          </div>
        </div>

        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="grid-overlay" />
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card__header">
            <h2>Iniciar sesión</h2>
            <p>Accede a tu cuenta de AK-MARKET</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Contraseña</label>
                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar contraseña"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                'Entrar a la tienda'
              )}
            </button>
          </form>

          <div className="divider">
            <span>o continúa con</span>
          </div>

          <button
            type="button"
            className="btn-metamask"
            onClick={handleMetaMask}
            disabled={loadingWallet}
          >
            {loadingWallet ? (
              <span className="spinner" />
            ) : (
              <>
                <span className="metamask-logo">🦊</span>
                Conectar con MetaMask
              </>
            )}
          </button>

          <p className="register-link">
            ¿No tienes cuenta?{' '}
            <Link to="/register">Regístrate gratis</Link>
          </p>
        </div>

        <p className="login-footer">
          © 2025 AK-MARKET · <a href="#">Privacidad</a> · <a href="#">Términos</a>
        </p>
      </div>
    </div>
  )
}