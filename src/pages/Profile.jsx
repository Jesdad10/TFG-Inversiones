import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import Navbar from '../components/Navbar'
import './Profile.css'

const PAISES = [
  'España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú',
  'Venezuela', 'Ecuador', 'Estados Unidos', 'Francia', 'Italia',
  'Alemania', 'Reino Unido', 'Portugal', 'Brasil', 'Japón', 'Australia', 'Otros',
]

const PREFIJOS = [
  { code: '+34',  pais: 'España'         },
  { code: '+1',   pais: 'EE.UU./Canadá' },
  { code: '+44',  pais: 'Reino Unido'   },
  { code: '+33',  pais: 'Francia'       },
  { code: '+49',  pais: 'Alemania'      },
  { code: '+39',  pais: 'Italia'        },
  { code: '+351', pais: 'Portugal'      },
  { code: '+31',  pais: 'Países Bajos'  },
  { code: '+32',  pais: 'Bélgica'       },
  { code: '+41',  pais: 'Suiza'         },
  { code: '+46',  pais: 'Suecia'        },
  { code: '+47',  pais: 'Noruega'       },
  { code: '+45',  pais: 'Dinamarca'     },
  { code: '+358', pais: 'Finlandia'     },
  { code: '+52',  pais: 'México'        },
  { code: '+54',  pais: 'Argentina'     },
  { code: '+57',  pais: 'Colombia'      },
  { code: '+56',  pais: 'Chile'         },
  { code: '+51',  pais: 'Perú'          },
  { code: '+58',  pais: 'Venezuela'     },
  { code: '+593', pais: 'Ecuador'       },
  { code: '+55',  pais: 'Brasil'        },
  { code: '+61',  pais: 'Australia'     },
  { code: '+81',  pais: 'Japón'         },
]

const GENEROS = [
  'Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo',
]

const toDateInput = (val) => {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return String(val)

  const d = new Date(val)
  if (isNaN(d)) return ''

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

const FORM_INICIAL = {
  nombre: '',
  prefijo: '+34',
  telefono: '',
  genero: '',
  fecha_nacimiento: '',
  pais: '',
  ciudad: '',
  direccion: '',
  bio: '',
  avatar: '',
  wallet: '',
}

export default function Profile() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [user, setUser] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [status, setStatus] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [memberSince, setMemberSince] = useState('')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingNavPath, setPendingNavPath] = useState(null)

  const guardedNavigate = (path) => {
    if (hasUnsavedChanges) {
      setPendingNavPath(path)
    } else {
      navigate(path)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      )

      setUser({
        nombre: payload.nombre,
        email: payload.email,
        avatar: '',
      })

      setForm(f => ({
        ...f,
        nombre: payload.nombre || '',
      }))

      if (payload.iat) {
        const d = new Date(payload.iat * 1000)

        setMemberSince(
          d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        )
      }
    } catch (_) {}

    authService.me()
      .then(data => {
        if (data?.usuario) {
          const u = data.usuario

          let prefijoCargado = u.prefijo || '+34'
          let telefonoCargado = u.telefono || ''

          if (!u.prefijo && telefonoCargado.startsWith('+')) {
            const m = telefonoCargado.match(/^(\+\d{1,4})\s*(\d*)$/)

            if (m) {
              prefijoCargado = m[1]
              telefonoCargado = m[2]
            }
          }

          setUser(u)

          setForm({
            nombre: u.nombre || '',
            prefijo: prefijoCargado,
            telefono: telefonoCargado.replace(/\D/g, ''),
            genero: u.genero || '',
            fecha_nacimiento: toDateInput(u.fecha_nacimiento),
            pais: u.pais || '',
            ciudad: u.ciudad || '',
            direccion: u.direccion || '',
            bio: u.bio || '',
            avatar: u.avatar || '',
            wallet: u.wallet || '',
          })

          if (u.avatar) setAvatarPreview(u.avatar)

          if (u.created_at) {
            const d = new Date(u.created_at)

            setMemberSince(
              d.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            )
          }
        }
      })
      .catch(() => {})
  }, [navigate])

  const handleField = (e) => {
    const { name, value } = e.target

    setForm(f => ({
      ...f,
      [name]: value,
    }))

    setHasUnsavedChanges(true)
  }

  const handleTelefono = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 15)

    setForm(f => ({
      ...f,
      telefono: value,
    }))

    setHasUnsavedChanges(true)
  }

  const handleAvatarClick = () => {
    fileRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const MAX = 200
      let { width, height } = img

      if (width > height) {
        if (width > MAX) {
          height = Math.round(height * MAX / width)
          width = MAX
        }
      } else {
        if (height > MAX) {
          width = Math.round(width * MAX / height)
          height = MAX
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      URL.revokeObjectURL(url)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

      setAvatarPreview(dataUrl)
      setAvatarRemoved(false)
      setHasUnsavedChanges(true)

      setForm(f => ({
        ...f,
        avatar: dataUrl,
      }))
    }

    img.src = url
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setShowRemoveConfirm(false)
    setAvatarPreview('')
    setAvatarRemoved(true)
    setHasUnsavedChanges(true)

    setForm(f => ({
      ...f,
      avatar: '',
    }))
  }

  const conectarMetaMask = async () => {
    setStatus(null)
    setStatusMsg('')
    setLoadingWallet(true)

    try {
      if (!window.ethereum) {
        setStatus('err')
        setStatusMsg('No tienes MetaMask instalado en este navegador.')
        return
      }

      const cuentas = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!cuentas || cuentas.length === 0) {
        setStatus('err')
        setStatusMsg('No se pudo obtener ninguna cuenta de MetaMask.')
        return
      }

      const wallet = cuentas[0].toLowerCase()

      const data = await authService.updateMe({
        wallet,
      })

      if (data?.usuario) {
        setUser(data.usuario)

        setForm(prev => ({
          ...prev,
          wallet,
        }))
      }

      setHasUnsavedChanges(false)
      setStatus('ok')
      setStatusMsg('Wallet de MetaMask conectada correctamente.')
      setTimeout(() => setStatus(null), 3500)
    } catch (err) {
      if (err.code === 4001) {
        setStatus('err')
        setStatusMsg('Has cancelado la conexión con MetaMask.')
      } else {
        setStatus('err')
        setStatusMsg(err.message || 'Error al conectar MetaMask.')
      }
    } finally {
      setLoadingWallet(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    setStatusMsg('')

    try {
      const payload = {
        ...form,
        telefono: form.telefono ? `${form.prefijo} ${form.telefono}` : '',
      }

      const data = await authService.updateMe(payload)

      if (data?.usuario) {
        setUser(data.usuario)
      } else {
        setUser(u => ({
          ...u,
          nombre: form.nombre,
          avatar: form.avatar || u?.avatar || '',
          wallet: form.wallet || u?.wallet || '',
        }))
      }

      setHasUnsavedChanges(false)
      setAvatarRemoved(false)
      setStatus('ok')
      setStatusMsg('¡Perfil actualizado correctamente!')
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setStatus('err')
      setStatusMsg(err.message || 'Error al guardar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const displayAvatar = avatarRemoved ? '' : (avatarPreview || user?.avatar || '')

  return (
    <div className="profile-root">
      <Navbar
        user={user ? { ...user, avatar: displayAvatar } : null}
        activePage="perfil"
        onNavigate={guardedNavigate}
      />

      {pendingNavPath && (
        <div className="modal-backdrop">
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h3>¿Deseas guardar los cambios?</h3>
            <p>Tienes cambios sin guardar que se perderán si sales ahora.</p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-confirm-no"
                onClick={() => {
                  setPendingNavPath(null)
                  navigate(pendingNavPath)
                }}
              >
                No, salir
              </button>

              <button
                type="button"
                className="btn-confirm-yes"
                onClick={async () => {
                  try {
                    const payload = {
                      ...form,
                      telefono: form.telefono ? `${form.prefijo} ${form.telefono}` : '',
                    }

                    await authService.updateMe(payload)
                  } catch (_) {}

                  navigate(pendingNavPath)
                }}
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveConfirm && (
        <div className="modal-backdrop" onClick={() => setShowRemoveConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            <h3>¿Eliminar foto de perfil?</h3>
            <p>Los cambios se guardarán al pulsar <strong>Guardar cambios</strong>.</p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-confirm-no"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-confirm-yes"
                onClick={handleRemoveAvatar}
              >
                Sí, quitar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="profile-main">
        <div className="profile-container">

          <div className="profile-header">
            <div className="profile-avatar-col">
              <div className="profile-avatar-wrap" onClick={handleAvatarClick} title="Cambiar foto">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={user?.nombre} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-circle">{initials}</div>
                )}

                <div className="profile-avatar-overlay">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {displayAvatar && (
                <button
                  type="button"
                  className="btn-remove-avatar"
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  Quitar foto
                </button>
              )}
            </div>

            <div className="profile-header-info">
              <h1>{user?.nombre || 'Usuario'}</h1>
              <p className="profile-header-email">{user?.email || ''}</p>

              {memberSince && (
                <p className="profile-header-meta">Miembro desde {memberSince}</p>
              )}

              {form.wallet && (
                <p className="profile-wallet-small">
                  Wallet conectada: {form.wallet.slice(0, 6)}...{form.wallet.slice(-4)}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="profile-section">
              <h2 className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Información personal
              </h2>

              <div className="profile-grid">
                <div className="profile-field">
                  <label htmlFor="nombre">Nombre completo *</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="profile-input"
                    placeholder="Tu nombre completo"
                    value={form.nombre}
                    onChange={handleField}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="telefono">Teléfono</label>

                  <div className="phone-input-group">
                    <select
                      name="prefijo"
                      className="phone-prefix-select profile-select"
                      value={form.prefijo}
                      onChange={handleField}
                      aria-label="Prefijo país"
                    >
                      {PREFIJOS.map(p => (
                        <option key={p.code} value={p.code}>
                          {p.code} {p.pais}
                        </option>
                      ))}
                    </select>

                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      inputMode="numeric"
                      className="profile-input phone-number-input"
                      placeholder="600 000 000"
                      value={form.telefono}
                      onChange={handleTelefono}
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="profile-field">
                  <label htmlFor="genero">Género</label>

                  <select
                    id="genero"
                    name="genero"
                    className="profile-select"
                    value={form.genero}
                    onChange={handleField}
                  >
                    <option value="">Selecciona...</option>

                    {GENEROS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="profile-field">
                  <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>

                  <input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    className="profile-input"
                    value={form.fecha_nacimiento}
                    onChange={handleField}
                  />
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ marginTop: '16px' }}>
              <h2 className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Wallet MetaMask
              </h2>

              <div className="profile-field">
                <label htmlFor="wallet">Wallet conectada</label>

                <div className="profile-wallet-row">
                  <input
                    id="wallet"
                    name="wallet"
                    type="text"
                    className="profile-input"
                    value={form.wallet || ''}
                    placeholder="0x..."
                    readOnly
                  />

                  <button
                    type="button"
                    className="profile-wallet-btn"
                    onClick={conectarMetaMask}
                    disabled={loadingWallet}
                  >
                    {loadingWallet ? (
                      <>
                        <span className="profile-spinner" />
                        Conectando...
                      </>
                    ) : form.wallet ? (
                      'Cambiar MetaMask'
                    ) : (
                      'Conectar MetaMask'
                    )}
                  </button>
                </div>

                <p className="profile-wallet-help">
                  Pulsa el botón, acepta en MetaMask y la wallet se guardará automáticamente en tu cuenta.
                </p>
              </div>
            </div>

            <div className="profile-section" style={{ marginTop: '16px' }}>
              <h2 className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Ubicación
              </h2>

              <div className="profile-grid">
                <div className="profile-field">
                  <label htmlFor="pais">País</label>

                  <select
                    id="pais"
                    name="pais"
                    className="profile-select"
                    value={form.pais}
                    onChange={handleField}
                  >
                    <option value="">Selecciona tu país...</option>

                    {PAISES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="profile-field">
                  <label htmlFor="ciudad">Ciudad</label>

                  <input
                    id="ciudad"
                    name="ciudad"
                    type="text"
                    className="profile-input"
                    placeholder="Tu ciudad"
                    value={form.ciudad}
                    onChange={handleField}
                  />
                </div>

                <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="direccion">Dirección</label>

                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    className="profile-input"
                    placeholder="Calle, número, piso..."
                    value={form.direccion}
                    onChange={handleField}
                  />
                </div>
              </div>
            </div>

            <div className="profile-section" style={{ marginTop: '16px' }}>
              <h2 className="profile-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Sobre ti
              </h2>

              <div className="profile-field">
                <label htmlFor="bio">Biografía</label>

                <textarea
                  id="bio"
                  name="bio"
                  className="profile-textarea"
                  placeholder="Cuéntanos algo sobre ti, tu experiencia en airsoft, tu equipo favorito..."
                  maxLength={300}
                  value={form.bio}
                  onChange={handleField}
                />

                <span className="bio-counter">{form.bio.length} / 300</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? (
                  <span className="profile-spinner" />
                ) : null}

                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {status === 'ok' && (
                <span className="save-status--ok">{statusMsg}</span>
              )}

              {status === 'err' && (
                <span className="save-status--err">{statusMsg}</span>
              )}
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}