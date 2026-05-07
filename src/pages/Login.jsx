import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()

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

    setError('')
    setLoading(true)

    try {
      const data = await authService.login(form.email, form.password)

      authService.guardarSesion(data.token)

      if (data.usuario?.rol === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-left__inner">
          <div className="brand">
            <div className="brand__icon">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
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
              </svg>
            </div>

            <span className="brand__name">AK-MARKET</span>
          </div>

          <div className="login-left__headline">
            <h1>
              Bienvenido
              <br />
              <span className="accent">de nuevo</span>
            </h1>

            <p>
              Inicia sesión para acceder a tu cuenta. Si eres administrador,
              entrarás directamente al panel interno.
            </p>
          </div>

          <div className="chart-container">
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
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
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
            <p>Accede con tu email y contraseña</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>

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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Mostrar contraseña"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

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
          </p>
        </div>

        <p className="login-footer">
          © 2025 AK-MARKET · <a href="#">Privacidad</a> ·{' '}
          <a href="#">Términos</a>
        </p>
      </div>
    </div>
  )
}