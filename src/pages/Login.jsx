import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
<<<<<<< HEAD
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [error, setError] = useState('')
  const [bloqueado, setBloqueado] = useState(false)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
=======

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!form.password) {
      setError('La contraseña es obligatoria')
      return
    }

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    setError('')
    setLoading(true)

    try {
<<<<<<< HEAD
      const data = await authService.login(email, password)
      authService.guardarSesion(data.token)
      navigate('/dashboard')
    } catch (err) {
      if (err.data?.error === 'bloqueado') {
        setBloqueado(true)
        setMotivoBloqueo(err.data?.motivo || '')
      } else {
        setError(err.message)
      }
=======
      const data = await authService.login(form.email, form.password)

      authService.guardarSesion(data.token)

      if (data.usuario?.rol === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
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
      navigate('/dashboard')
    } catch (err) {
      if (err.message?.includes('User rejected')) {
        setError('Has cancelado la conexión con MetaMask.')
      } else if (err.message?.includes('Wallet no registrada')) {
        setError('Esta wallet no está registrada. Entra con email y contraseña y añade tu wallet en Mi perfil.')
      } else {
        setError(err.message || 'Error al conectar con MetaMask.')
      }
    } finally {
      setLoadingWallet(false)
    }
  }

  return (
    <div className="login-root">
      {bloqueado && (
        <div className="modal-backdrop" style={{ zIndex: 1000 }}>
          <div className="login-blocked-modal">
            <div className="login-blocked-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
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

            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setBloqueado(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}

=======
  return (
    <div className="login-root">
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
      <div className="login-left">
        <div className="login-left__inner">
          <div className="brand">
            <div className="brand__icon">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
<<<<<<< HEAD
                <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
=======
                <path
                  d="M3,25 L14,3 L14,25"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8,15 L14,15"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14,15 L25,3"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14,15 L25,25"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              </svg>
            </div>

            <span className="brand__name">AK-MARKET</span>
          </div>

          <div className="login-left__headline">
<<<<<<< HEAD
            <h1>La armería<br /><span className="accent">del airsoft</span></h1>
            <p>
              Compra y vende réplicas, accesorios y equipamiento de airsoft pagando con criptomonedas.
              Seguro, rápido y descentralizado.
=======
            <h1>
              Bienvenido
              <br />
              <span className="accent">de nuevo</span>
            </h1>

            <p>
              Inicia sesión para acceder a tu cuenta. Si eres administrador,
              entrarás directamente al panel interno.
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
            </p>
          </div>

          <div className="chart-container">
<<<<<<< HEAD
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
=======
            <svg className="chart-svg" viewBox="0 0 420 120" fill="none">
              <path
                className="chart-fill"
                d="M0 95 C50 80 70 60 110 70 C160 85 180 25 230 35 C280 45 300 75 350 40 C385 15 405 20 420 10 L420 120 L0 120 Z"
                fill="url(#chartGradient)"
              />

              <path
                className="chart-line"
                d="M0 95 C50 80 70 60 110 70 C160 85 180 25 230 35 C280 45 300 75 350 40 C385 15 405 20 420 10"
                stroke="#CC1F1F"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="120">
                  <stop stopColor="#CC1F1F" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#CC1F1F" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="chart-badge">
              <span>Firebase activo</span>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
<<<<<<< HEAD
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
=======
              <span className="stat__value">Auth</span>
              <span className="stat__label">Login</span>
            </div>

            <div className="stat">
              <span className="stat__value">DB</span>
              <span className="stat__label">Firestore</span>
            </div>

            <div className="stat">
              <span className="stat__value">Rol</span>
              <span className="stat__label">Admin</span>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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
<<<<<<< HEAD
            <p>Accede a tu cuenta de AK-MARKET</p>
=======
            <p>Accede con tu email y contraseña</p>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>

              <div className="input-wrapper">
<<<<<<< HEAD
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
=======
                <svg
                  className="input-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>

                <input
                  id="email"
<<<<<<< HEAD
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
=======
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
<<<<<<< HEAD
              <div className="label-row">
                <label htmlFor="password">Contraseña</label>
                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
=======
              <label htmlFor="password">Contraseña</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="password"
<<<<<<< HEAD
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
=======
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={handleChange}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar contraseña"
                >
<<<<<<< HEAD
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
=======
                  {showPassword ? '🙈' : '👁️'}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                </button>
              </div>
            </div>

<<<<<<< HEAD
            <button type="submit" className={`btn-primary${loading ? ' loading' : ''}`} disabled={loading || loadingWallet}>
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
            className={`btn-metamask${loadingWallet ? ' loading' : ''}`}
            onClick={handleMetaMask}
            disabled={loadingWallet || loading}
          >
            {loadingWallet ? (
              <span className="spinner" />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 35 33" fill="none">
                  <path d="M32.958.5L19.535 10.585l2.454-5.794L32.958.5Z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.042.5l13.312 10.18-2.34-5.89L2.042.5ZM28.164 23.463l-3.574 5.47 7.647 2.106 2.194-7.454-6.267-.122ZM1.607 23.585l2.18 7.454 7.633-2.106-3.56-5.47-6.253.122Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m21.886 14.257-2.18 3.289 7.77.353-.258-8.354-5.332 4.712ZM13.1 14.257l-5.4-4.807-.176 8.449 7.756-.353-2.18-3.289ZM11.42 28.933l4.658-2.269-4.02-3.139-.638 5.408ZM18.908 26.664l4.645 2.269-.624-5.408-4.021 3.139Z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m23.553 28.933-4.645-2.269.38 3.044-.042 1.318 4.307-2.093ZM11.42 28.933l4.321 2.093-.027-1.318.352-3.044-4.646 2.269Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m15.796 21.913-3.872-1.141 2.74-1.251 1.132 2.392ZM19.19 21.913l1.131-2.392 2.754 1.251-3.885 1.141Z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m11.42 28.933.665-5.47-4.225.122 3.56 5.348ZM22.915 23.463l.638 5.47 3.574-5.348-4.212-.122ZM26.476 17.546l-7.756.353.72 3.914 1.132-2.392 2.754 1.251 3.15-3.126ZM11.924 20.772l2.74-1.251 1.118 2.392.734-3.914-7.77-.353 3.178 3.126Z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m8.746 17.546 3.25 6.348-.109-3.122-3.141-3.226ZM23.13 20.772l-.122 3.122 3.264-6.348-3.142 3.226ZM15.514 17.9l-.734 3.913.92 4.74.205-6.25-.391-2.403ZM19.434 17.9l-.377 2.389.177 6.264.934-4.74-.734-3.914Z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m19.19 21.913-.934 4.74.666.46 4.02-3.138.123-3.122-3.875 1.06ZM11.924 20.772l.109 3.122 4.021 3.139.666-.46-.92-4.74-3.876-1.06Z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m19.245 31.026.041-1.318-.353-.298h-5.237l-.326.298.027 1.318-4.321-2.093 1.511 1.236 3.06 2.12h5.265l3.074-2.12 1.497-1.236-4.238 2.093Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m18.909 26.664-.666-.46h-3.5l-.665.46-.353 3.044.326-.298h5.237l.353.298-.732-3.044Z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M33.52 11.12 34.5.5l-1.542-.5-12.573 9.338 4.83 4.077 6.826 1.993 1.51-1.764-.652-.475 1.037-.95-.803-.62 1.037-.798-.65-.482ZM.5.5l.98 10.62-.625.46 1.037.798-.789.62 1.023.95-.651.475 1.496 1.764 6.826-1.993 4.83-4.077L1.055 0 .5.5Z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m31.94 15.408-6.826-1.993 2.194 3.13-3.264 6.348 4.307-.054h6.267l-2.678-7.43ZM8.872 13.415l-6.84 1.993-2.637 7.43h6.253l4.293.054-3.25-6.348 2.181-3.13ZM19.434 17.9l.434-7.062 2.003-5.413H13.1l1.98 5.413.461 7.062.164 2.43.013 6.237h3.5l.028-6.237.188-2.43Z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Conectar con MetaMask
              </>
            )}
          </button>

          <p className="register-link">
            ¿No tienes cuenta?{' '}
            <Link to="/register">Regístrate gratis</Link>
=======
            <button
              type="submit"
              className={`btn-primary${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Entrar'}
            </button>
          </form>

          <p className="register-link">
            ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          </p>
        </div>

        <p className="login-footer">
<<<<<<< HEAD
          © 2025 AK-MARKET · <a href="#">Privacidad</a> · <a href="#">Términos</a>
=======
          © 2025 AK-MARKET · <a href="#">Privacidad</a> ·{' '}
          <a href="#">Términos</a>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
        </p>
      </div>
    </div>
  )
}