import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
<<<<<<< HEAD
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    password: '',
    confirm: '',
  })
=======

  const [form, setForm] = useState({
    name: '',
    email: '',
    wallet: '',
    password: '',
    confirm: '',
  })

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrado, setRegistrado] = useState(false)
  const [nombreRegistrado, setNombreRegistrado] = useState('')

  const handleChange = (e) => {
<<<<<<< HEAD
    setForm({ ...form, [e.target.name]: e.target.value })
=======
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
  }

  const passwordStrength = () => {
    const p = form.password
<<<<<<< HEAD
    if (!p) return 0
    let score = 0
=======

    if (!p) return 0

    let score = 0

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    return score
  }

  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#7EAE28']
  const strength = passwordStrength()

<<<<<<< HEAD
  const today = new Date()
  const maxBirthDate = new Date(today)
  maxBirthDate.setFullYear(today.getFullYear() - 18)
  const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0]

  const calcAge = (dateStr) => {
    if (!dateStr) return null
    const birth = new Date(dateStr)
    let a = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--
    return a
  }
  const age = calcAge(form.birthDate)
  const ageValid = age === null || age >= 18

  const passwordsMatch = form.confirm && form.password === form.confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!accepted) return
=======
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

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
<<<<<<< HEAD
    if (!form.birthDate) {
      setError('La fecha de nacimiento es obligatoria')
      return
    }
    if (!ageValid) {
      setError('Debes ser mayor de 18 años para registrarte')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authService.register(form.name, form.email, form.password, form.birthDate)
      authService.guardarSesion(data.token)
      setNombreRegistrado(form.name)
      setRegistrado(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError(err.message)
=======

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
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
  const handleMetaMask = () => {
    alert('Conexión con MetaMask próximamente')
  }

=======
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
  if (registrado) {
    return (
      <div className="reg-root">
        <div className="reg-left">
          <div className="reg-left__inner">
            <div className="brand">
              <div className="brand__icon">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
<<<<<<< HEAD
                  <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
=======
                  <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                </svg>
              </div>
              <span className="brand__name">AK-MARKET</span>
            </div>
          </div>
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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
<<<<<<< HEAD
            <h2 className="success-title">¡Cuenta creada!</h2>
            <p className="success-name">Bienvenido a AK-MARKET, <span>{nombreRegistrado}</span></p>
            <p className="success-msg">Tu cuenta ha sido registrada correctamente. Ya puedes explorar el catálogo y comprar con criptomonedas.</p>
            <div className="success-bar">
              <div className="success-bar__fill" />
            </div>
            <p className="success-redirect">Redirigiendo a la tienda...</p>
=======

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
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reg-root">
<<<<<<< HEAD
      {/* LEFT PANEL */}
      <div className="reg-left">
        <div className="reg-left__inner">
          {/* Logo */}
          <div className="brand">
            <div className="brand__icon">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand__name">AK-MARKET</span>
          </div>

          {/* Headline */}
          <div className="reg-left__headline">
            <h1>Únete a la<br /><span className="accent">mejor armería</span></h1>
            <p>Crea tu cuenta en menos de 2 minutos y accede al mayor catálogo de airsoft con pagos seguros en criptomonedas.</p>
          </div>

          {/* Steps */}
=======
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

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          <div className="steps">
            <div className="step">
              <div className="step__num">01</div>
              <div className="step__body">
<<<<<<< HEAD
                <span className="step__title">Crea tu cuenta</span>
                <span className="step__desc">Regístrate con email o conecta tu wallet de MetaMask</span>
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
                <span className="step__desc">Paga con MetaMask de forma segura y recibe en 24h</span>
=======
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
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {/* Trust badges */}
=======
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          <div className="trust-row">
            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
<<<<<<< HEAD
              <span>Pagos con cripto</span>
            </div>
            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Envío en 24h</span>
            </div>
=======
              <span>Firebase Auth</span>
            </div>

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
            <div className="trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
<<<<<<< HEAD
              <span>Productos verificados</span>
=======
              <span>Firestore</span>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
            </div>
          </div>
        </div>

        <div className="orb orb--1" />
        <div className="orb orb--2" />
        <div className="grid-overlay" />
      </div>

<<<<<<< HEAD
      {/* RIGHT PANEL */}
=======
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
      <div className="reg-right">
        <div className="reg-card">
          <div className="reg-card__header">
            <h2>Crear cuenta</h2>
<<<<<<< HEAD
            <p>Únete a más de 1,200 jugadores activos</p>
=======
            <p>Guarda el usuario directamente en Firebase</p>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          </div>

          {error && <p className="form-error">{error}</p>}

          <form className="reg-form" onSubmit={handleSubmit}>
<<<<<<< HEAD
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
=======
            <div className="form-group">
              <label htmlFor="name">Nombre</label>

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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

<<<<<<< HEAD
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
=======
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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

<<<<<<< HEAD
            {/* Birth Date */}
            <div className="form-group">
              <label htmlFor="birthDate">Fecha de nacimiento</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                  min="1920-01-01"
                  max={maxBirthDateStr}
                  required
                />
              </div>
              {form.birthDate && !ageValid && (
                <p className="field-error">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Debes ser mayor de 18 años para registrarte
                </p>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
=======
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

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
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
                </button>
              </div>

              {/* Strength bar */}
=======
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              {form.password && (
                <div className="strength-wrap">
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="strength-segment"
<<<<<<< HEAD
                        style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.07)' }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strengthColor[strength] }}>
=======
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
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

<<<<<<< HEAD
            {/* Confirm password */}
            <div className="form-group">
              <label htmlFor="confirm">Confirmar contraseña</label>
=======
            <div className="form-group">
              <label htmlFor="confirm">Confirmar contraseña</label>

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              <div className="input-wrapper">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
<<<<<<< HEAD
                  style={form.confirm ? { borderColor: passwordsMatch ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.45)' } : {}}
                />
=======
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

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Mostrar confirmación"
                >
<<<<<<< HEAD
                  {showConfirm ? (
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
                </button>
                {form.confirm && (
                  <div className="match-icon">
                    {passwordsMatch ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="terms-row">
              <div className={`checkbox${accepted ? ' checked' : ''}`} onClick={() => setAccepted(!accepted)}>
=======
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <label className="terms-row">
              <div
                className={`checkbox${accepted ? ' checked' : ''}`}
                onClick={() => setAccepted(!accepted)}
              >
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
                {accepted && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
<<<<<<< HEAD
              <span>
                Acepto los <a href="#">Términos de servicio</a> y la <a href="#">Política de privacidad</a>
=======

              <span>
                Acepto los <a href="#">Términos de servicio</a> y la{' '}
                <a href="#">Política de privacidad</a>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
              </span>
            </label>

            <button
              type="submit"
              className={`btn-primary${loading ? ' loading' : ''}`}
<<<<<<< HEAD
              disabled={loading || !accepted || !form.birthDate || !ageValid}
=======
              disabled={loading || !accepted}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
            >
              {loading ? <span className="spinner" /> : 'Crear mi cuenta'}
            </button>
          </form>

<<<<<<< HEAD
          <div className="divider">
            <span>o regístrate con</span>
          </div>

          <button className="btn-metamask" onClick={handleMetaMask}>
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
            Registrarse con MetaMask
          </button>

          <p className="login-link">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Inicia sesión</Link>
=======
          <p className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
          </p>
        </div>

        <p className="reg-footer">
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
<<<<<<< HEAD
}
=======
}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
