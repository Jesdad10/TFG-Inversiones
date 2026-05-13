import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
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
  const [mensajeModal, setMensajeModal] = useState(null)

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

  const today = new Date()
  const maxBirthDate = new Date(today)
  maxBirthDate.setFullYear(today.getFullYear() - 18)
  const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0]

  const calcAge = (dateStr) => {
    if (!dateStr) return null

    const birth = new Date(dateStr)

    let age = today.getFullYear() - birth.getFullYear()
    const month = today.getMonth() - birth.getMonth()

    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const age = calcAge(form.birthDate)
  const ageValid = age === null || age >= 18
  const passwordsMatch = form.confirm && form.password === form.confirm

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

    if (!form.birthDate) {
      setError('La fecha de nacimiento es obligatoria')
      return
    }

    if (!ageValid) {
      setError('Debes ser mayor de 18 años para registrarte')
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
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.birthDate
      )

      authService.guardarSesion(data.token)

      setNombreRegistrado(form.name.trim())
      setRegistrado(true)

      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleMetaMask = () => {
    setMensajeModal({
      titulo: 'MetaMask desde perfil',
      texto: 'Primero crea tu cuenta con email y contraseña. Después podrás conectar MetaMask desde Mi perfil.',
    })
  }

  const Brand = () => (
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
  )

  const Fondo = () => (
    <>
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="grid-overlay" />
    </>
  )

  if (registrado) {
    return (
      <div className="reg-root">
        <div className="reg-left">
          <div className="reg-left__inner">
            <Brand />
          </div>

          <Fondo />
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
              Bienvenido a AK-MARKET, <span>{nombreRegistrado}</span>
            </p>

            <p className="success-msg">
              Tu cuenta ha sido registrada correctamente. Ya puedes explorar el catálogo y comprar con criptomonedas.
            </p>

            <div className="success-bar">
              <div className="success-bar__fill" />
            </div>

            <p className="success-redirect">Redirigiendo a la tienda...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reg-root">
      {mensajeModal && (
        <div className="reg-modal-backdrop">
          <div className="reg-info-modal">
            <div className="reg-info-icon">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.8">
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
              onClick={() => setMensajeModal(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="reg-left">
        <div className="reg-left__inner">
          <Brand />

          <div className="reg-left__headline">
            <h1>
              Únete a la
              <br />
              <span className="accent">mejor armería</span>
            </h1>

            <p>
              Crea tu cuenta en menos de 2 minutos y accede al mayor catálogo de airsoft con pagos seguros en criptomonedas.
            </p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step__num">01</div>

              <div className="step__body">
                <span className="step__title">Crea tu cuenta</span>
                <span className="step__desc">Regístrate con email y contraseña</span>
              </div>
            </div>

            <div className="step__connector" />

            <div className="step">
              <div className="step__num">02</div>

              <div className="step__body">
                <span className="step__title">Explora el catálogo</span>
                <span className="step__desc">Réplicas, accesorios, equipamiento táctico y mucho más</span>
              </div>
            </div>

            <div className="step__connector" />

            <div className="step">
              <div className="step__num">03</div>

              <div className="step__body">
                <span className="step__title">Compra con cripto</span>
                <span className="step__desc">Conecta MetaMask desde tu perfil y paga con Sepolia ETH</span>
              </div>
            </div>
          </div>

          <div className="trust-row">
            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Pagos con cripto</span>
            </div>

            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Envío en 24h</span>
            </div>

            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Productos verificados</span>
            </div>
          </div>
        </div>

        <Fondo />
      </div>

      <div className="reg-right">
        <div className="reg-card">
          <div className="reg-card__header">
            <h2>Crear cuenta</h2>
            <p>Únete a más de 1.200 jugadores activos</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="reg-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>

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
                  autoComplete="name"
                  required
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
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Fecha de nacimiento</label>

              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>

                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  max={maxBirthDateStr}
                  value={form.birthDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {!ageValid && (
                <span className="field-error">Debes ser mayor de 18 años</span>
              )}
            </div>

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
                  autoComplete="new-password"
                  required
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

              {form.password && (
                <div className="strength-wrap">
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map(i => (
                      <span
                        key={i}
                        className="strength-segment"
                        style={{
                          background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)',
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
                  placeholder="Repite la contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                {form.confirm && (
                  <span className="match-icon">
                    {passwordsMatch ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7EAE28" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </span>
                )}

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Mostrar contraseña"
                >
                  {showConfirm ? (
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

              {form.confirm && !passwordsMatch && (
                <span className="field-error">Las contraseñas no coinciden</span>
              )}
            </div>

            <label className="terms-row">
              <span className={`checkbox${accepted ? ' checked' : ''}`}>
                {accepted && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>

              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                style={{ display: 'none' }}
              />

              <span>
                Acepto los <a href="#">términos</a> y la <a href="#">política de privacidad</a>
              </span>
            </label>

            <button
              type="submit"
              className={`btn-primary${loading ? ' loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                'Crear cuenta'
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
          >
            <span className="metamask-logo">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
              />
            </span>
            Conectar MetaMask después
          </button>

          <p className="login-link">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Inicia sesión</Link>
          </p>
        </div>

        <p className="reg-footer">
          © 2025 AK-MARKET · <a href="#">Privacidad</a> · <a href="#">Términos</a>
        </p>
      </div>
    </div>
  )
}