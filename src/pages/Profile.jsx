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
  telefono: '',
  genero: '',
  fecha_nacimiento: '',
  pais: '',
  ciudad: '',
  direccion: '',
  bio: '',
  avatar: '',
}

export default function Profile() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [user, setUser]               = useState(null)
  const [form, setForm]               = useState(FORM_INICIAL)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading]               = useState(false)
  const [status, setStatus]                 = useState(null) // 'ok' | 'err'
  const [statusMsg, setStatusMsg]           = useState('')
  const [memberSince, setMemberSince]       = useState('')
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Decode JWT payload immediately for name/email
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      )
      setUser({ nombre: payload.nombre, email: payload.email, avatar: '' })
      setForm(f => ({ ...f, nombre: payload.nombre || '' }))

      // Member since from token iat if available
      if (payload.iat) {
        const d = new Date(payload.iat * 1000)
        setMemberSince(
          d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        )
      }
    } catch (_) {}

    // Fetch full profile from server
    authService.me()
      .then(data => {
        if (data?.usuario) {
          const u = data.usuario
          setUser(u)
          setForm({
            nombre:          u.nombre          || '',
            telefono:        u.telefono         || '',
            genero:          u.genero           || '',
            fecha_nacimiento: toDateInput(u.fecha_nacimiento),
            pais:            u.pais             || '',
            ciudad:          u.ciudad           || '',
            direccion:       u.direccion        || '',
            bio:             u.bio              || '',
            avatar:          u.avatar           || '',
          })
          if (u.avatar) setAvatarPreview(u.avatar)
          if (u.created_at) {
            const d = new Date(u.created_at)
            setMemberSince(
              d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
            )
          }
        }
      })
      .catch(() => {})
  }, [navigate])

  const handleField = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
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
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX }
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setAvatarPreview(dataUrl)
      setForm(f => ({ ...f, avatar: dataUrl }))
    }
    img.src = url
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    setShowRemoveConfirm(false)
    setAvatarPreview('')
    setForm(f => ({ ...f, avatar: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    setStatusMsg('')

    try {
      await authService.updateMe(form)
      // Update local user state with new data
      setUser(u => ({ ...u, nombre: form.nombre, avatar: form.avatar || u?.avatar || '' }))
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

  const displayAvatar = avatarPreview || user?.avatar || ''

  return (
    <div className="profile-root">
      <Navbar user={user ? { ...user, avatar: displayAvatar } : null} activePage="perfil" />

      <main className="profile-main">
        <div className="profile-container">

          {/* Header card */}
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
                showRemoveConfirm ? (
                  <div className="avatar-remove-confirm">
                    <p>¿Eliminar foto de perfil?</p>
                    <div className="avatar-remove-btns">
                      <button type="button" className="btn-confirm-yes" onClick={handleRemoveAvatar}>Sí, quitar</button>
                      <button type="button" className="btn-confirm-no" onClick={() => setShowRemoveConfirm(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="btn-remove-avatar" onClick={() => setShowRemoveConfirm(true)}>
                    Quitar foto
                  </button>
                )
              )}
            </div>

            <div className="profile-header-info">
              <h1>{user?.nombre || 'Usuario'}</h1>
              <p className="profile-header-email">{user?.email || ''}</p>
              {memberSince && (
                <p className="profile-header-meta">Miembro desde {memberSince}</p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Sección 1: Información personal */}
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
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    className="profile-input"
                    placeholder="+34 600 000 000"
                    value={form.telefono}
                    onChange={handleField}
                  />
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

            {/* Sección 2: Ubicación */}
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

            {/* Sección 3: Sobre ti */}
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

            {/* Actions */}
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
