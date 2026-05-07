import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    wallet: '',
    password: '',
    confirm: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrado, setRegistrado] = useState(false)
  const [nombreRegistrado, setNombreRegistrado] = useState('')

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const passwordStrength = () => {
    const p = form.password

    if (!p) return 0

    let score = 0

    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++

    return score
  }

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#7EAE28']
  const strength = passwordStrength()

  const passwordsMatch = form.confirm && form.password === form.confirm

  const conectarWallet = async () => {
    setError('')

    try {
      if (!window.ethereum) {
        setError('No tienes MetaMask instalado')
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const wallet = accounts?.[0] || ''

      if (!wallet) {
        setError('No se ha podido obtener la wallet')
        return
      }

      setForm((prev) => ({
        ...prev,
        wallet,
      }))
    } catch {
      setError('No se ha podido conectar con MetaMask')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!accepted) {
      setError('Debes aceptar los términos')
      return
    }

    if (!form.name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!form.email.trim()) {
      setError('El email es obligatorio')
      return
    }

    if (!form.wallet.trim()) {
      setError('Debes conectar o introducir tu wallet')
      return
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await authService.register(
        form.name,
        form.email,
        form.password,
        form.wallet
      )

      authService.guardarSesion(data.token)

      setNombreRegistrado(form.name)
      setRegistrado(true)

      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario')
    } finally {
      setLoading(false)
    }
  }

  if (registrado) {
    return (
      <div className="reg-root">
        <div className="reg-left">
          <div className="reg-left__inner">
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
          </div>

          <div className="orb orb--1" />
          <div className="orb orb--2" />
          <div className="grid-overlay" />
        </div>

        <div className="reg-right">
          <div className="success-card">
            <div className="success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="success-title">¡Cuenta creada!</h2>

            <p className="success-name">
              Bienvenido, <span>{nombreRegistrado}</span>
            </p>

            <p className="success-msg">
              Tu cuenta se ha registrado correctamente en Firebase.
            </p>

            <div className="success-bar">
              <div className="success-bar__fill" />
            </div>

            <p className="success-redirect">Redirigiendo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reg-root">
      <div className="reg-left">
        <div className="reg-left__inner">
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

          <div className="reg-left__headline">
            <h1>
              Crea tu cuenta
              <br />
              <span className="accent">con Firebase</span>
            </h1>

            <p>
              Regístrate con email, contraseña y wallet. El usuario se guardará directamente en Firestore.
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step__num">01</div>
              <div className="step__body">
                <span className="step__title">Datos básicos</span>
                <span className="step__desc">Nombre y correo electrónico</span>
              </div>
            </div>

            <div className="step__connector" />

            <div className="step">
              <div className="step__num">02</div>
              <div className="step__body">
                <span className="step__title">Wallet</span>
                <span className="step__desc">Introduce o conecta tu wallet</span>
              </div>
            </div>

            <div className="step__connector" />

            <div className="step">
              <div className="step__num">03</div>
              <div className="step__body">
                <span className="step__title">Acceso</span>
                <span className="step__desc">Login automático al registrarte</span>
              </div>
            </div>
          </div>

          <div className="trust-row">
            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Firebase Auth</span>
            </div>

            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Firestore</span>
            </div>
          </div>
        </div>

        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="grid-overlay" />
      </div>

      <div className="reg-right">
        <div className="reg-card">
          <div className="reg-card__header">
            <h2>Crear cuenta</h2>
            <p>Guarda el usuario directamente en Firebase</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="reg-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <label htmlFor="wallet">Wallet</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M16 12h4" />
                </svg>

                <input
                  id="wallet"
                  name="wallet"
                  type="text"
                  placeholder="0x..."
                  value={form.wallet}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-metamask"
              onClick={conectarWallet}
            >
              Conectar wallet con MetaMask
            </button>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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

              {form.password && (
                <div className="strength-wrap">
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="strength-segment"
                        style={{
                          background:
                            i <= strength
                              ? strengthColor[strength]
                              : 'rgba(255,255,255,0.07)',
                        }}
                      />
                    ))}
                  </div>

                  <span
                    className="strength-label"
                    style={{ color: strengthColor[strength] }}
                  >
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirmar contraseña</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  style={
                    form.confirm
                      ? {
                          borderColor: passwordsMatch
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(239,68,68,0.45)',
                        }
                      : {}
                  }
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Mostrar confirmación"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <label className="terms-row">
              <div
                className={`checkbox${accepted ? ' checked' : ''}`}
                onClick={() => setAccepted(!accepted)}
              >
                {accepted && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <span>
                Acepto los <a href="#">Términos de servicio</a> y la{' '}
                <a href="#">Política de privacidad</a>
              </span>
            </label>

            <button
              type="submit"
              className={`btn-primary${loading ? ' loading' : ''}`}
              disabled={loading || !accepted}
            >
              {loading ? <span className="spinner" /> : 'Crear mi cuenta'}
            </button>
          </form>

          <p className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>

        <p className="reg-footer">
          © 2025 AK-MARKET · <a href="#">Privacidad</a> ·{' '}
          <a href="#">Términos</a>
        </p>
      </div>
    </div>
  )
}