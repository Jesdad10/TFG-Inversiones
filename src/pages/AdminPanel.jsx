import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import Navbar from '../components/Navbar'
import './AdminPanel.css'

const SECCIONES = ['resumen', 'usuarios', 'productos', 'historial', 'crear-usuario']

const ACCION_LABELS = {
  eliminar_usuario:    'Usuario eliminado',
  bloquear_usuario:    'Usuario bloqueado',
  desbloquear_usuario: 'Usuario desbloqueado',
  eliminar_producto:   'Producto eliminado',
  crear_usuario:       'Usuario creado',
  cambiar_rol:         'Rol cambiado',
}

export default function AdminPanel() {
  const navigate  = useNavigate()
  const [user, setUser]         = useState(null)
  const [seccion, setSeccion]   = useState('resumen')

  // Stats
  const [stats, setStats]       = useState(null)

  // Usuarios
  const [usuarios, setUsuarios] = useState([])
  const [busqUser, setBusqUser] = useState('')

  // Productos
  const [articulos, setArticulos] = useState([])
  const [busqArt, setBusqArt]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Historial
  const [historial, setHistorial] = useState([])

  // Modal bloquear
  const [modalBloquear, setModalBloquear] = useState(null)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')

  // Modal eliminar producto
  const [modalElimProd, setModalElimProd] = useState(null)
  const [motivoElimProd, setMotivoElimProd] = useState('')

  // Modal eliminar usuario
  const [modalElimUser, setModalElimUser] = useState(null)

  // Modal cambiar rol (pide contraseña)
  const [modalCambiarRol, setModalCambiarRol] = useState(null) // { id, nombre, rolActual }
  const [passwordRol, setPasswordRol]         = useState('')
  const [passwordRolError, setPasswordRolError] = useState('')

  // Mostrar usuarios eliminados
  const [mostrarEliminados, setMostrarEliminados] = useState(false)

  // Crear usuario
  const [crearForm, setCrearForm] = useState({ nombre: '', email: '', password: '', rol: 'user' })
  const [crearStatus, setCrearStatus] = useState(null)
  const [crearMsg, setCrearMsg]       = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.rol !== 'admin') { navigate('/dashboard'); return }
      setUser({ nombre: payload.nombre, email: payload.email, rol: payload.rol })
    } catch (_) { navigate('/login'); return }

    authService.me()
      .then(d => { if (d?.usuario) setUser(d.usuario) })
      .catch(() => {})
  }, [navigate])

  useEffect(() => {
    if (!user) return
    cargarSeccion(seccion)
  }, [seccion, user])

  const cargarSeccion = async (s) => {
    setLoading(true)
    try {
      if (s === 'resumen') {
        const d = await authService.adminGetStats()
        setStats(d)
      } else if (s === 'usuarios') {
        const d = await authService.adminGetUsuarios()
        setUsuarios(d.usuarios || [])
      } else if (s === 'productos') {
        const d = await authService.adminGetArticulos()
        setArticulos(d.articulos || [])
      } else if (s === 'historial') {
        const d = await authService.adminGetHistorial()
        setHistorial(d.historial || [])
      }
    } catch (_) {}
    setLoading(false)
  }

  // ── Acciones usuarios ──────────────────────────────────────────────────

  const handleBloquear = async () => {
    await authService.adminBloquearUsuario(modalBloquear.id, motivoBloqueo).catch(() => {})
    setUsuarios(prev => prev.map(u =>
      u.id === modalBloquear.id ? { ...u, bloqueado: 1, motivo_bloqueo: motivoBloqueo } : u
    ))
    setModalBloquear(null)
    setMotivoBloqueo('')
  }

  const handleDesbloquear = async (id) => {
    await authService.adminDesbloquearUsuario(id).catch(() => {})
    setUsuarios(prev => prev.map(u =>
      u.id === id ? { ...u, bloqueado: 0, motivo_bloqueo: null } : u
    ))
  }

  const handleCambiarRol = (u) => {
    setModalCambiarRol(u)
    setPasswordRol('')
    setPasswordRolError('')
  }

  const handleCambiarRolConfirm = async () => {
    if (!passwordRol) { setPasswordRolError('Introduce tu contraseña'); return }
    setPasswordRolError('')
    const nuevoRol = modalCambiarRol.rol === 'admin' ? 'user' : 'admin'
    try {
      await authService.adminCambiarRol(modalCambiarRol.id, nuevoRol, passwordRol)
      setUsuarios(prev => prev.map(u =>
        u.id === modalCambiarRol.id ? { ...u, rol: nuevoRol } : u
      ))
      setModalCambiarRol(null)
      setPasswordRol('')
    } catch (err) {
      setPasswordRolError(err.message || 'Contraseña incorrecta')
    }
  }

  const handleEliminarUsuario = async () => {
    await authService.adminEliminarUsuario(modalElimUser.id).catch(() => {})
    setUsuarios(prev => prev.map(u =>
      u.id === modalElimUser.id ? { ...u, activo: 0 } : u
    ))
    setModalElimUser(null)
  }

  // ── Acciones productos ─────────────────────────────────────────────────

  const handleEliminarProducto = async () => {
    await authService.adminEliminarArticulo(modalElimProd.id, motivoElimProd).catch(() => {})
    setArticulos(prev => prev.map(a =>
      a.id === modalElimProd.id
        ? { ...a, estado: 'eliminado', eliminado_por_admin: 1, motivo_eliminacion: motivoElimProd }
        : a
    ))
    setModalElimProd(null)
    setMotivoElimProd('')
  }

  // ── Crear usuario ──────────────────────────────────────────────────────

  const handleCrearUsuario = async (e) => {
    e.preventDefault()
    setCrearStatus(null)
    try {
      await authService.adminCrearUsuario(crearForm)
      setCrearStatus('ok')
      setCrearMsg('Usuario creado correctamente')
      setCrearForm({ nombre: '', email: '', password: '', rol: 'user' })
      setTimeout(() => setCrearStatus(null), 3000)
    } catch (err) {
      setCrearStatus('err')
      setCrearMsg(err.message)
    }
  }

  // ── Filtros ─────────────────────────────────────────────────────────────

  const usuariosActivos = usuarios.filter(u =>
    u.activo !== 0 &&
    (u.nombre.toLowerCase().includes(busqUser.toLowerCase()) ||
     u.email.toLowerCase().includes(busqUser.toLowerCase()))
  )

  const usuariosEliminados = usuarios.filter(u =>
    u.activo === 0 &&
    (u.nombre.toLowerCase().includes(busqUser.toLowerCase()) ||
     u.email.toLowerCase().includes(busqUser.toLowerCase()))
  )

  const articulosFiltrados = articulos.filter(a => {
    const coincide = a.titulo.toLowerCase().includes(busqArt.toLowerCase()) ||
                     a.usuario_nombre.toLowerCase().includes(busqArt.toLowerCase())
    if (filtroEstado === 'todos') return coincide
    return coincide && a.estado === filtroEstado
  })

  // ── Gráfico de altas ───────────────────────────────────────────────────

  const renderGrafico = () => {
    if (!stats?.registros_por_mes?.length) {
      return <p className="ap-empty">Sin datos de registros</p>
    }
    const datos = stats.registros_por_mes
    const max   = Math.max(...datos.map(d => d.total), 1)
    return (
      <div className="ap-chart">
        <div className="ap-chart-bars">
          {datos.map(d => (
            <div key={d.mes} className="ap-chart-col">
              <span className="ap-chart-val">{d.total}</span>
              <div
                className="ap-chart-bar"
                style={{ height: `${Math.round((d.total / max) * 120)}px` }}
              />
              <span className="ap-chart-label">{d.mes.slice(5)}/{d.mes.slice(2, 4)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="ap-root">
      <Navbar user={user} activePage="admin" onNavigate={p => navigate(p)} />

      <main className="ap-main">
        <div className="ap-container">

          {/* Header */}
          <div className="ap-header">
            <div className="ap-header-left">
              <div className="ap-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h1 className="ap-title">Panel Administrativo</h1>
                <p className="ap-subtitle">Gestión completa de AK-MARKET</p>
              </div>
            </div>
            {/* Botón chat soporte (no funcional aún) */}
            <button className="ap-chat-btn" title="Chat con clientes (próximamente)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat soporte
              <span className="ap-chat-badge">Próximamente</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="ap-tabs">
            {[
              { id: 'resumen',       label: 'Resumen' },
              { id: 'usuarios',      label: 'Usuarios' },
              { id: 'productos',     label: 'Productos' },
              { id: 'historial',     label: 'Historial' },
              { id: 'crear-usuario', label: 'Crear usuario' },
            ].map(t => (
              <button
                key={t.id}
                className={`ap-tab${seccion === t.id ? ' ap-tab--active' : ''}`}
                onClick={() => setSeccion(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── RESUMEN ────────────────────────────────────────────────── */}
          {seccion === 'resumen' && (
            <div className="ap-section">
              {loading ? <div className="ap-spinner" /> : (
                <>
                  <div className="ap-stats-grid">
                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.total_usuarios ?? '—'}</span>
                      <span className="ap-stat-lbl">Usuarios totales</span>
                    </div>
                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.bloqueados ?? '—'}</span>
                      <span className="ap-stat-lbl">Bloqueados</span>
                    </div>
                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.admins ?? '—'}</span>
                      <span className="ap-stat-lbl">Administradores</span>
                    </div>
                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.productos_activos ?? '—'}</span>
                      <span className="ap-stat-lbl">Productos activos</span>
                    </div>
                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.total_productos ?? '—'}</span>
                      <span className="ap-stat-lbl">Productos totales</span>
                    </div>
                  </div>

                  <div className="ap-chart-card">
                    <h3 className="ap-chart-title">Altas de usuarios por mes</h3>
                    {renderGrafico()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── USUARIOS ───────────────────────────────────────────────── */}
          {seccion === 'usuarios' && (
            <div className="ap-section">
              <div className="ap-toolbar">
                <input
                  className="ap-search"
                  placeholder="Buscar por nombre o email..."
                  value={busqUser}
                  onChange={e => setBusqUser(e.target.value)}
                />
                <span className="ap-count">{usuariosActivos.length} usuarios activos</span>
              </div>

              {loading ? <div className="ap-spinner" /> : (
                <>
                  <div className="ap-table-wrap">
                    <table className="ap-table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Rol</th>
                          <th>Estado</th>
                          <th>Registro</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosActivos.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div className="ap-user-cell">
                                <div className="ap-user-avatar">
                                  {u.avatar
                                    ? <img src={u.avatar} alt={u.nombre} />
                                    : u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                                  }
                                </div>
                                <div>
                                  <p className="ap-user-name">{u.nombre}</p>
                                  <p className="ap-user-email">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`ap-badge ap-badge--${u.rol}`}>{u.rol}</span>
                            </td>
                            <td>
                              {u.bloqueado
                                ? <span className="ap-badge ap-badge--bloqueado">Bloqueado</span>
                                : <span className="ap-badge ap-badge--activo">Activo</span>
                              }
                            </td>
                            <td className="ap-date">
                              {new Date(u.created_at).toLocaleDateString('es-ES')}
                            </td>
                            <td>
                              <div className="ap-actions">
                                {u.bloqueado ? (
                                  <button className="ap-btn ap-btn--green" onClick={() => handleDesbloquear(u.id)}>
                                    Desbloquear
                                  </button>
                                ) : (
                                  <button className="ap-btn ap-btn--warn" onClick={() => { setModalBloquear(u); setMotivoBloqueo('') }}>
                                    Bloquear
                                  </button>
                                )}
                                <button
                                  className="ap-btn ap-btn--outline"
                                  onClick={() => handleCambiarRol(u)}
                                  title={`Cambiar a ${u.rol === 'admin' ? 'user' : 'admin'}`}
                                >
                                  {u.rol === 'admin' ? '→ User' : '→ Admin'}
                                </button>
                                <button className="ap-btn ap-btn--danger" onClick={() => setModalElimUser(u)}>
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {usuariosActivos.length === 0 && (
                      <p className="ap-empty">No se encontraron usuarios activos</p>
                    )}
                  </div>

                  {/* Sección usuarios eliminados */}
                  {usuariosEliminados.length > 0 && (
                    <div className="ap-deleted-section">
                      <button
                        className="ap-deleted-toggle"
                        onClick={() => setMostrarEliminados(v => !v)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points={mostrarEliminados ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                        </svg>
                        {mostrarEliminados ? 'Ocultar' : 'Ver'} usuarios eliminados ({usuariosEliminados.length})
                      </button>

                      {mostrarEliminados && (
                        <div className="ap-table-wrap ap-table-wrap--deleted">
                          <table className="ap-table">
                            <thead>
                              <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Registro</th>
                              </tr>
                            </thead>
                            <tbody>
                              {usuariosEliminados.map(u => (
                                <tr key={u.id} className="ap-row--deleted">
                                  <td>
                                    <div className="ap-user-cell">
                                      <div className="ap-user-avatar ap-user-avatar--deleted">
                                        {u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="ap-user-name">{u.nombre}</p>
                                        <p className="ap-user-email">{u.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td><span className={`ap-badge ap-badge--${u.rol}`}>{u.rol}</span></td>
                                  <td className="ap-date">{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PRODUCTOS ──────────────────────────────────────────────── */}
          {seccion === 'productos' && (
            <div className="ap-section">
              <div className="ap-toolbar">
                <input
                  className="ap-search"
                  placeholder="Buscar por título o vendedor..."
                  value={busqArt}
                  onChange={e => setBusqArt(e.target.value)}
                />
                <select
                  className="ap-filter-select"
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activos</option>
                  <option value="vendido">Vendidos</option>
                  <option value="eliminado">Eliminados</option>
                </select>
                <span className="ap-count">{articulosFiltrados.length} productos</span>
              </div>

              {loading ? <div className="ap-spinner" /> : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Vendedor</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articulosFiltrados.map(a => (
                        <tr key={a.id}>
                          <td>
                            <div className="ap-prod-cell">
                              {a.foto && <img src={a.foto} alt={a.titulo} className="ap-prod-img" />}
                              <div>
                                <p className="ap-prod-title">{a.titulo}</p>
                                <p className="ap-prod-cat">{a.categoria}</p>
                                {a.eliminado_por_admin && a.motivo_eliminacion && (
                                  <p className="ap-prod-motivo">Motivo: {a.motivo_eliminacion}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="ap-user-name">{a.usuario_nombre}</p>
                            <p className="ap-user-email">{a.usuario_email}</p>
                          </td>
                          <td className="ap-price">
                            {a.precio_crypto} {a.crypto}
                            {a.precio_eur && <span> · {a.precio_eur}€</span>}
                          </td>
                          <td>
                            <span className={`ap-badge ap-badge--${a.estado}`}>{a.estado}</span>
                            {a.eliminado_por_admin && (
                              <span className="ap-badge ap-badge--admin-del">Admin</span>
                            )}
                          </td>
                          <td className="ap-date">
                            {new Date(a.created_at).toLocaleDateString('es-ES')}
                          </td>
                          <td>
                            {a.estado !== 'eliminado' && (
                              <button
                                className="ap-btn ap-btn--danger"
                                onClick={() => { setModalElimProd(a); setMotivoElimProd('') }}
                              >
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {articulosFiltrados.length === 0 && (
                    <p className="ap-empty">No se encontraron productos</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORIAL ──────────────────────────────────────────────── */}
          {seccion === 'historial' && (
            <div className="ap-section">
              {loading ? <div className="ap-spinner" /> : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Acción</th>
                        <th>Admin</th>
                        <th>Entidad</th>
                        <th>Detalle</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map(h => (
                        <tr key={h.id}>
                          <td>
                            <span className={`ap-badge ap-badge--accion ap-badge--${h.accion.split('_')[0]}`}>
                              {ACCION_LABELS[h.accion] || h.accion}
                            </span>
                          </td>
                          <td className="ap-user-name">{h.admin_nombre}</td>
                          <td className="ap-date">{h.entidad_tipo} #{h.entidad_id}</td>
                          <td className="ap-hist-detalle">{h.detalle || '—'}</td>
                          <td className="ap-date">
                            {new Date(h.created_at).toLocaleString('es-ES', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {historial.length === 0 && (
                    <p className="ap-empty">No hay acciones registradas aún</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CREAR USUARIO ───────────────────────────────────────────── */}
          {seccion === 'crear-usuario' && (
            <div className="ap-section">
              <div className="ap-form-card">
                <h2 className="ap-form-title">Crear nuevo usuario</h2>
                <form className="ap-form" onSubmit={handleCrearUsuario}>
                  <div className="ap-form-row">
                    <div className="ap-form-field">
                      <label>Nombre completo *</label>
                      <input
                        type="text"
                        placeholder="Nombre del usuario"
                        value={crearForm.nombre}
                        onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="ap-form-field">
                      <label>Email *</label>
                      <input
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={crearForm.email}
                        onChange={e => setCrearForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="ap-form-row">
                    <div className="ap-form-field">
                      <label>Contraseña *</label>
                      <input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={crearForm.password}
                        onChange={e => setCrearForm(f => ({ ...f, password: e.target.value }))}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="ap-form-field">
                      <label>Rol *</label>
                      <select
                        value={crearForm.rol}
                        onChange={e => setCrearForm(f => ({ ...f, rol: e.target.value }))}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <div className="ap-form-actions">
                    <button type="submit" className="ap-btn ap-btn--primary">
                      Crear usuario
                    </button>
                    {crearStatus === 'ok' && <span className="ap-status-ok">{crearMsg}</span>}
                    {crearStatus === 'err' && <span className="ap-status-err">{crearMsg}</span>}
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODAL BLOQUEAR USUARIO ───────────────────────────────────────── */}
      {modalBloquear && (
        <div className="ap-modal-backdrop" onClick={() => setModalBloquear(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>Bloquear a {modalBloquear.nombre}</h3>
            <p>El usuario no podrá iniciar sesión. Recibirá una notificación.</p>
            <div className="ap-form-field" style={{ marginTop: '16px' }}>
              <label>Motivo del bloqueo (opcional)</label>
              <textarea
                rows={3}
                placeholder="Escribe el motivo..."
                value={motivoBloqueo}
                onChange={e => setMotivoBloqueo(e.target.value)}
              />
            </div>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn--outline" onClick={() => setModalBloquear(null)}>Cancelar</button>
              <button className="ap-btn ap-btn--warn" onClick={handleBloquear}>Bloquear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR USUARIO ───────────────────────────────────────── */}
      {modalElimUser && (
        <div className="ap-modal-backdrop" onClick={() => setModalElimUser(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>Eliminar usuario</h3>
            <p>¿Estás seguro de que quieres eliminar a <strong>{modalElimUser.nombre}</strong>? Esta acción desactivará su cuenta.</p>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn--outline" onClick={() => setModalElimUser(null)}>Cancelar</button>
              <button className="ap-btn ap-btn--danger" onClick={handleEliminarUsuario}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CAMBIAR ROL (pide contraseña) ─────────────────────────── */}
      {modalCambiarRol && (
        <div className="ap-modal-backdrop" onClick={() => setModalCambiarRol(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmar cambio de rol</h3>
            <p>
              Vas a cambiar el rol de <strong>{modalCambiarRol.nombre}</strong> de{' '}
              <strong>{modalCambiarRol.rol}</strong> a{' '}
              <strong>{modalCambiarRol.rol === 'admin' ? 'user' : 'admin'}</strong>.
            </p>
            <div className="ap-form-field" style={{ marginTop: '16px' }}>
              <label>Tu contraseña — cuenta: <span style={{ color: '#CC1F1F' }}>{user?.email}</span></label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordRol}
                onChange={e => { setPasswordRol(e.target.value); setPasswordRolError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCambiarRolConfirm()}
                autoFocus
              />
              {passwordRolError && (
                <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                  {passwordRolError}
                </span>
              )}
            </div>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn--outline" onClick={() => setModalCambiarRol(null)}>Cancelar</button>
              <button className="ap-btn ap-btn--primary" onClick={handleCambiarRolConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR PRODUCTO ──────────────────────────────────────── */}
      {modalElimProd && (
        <div className="ap-modal-backdrop" onClick={() => setModalElimProd(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <h3>Eliminar producto</h3>
            <p>Vas a eliminar <strong>"{modalElimProd.titulo}"</strong>. El vendedor recibirá una notificación.</p>
            <div className="ap-form-field" style={{ marginTop: '16px' }}>
              <label>Motivo de eliminación (opcional)</label>
              <textarea
                rows={3}
                placeholder="Escribe el motivo..."
                value={motivoElimProd}
                onChange={e => setMotivoElimProd(e.target.value)}
              />
            </div>
            <div className="ap-modal-actions">
              <button className="ap-btn ap-btn--outline" onClick={() => setModalElimProd(null)}>Cancelar</button>
              <button className="ap-btn ap-btn--danger" onClick={handleEliminarProducto}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
