import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import Navbar from '../components/Navbar'
import './AdminPanel.css'

const ACCION_LABELS = {
  eliminar_usuario:    'Usuario eliminado',
  bloquear_usuario:    'Usuario bloqueado',
  desbloquear_usuario: 'Usuario desbloqueado',
  eliminar_producto:   'Producto eliminado',
  crear_usuario:       'Usuario creado',
  cambiar_rol:         'Rol cambiado',
}

export default function AdminPanel() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [seccion, setSeccion] = useState('resumen')
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState(null)

  const [usuarios, setUsuarios] = useState([])
  const [busqUser, setBusqUser] = useState('')
  const [mostrarEliminados, setMostrarEliminados] = useState(false)

  const [articulos, setArticulos] = useState([])
  const [busqArt, setBusqArt] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [historial, setHistorial] = useState([])

  const [historialArmas, setHistorialArmas] = useState([])
  const [busqHistArma, setBusqHistArma] = useState('')
  const [modalHistArma, setModalHistArma] = useState(null)
  const [histArmaDetalle, setHistArmaDetalle] = useState(null)
  const [histArmaLoading, setHistArmaLoading] = useState(false)
  const [histArmaError, setHistArmaError] = useState('')

  const [modalBloquear, setModalBloquear] = useState(null)
  const [motivoBloqueo, setMotivoBloqueo] = useState('')

  const [modalElimProd, setModalElimProd] = useState(null)
  const [motivoElimProd, setMotivoElimProd] = useState('')

  const [modalElimUser, setModalElimUser] = useState(null)

  const [modalCambiarRol, setModalCambiarRol] = useState(null)
  const [passwordRol, setPasswordRol] = useState('')
  const [passwordRolError, setPasswordRolError] = useState('')

  const [crearForm, setCrearForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'user',
  })

  const [crearStatus, setCrearStatus] = useState(null)
  const [crearMsg, setCrearMsg] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))

      if (payload.rol !== 'admin') {
        navigate('/dashboard')
        return
      }

      setUser({
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
      })
    } catch (_) {
      navigate('/login')
      return
    }

    authService.me()
      .then(d => {
        if (d?.usuario) setUser(d.usuario)
      })
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
      }

      if (s === 'usuarios') {
        const d = await authService.adminGetUsuarios()
        setUsuarios(d.usuarios || [])
      }

      if (s === 'productos') {
        const d = await authService.adminGetArticulos()
        setArticulos(d.articulos || [])
      }

      if (s === 'historial') {
        const d = await authService.adminGetHistorial()
        setHistorial(d.historial || [])
      }

      if (s === 'historial-armas') {
        const d = await authService.adminGetHistorialArmas()
        setHistorialArmas(d.historiales || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBloquear = async () => {
    if (!modalBloquear) return

    await authService.adminBloquearUsuario(modalBloquear.id, motivoBloqueo).catch(() => {})

    setUsuarios(prev => prev.map(u =>
      u.id === modalBloquear.id
        ? { ...u, bloqueado: 1, motivo_bloqueo: motivoBloqueo }
        : u
    ))

    setModalBloquear(null)
    setMotivoBloqueo('')
  }

  const handleDesbloquear = async (id) => {
    await authService.adminDesbloquearUsuario(id).catch(() => {})

    setUsuarios(prev => prev.map(u =>
      u.id === id
        ? { ...u, bloqueado: 0, motivo_bloqueo: null }
        : u
    ))
  }

  const handleCambiarRol = (u) => {
    setModalCambiarRol(u)
    setPasswordRol('')
    setPasswordRolError('')
  }

  const handleCambiarRolConfirm = async () => {
    if (!modalCambiarRol) return

    if (!passwordRol) {
      setPasswordRolError('Introduce tu contraseña')
      return
    }

    setPasswordRolError('')

    const nuevoRol = modalCambiarRol.rol === 'admin' ? 'user' : 'admin'

    try {
      await authService.adminCambiarRol(modalCambiarRol.id, nuevoRol, passwordRol)

      setUsuarios(prev => prev.map(u =>
        u.id === modalCambiarRol.id
          ? { ...u, rol: nuevoRol }
          : u
      ))

      setModalCambiarRol(null)
      setPasswordRol('')
    } catch (err) {
      setPasswordRolError(err.message || 'Contraseña incorrecta')
    }
  }

  const handleEliminarUsuario = async () => {
    if (!modalElimUser) return

    await authService.adminEliminarUsuario(modalElimUser.id).catch(() => {})

    setUsuarios(prev => prev.map(u =>
      u.id === modalElimUser.id
        ? { ...u, activo: 0 }
        : u
    ))

    setModalElimUser(null)
  }

  const handleEliminarProducto = async () => {
    if (!modalElimProd) return

    await authService.adminEliminarArticulo(modalElimProd.id, motivoElimProd).catch(() => {})

    setArticulos(prev => prev.map(a =>
      a.id === modalElimProd.id
        ? {
            ...a,
            estado: 'eliminado',
            eliminado_por_admin: 1,
            motivo_eliminacion: motivoElimProd,
          }
        : a
    ))

    setModalElimProd(null)
    setMotivoElimProd('')
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault()

    setCrearStatus(null)
    setCrearMsg('')

    try {
      await authService.adminCrearUsuario(crearForm)

      setCrearStatus('ok')
      setCrearMsg('Usuario creado correctamente')
      setCrearForm({
        nombre: '',
        email: '',
        password: '',
        rol: 'user',
      })

      setTimeout(() => setCrearStatus(null), 3000)
    } catch (err) {
      setCrearStatus('err')
      setCrearMsg(err.message || 'Error al crear usuario')
    }
  }

  const abrirHistorialArma = async (item) => {
    setModalHistArma(item)
    setHistArmaDetalle(null)
    setHistArmaError('')
    setHistArmaLoading(true)

    try {
      const data = await authService.adminGetHistorialArma(item.id)
      setHistArmaDetalle(data.historial)
    } catch (err) {
      setHistArmaError(err.message || 'Error al cargar el historial del arma')
    } finally {
      setHistArmaLoading(false)
    }
  }

  const cerrarHistorialArma = () => {
    setModalHistArma(null)
    setHistArmaDetalle(null)
    setHistArmaError('')
    setHistArmaLoading(false)
  }

  const usuariosActivos = usuarios.filter(u =>
    u.activo !== 0 &&
    (
      String(u.nombre || '').toLowerCase().includes(busqUser.toLowerCase()) ||
      String(u.email || '').toLowerCase().includes(busqUser.toLowerCase())
    )
  )

  const usuariosEliminados = usuarios.filter(u =>
    u.activo === 0 &&
    (
      String(u.nombre || '').toLowerCase().includes(busqUser.toLowerCase()) ||
      String(u.email || '').toLowerCase().includes(busqUser.toLowerCase())
    )
  )

  const articulosFiltrados = articulos.filter(a => {
    const coincide =
      String(a.titulo || '').toLowerCase().includes(busqArt.toLowerCase()) ||
      String(a.usuario_nombre || '').toLowerCase().includes(busqArt.toLowerCase()) ||
      String(a.usuario_email || '').toLowerCase().includes(busqArt.toLowerCase())

    if (filtroEstado === 'todos') return coincide
    return coincide && a.estado === filtroEstado
  })

  const historialArmasFiltrado = historialArmas.filter(h => {
    const texto = [
      h.arma_nombre,
      h.arma_categoria,
      h.propietario_actual_nombre,
      h.propietario_actual_email,
      h.propietario_anterior_nombre,
      h.propietario_anterior_email,
      h.id,
    ].join(' ').toLowerCase()

    return texto.includes(busqHistArma.toLowerCase())
  })

  const renderGrafico = () => {
    if (!stats?.registros_por_mes?.length) {
      return <p className="ap-empty">Sin datos de registros</p>
    }

    const datos = stats.registros_por_mes
    const max = Math.max(...datos.map(d => d.total), 1)

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

              <span className="ap-chart-label">
                {d.mes.slice(5)}/{d.mes.slice(2, 4)}
              </span>
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

            <button className="ap-chat-btn" title="Chat con clientes (próximamente)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat soporte
              <span className="ap-chat-badge">Próximamente</span>
            </button>
          </div>

          <div className="ap-tabs">
            {[
              { id: 'resumen', label: 'Resumen' },
              { id: 'usuarios', label: 'Usuarios' },
              { id: 'productos', label: 'Productos' },
              { id: 'historial-armas', label: 'Historial armas' },
              { id: 'historial', label: 'Historial admin' },
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

          {seccion === 'resumen' && (
            <div className="ap-section">
              {loading ? (
                <div className="ap-spinner" />
              ) : (
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

                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.armas_con_historial ?? '—'}</span>
                      <span className="ap-stat-lbl">Armas con historial</span>
                    </div>

                    <div className="ap-stat-card">
                      <span className="ap-stat-val">{stats?.totales?.transacciones_armas ?? '—'}</span>
                      <span className="ap-stat-lbl">Transacciones armas</span>
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

              {loading ? (
                <div className="ap-spinner" />
              ) : (
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
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.nombre} />
                                  ) : (
                                    iniciales(u.nombre)
                                  )}
                                </div>

                                <div>
                                  <p className="ap-user-name">{u.nombre}</p>
                                  <p className="ap-user-email">{u.email}</p>
                                  {u.wallet && <p className="ap-user-email">Wallet: {cortarHash(u.wallet)}</p>}
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className={`ap-badge ap-badge--${u.rol}`}>
                                {u.rol}
                              </span>
                            </td>

                            <td>
                              {u.bloqueado ? (
                                <span className="ap-badge ap-badge--bloqueado">Bloqueado</span>
                              ) : (
                                <span className="ap-badge ap-badge--activo">Activo</span>
                              )}
                            </td>

                            <td className="ap-date">
                              {formatearFechaCorta(u.created_at)}
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

                                <button className="ap-btn ap-btn--outline" onClick={() => handleCambiarRol(u)}>
                                  Cambiar rol
                                </button>

                                {u.id !== user.id && (
                                  <button className="ap-btn ap-btn--danger" onClick={() => setModalElimUser(u)}>
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {usuariosActivos.length === 0 && (
                      <p className="ap-empty">No hay usuarios activos que coincidan con la búsqueda.</p>
                    )}
                  </div>

                  <div className="ap-deleted-section">
                    <button
                      className="ap-deleted-toggle"
                      onClick={() => setMostrarEliminados(v => !v)}
                    >
                      {mostrarEliminados ? 'Ocultar eliminados' : 'Mostrar usuarios eliminados'}
                      <span>{usuariosEliminados.length}</span>
                    </button>

                    {mostrarEliminados && (
                      <div className="ap-table-wrap ap-table-wrap--deleted">
                        <table className="ap-table">
                          <thead>
                            <tr>
                              <th>Usuario eliminado</th>
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
                                      {iniciales(u.nombre)}
                                    </div>

                                    <div>
                                      <p className="ap-user-name">{u.nombre}</p>
                                      <p className="ap-user-email">{u.email}</p>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <span className={`ap-badge ap-badge--${u.rol}`}>
                                    {u.rol}
                                  </span>
                                </td>

                                <td className="ap-date">
                                  {formatearFechaCorta(u.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {usuariosEliminados.length === 0 && (
                          <p className="ap-empty">No hay usuarios eliminados.</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {seccion === 'productos' && (
            <div className="ap-section">
              <div className="ap-toolbar">
                <input
                  className="ap-search"
                  placeholder="Buscar producto o vendedor..."
                  value={busqArt}
                  onChange={e => setBusqArt(e.target.value)}
                />

                <select
                  className="ap-filter-select"
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="vendido">Vendidos</option>
                  <option value="retirado">Retirados</option>
                  <option value="expirado">Expirados</option>
                  <option value="eliminado">Eliminados</option>
                </select>

                <span className="ap-count">{articulosFiltrados.length} productos</span>
              </div>

              {loading ? (
                <div className="ap-spinner" />
              ) : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Vendedor</th>
                        <th>Comprador</th>
                        <th>Precio</th>
                        <th>Dueños</th>
                        <th>Tx</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {articulosFiltrados.map(a => (
                        <tr key={a.id}>
                          <td>
                            <div className="ap-prod-cell">
                              {a.foto && <img className="ap-prod-img" src={a.foto} alt={a.titulo} />}

                              <div>
                                <p className="ap-prod-title">{a.titulo}</p>
                                <p className="ap-prod-cat">{a.categoria}</p>

                                {a.motivo_eliminacion && (
                                  <p className="ap-prod-motivo">
                                    Motivo: {a.motivo_eliminacion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <p className="ap-user-name">{a.usuario_nombre || 'Usuario'}</p>
                            <p className="ap-user-email">{a.usuario_email || ''}</p>
                          </td>

                          <td>
                            {a.comprador_id ? (
                              <>
                                <p className="ap-user-name">{a.comprador_nombre || 'Usuario'}</p>
                                <p className="ap-user-email">{a.comprador_email || ''}</p>
                              </>
                            ) : (
                              <span className="ap-date">Sin comprador</span>
                            )}
                          </td>

                          <td className="ap-price">
                            {a.precio_crypto} {a.crypto}
                            <br />
                            ≈ {Number(a.precio_eur || 0).toLocaleString('es-ES')}€
                          </td>

                          <td>
                            <span className="ap-badge ap-badge--accion">
                              {a.numero_duenos || 1}
                            </span>
                          </td>

                          <td>
                            {a.tx_hash ? (
                              <a
                                className="ap-hash-link"
                                href={a.etherscan_url || `https://sepolia.etherscan.io/tx/${a.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {cortarHash(a.tx_hash)}
                              </a>
                            ) : (
                              <span className="ap-date">—</span>
                            )}
                          </td>

                          <td>
                            <span className={`ap-badge ap-badge--${a.estado}`}>
                              {a.estado}
                            </span>

                            {a.eliminado_por_admin ? (
                              <span className="ap-badge ap-badge--admin-del">
                                Admin
                              </span>
                            ) : null}
                          </td>

                          <td>
                            <div className="ap-actions">
                              {a.historial_arma_id && (
                                <button
                                  className="ap-btn ap-btn--outline"
                                  onClick={() => abrirHistorialArma({
                                    id: a.historial_arma_id,
                                    arma_nombre: a.titulo,
                                  })}
                                >
                                  Historial
                                </button>
                              )}

                              {a.estado !== 'eliminado' && (
                                <button
                                  className="ap-btn ap-btn--danger"
                                  onClick={() => { setModalElimProd(a); setMotivoElimProd('') }}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {articulosFiltrados.length === 0 && (
                    <p className="ap-empty">No hay productos que coincidan con la búsqueda.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {seccion === 'historial-armas' && (
            <div className="ap-section">
              <div className="ap-toolbar">
                <input
                  className="ap-search"
                  placeholder="Buscar arma, propietario, email o ID..."
                  value={busqHistArma}
                  onChange={e => setBusqHistArma(e.target.value)}
                />

                <span className="ap-count">
                  {historialArmasFiltrado.length} historiales
                </span>
              </div>

              {loading ? (
                <div className="ap-spinner" />
              ) : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Arma</th>
                        <th>Dueños</th>
                        <th>Transacciones</th>
                        <th>Propietario actual</th>
                        <th>Anterior propietario</th>
                        <th>Actualizado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historialArmasFiltrado.map(h => (
                        <tr key={h.id}>
                          <td>
                            <div>
                              <p className="ap-prod-title">{h.arma_nombre || 'Arma sin nombre'}</p>
                              <p className="ap-prod-cat">{h.arma_categoria || 'Sin categoría'}</p>
                              <p className="ap-user-email">ID: {h.id}</p>
                            </div>
                          </td>

                          <td>
                            <span className="ap-badge ap-badge--accion">
                              {h.numero_duenos || 1}
                            </span>
                          </td>

                          <td>
                            <span className="ap-badge ap-badge--cambiar">
                              {h.transacciones_totales || 0}
                            </span>
                          </td>

                          <td>
                            <p className="ap-user-name">{h.propietario_actual_nombre || '—'}</p>
                            <p className="ap-user-email">{h.propietario_actual_email || ''}</p>
                          </td>

                          <td>
                            <p className="ap-user-name">{h.propietario_anterior_nombre || '—'}</p>
                            <p className="ap-user-email">{h.propietario_anterior_email || ''}</p>
                          </td>

                          <td className="ap-date">
                            {formatearFechaCorta(h.updated_at || h.created_at)}
                          </td>

                          <td>
                            <button
                              className="ap-btn ap-btn--outline"
                              onClick={() => abrirHistorialArma(h)}
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {historialArmasFiltrado.length === 0 && (
                    <p className="ap-empty">No hay historiales de armas todavía.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {seccion === 'historial' && (
            <div className="ap-section">
              {loading ? (
                <div className="ap-spinner" />
              ) : (
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Acción</th>
                        <th>Entidad</th>
                        <th>Detalle</th>
                        <th>Admin</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>

                    <tbody>
                      {historial.map(h => (
                        <tr key={h.id}>
                          <td>
                            <span className={`ap-badge ap-badge--${tipoAccion(h.accion)}`}>
                              {ACCION_LABELS[h.accion] || h.accion}
                            </span>
                          </td>

                          <td>
                            <p className="ap-prod-title">{h.entidad_tipo}</p>
                            <p className="ap-user-email">{h.entidad_id}</p>
                          </td>

                          <td className="ap-hist-detalle">
                            {h.detalle || '—'}
                          </td>

                          <td>
                            {h.admin_nombre || 'Admin'}
                          </td>

                          <td className="ap-date">
                            {formatearFechaCorta(h.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {historial.length === 0 && (
                    <p className="ap-empty">No hay acciones registradas todavía.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {seccion === 'crear-usuario' && (
            <div className="ap-section">
              <form className="ap-form-card" onSubmit={handleCrearUsuario}>
                <h3>Crear usuario</h3>

                <div className="ap-form-row">
                  <label>
                    Nombre
                    <input
                      value={crearForm.nombre}
                      onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Nombre del usuario"
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={crearForm.email}
                      onChange={e => setCrearForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="correo@email.com"
                    />
                  </label>
                </div>

                <div className="ap-form-row">
                  <label>
                    Contraseña
                    <input
                      type="password"
                      value={crearForm.password}
                      onChange={e => setCrearForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </label>

                  <label>
                    Rol
                    <select
                      value={crearForm.rol}
                      onChange={e => setCrearForm(f => ({ ...f, rol: e.target.value }))}
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </div>

                {crearStatus && (
                  <p className={crearStatus === 'ok' ? 'ap-status-ok' : 'ap-status-err'}>
                    {crearMsg}
                  </p>
                )}

                <div className="ap-form-actions">
                  <button className="ap-btn ap-btn--primary" type="submit">
                    Crear usuario
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {modalBloquear && (
        <ConfirmModal
          title="Bloquear usuario"
          text={`Vas a bloquear a ${modalBloquear.nombre}.`}
          onCancel={() => setModalBloquear(null)}
          onConfirm={handleBloquear}
          confirmText="Bloquear"
        >
          <textarea
            className="ap-modal-textarea"
            value={motivoBloqueo}
            onChange={e => setMotivoBloqueo(e.target.value)}
            placeholder="Motivo del bloqueo..."
          />
        </ConfirmModal>
      )}

      {modalElimProd && (
        <ConfirmModal
          title="Eliminar producto"
          text={`Vas a eliminar el producto "${modalElimProd.titulo}".`}
          onCancel={() => setModalElimProd(null)}
          onConfirm={handleEliminarProducto}
          confirmText="Eliminar"
        >
          <textarea
            className="ap-modal-textarea"
            value={motivoElimProd}
            onChange={e => setMotivoElimProd(e.target.value)}
            placeholder="Motivo de eliminación..."
          />
        </ConfirmModal>
      )}

      {modalElimUser && (
        <ConfirmModal
          title="Eliminar usuario"
          text={`Vas a eliminar a ${modalElimUser.nombre}.`}
          onCancel={() => setModalElimUser(null)}
          onConfirm={handleEliminarUsuario}
          confirmText="Eliminar"
        />
      )}

      {modalCambiarRol && (
        <ConfirmModal
          title="Cambiar rol"
          text={`Vas a cambiar el rol de ${modalCambiarRol.nombre}. Introduce tu contraseña para confirmar.`}
          onCancel={() => setModalCambiarRol(null)}
          onConfirm={handleCambiarRolConfirm}
          confirmText="Confirmar"
        >
          <input
            className="ap-modal-input"
            type="password"
            value={passwordRol}
            onChange={e => setPasswordRol(e.target.value)}
            placeholder="Tu contraseña"
          />

          {passwordRolError && (
            <p className="ap-modal-error">{passwordRolError}</p>
          )}
        </ConfirmModal>
      )}

      {modalHistArma && (
        <HistorialArmaModal
          item={modalHistArma}
          detalle={histArmaDetalle}
          loading={histArmaLoading}
          error={histArmaError}
          onClose={cerrarHistorialArma}
        />
      )}
    </div>
  )
}

function ConfirmModal({ title, text, children, onCancel, onConfirm, confirmText }) {
  return (
    <div className="ap-modal-backdrop">
      <div className="ap-modal">
        <h3>{title}</h3>
        <p>{text}</p>

        {children}

        <div className="ap-modal-actions">
          <button className="ap-btn ap-btn--outline" onClick={onCancel}>
            Cancelar
          </button>

          <button className="ap-btn ap-btn--danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function HistorialArmaModal({ item, detalle, loading, error, onClose }) {
  const historial = detalle || item
  const transacciones = historial?.transacciones || []

  return (
    <div className="ap-modal-backdrop">
      <div className="ap-modal ap-history-weapon-modal">
        <div className="ap-history-modal-head">
          <div>
            <h3>Historial del arma</h3>
            <p>{item.arma_nombre || historial?.arma_nombre || 'Arma'}</p>
          </div>

          <button className="ap-modal-x" onClick={onClose}>
            ×
          </button>
        </div>

        {loading && (
          <div className="ap-history-loading">
            <span className="ap-spinner" />
            <p>Cargando historial...</p>
          </div>
        )}

        {error && (
          <p className="ap-modal-error">{error}</p>
        )}

        {!loading && !error && historial && (
          <>
            <div className="ap-history-summary">
              <div>
                <span>Número de dueños</span>
                <strong>{historial.numero_duenos || 1}</strong>
              </div>

              <div>
                <span>Transacciones</span>
                <strong>{historial.transacciones_totales || transacciones.length || 0}</strong>
              </div>

              <div>
                <span>Propietario actual</span>
                <strong>{historial.propietario_actual_nombre || '—'}</strong>
                <small>{historial.propietario_actual_email || ''}</small>
              </div>

              <div>
                <span>Anterior propietario</span>
                <strong>{historial.propietario_anterior_nombre || '—'}</strong>
                <small>{historial.propietario_anterior_email || ''}</small>
              </div>
            </div>

            <div className="ap-history-transactions">
              <h4>Transacciones anteriores</h4>

              {transacciones.length === 0 ? (
                <p className="ap-empty">Todavía no hay transacciones registradas.</p>
              ) : (
                transacciones.map(tx => (
                  <div className="ap-history-tx" key={tx.id}>
                    <div className="ap-history-tx-top">
                      <span>Transacción #{tx.orden}</span>
                      <strong>{tx.precio_crypto} {tx.crypto || 'ETH'} · {Number(tx.precio_eur || 0).toLocaleString('es-ES')}€</strong>
                    </div>

                    <div className="ap-history-tx-grid">
                      <div>
                        <span>Vendedor</span>
                        <strong>{tx.vendedor_nombre || '—'}</strong>
                        <small>{tx.vendedor_email || ''}</small>
                      </div>

                      <div>
                        <span>Comprador</span>
                        <strong>{tx.comprador_nombre || '—'}</strong>
                        <small>{tx.comprador_email || ''}</small>
                      </div>

                      <div>
                        <span>Fecha</span>
                        <strong>{formatearFechaCorta(tx.created_at)}</strong>
                      </div>

                      <div>
                        <span>Bloque</span>
                        <strong>{tx.bloque_pago || '—'}</strong>
                      </div>
                    </div>

                    {tx.tx_hash && (
                      <div className="ap-history-hash">
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
                ))
              )}
            </div>
          </>
        )}

        <div className="ap-modal-actions">
          <button className="ap-btn ap-btn--outline" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function iniciales(nombre) {
  return String(nombre || '?')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function cortarHash(hash) {
  if (!hash) return '—'
  return `${String(hash).slice(0, 10)}...${String(hash).slice(-6)}`
}

function formatearFechaCorta(valor) {
  if (!valor) return '—'

  const d = new Date(valor)

  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function tipoAccion(accion) {
  if (accion?.includes('eliminar')) return 'eliminar'
  if (accion?.includes('bloquear')) return 'bloquear'
  if (accion?.includes('desbloquear')) return 'desbloquear'
  if (accion?.includes('crear')) return 'crear'
  if (accion?.includes('rol')) return 'cambiar'
  return 'accion'
}