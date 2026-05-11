import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Navbar.css'

export default function Navbar({ user, activePage, onNavigate }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
<<<<<<< HEAD
  const [notifOpen, setNotifOpen] = useState(false)
  const [notificaciones, setNotificaciones] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  const goTo = (path) => {
    setMenuOpen(false)
    setNotifOpen(false)

=======
  const dropdownRef = useRef(null)

  const goTo = (path) => {
    setMenuOpen(false)
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    if (onNavigate) {
      onNavigate(path)
    } else {
      navigate(path)
    }
  }

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
<<<<<<< HEAD

      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }

=======
    }
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

<<<<<<< HEAD
  useEffect(() => {
    if (!user) return

    authService.getNotificaciones()
      .then(data => {
        setNotificaciones(data.notificaciones || [])
        setNoLeidas(data.no_leidas || 0)
      })
      .catch(() => {})
  }, [user])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (_) {}

=======
  const handleLogout = async () => {
    try { await authService.logout() } catch (_) {}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
    authService.borrarSesion()
    navigate('/login')
  }

<<<<<<< HEAD
  const handleMarcarLeida = async (id) => {
    await authService.marcarNotificacionLeida(id).catch(() => {})

    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: 1 } : n)
    )

    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  const handleMarcarTodasLeidas = async () => {
    await authService.marcarTodasLeidas().catch(() => {})

    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: 1 }))
    )

    setNoLeidas(0)
  }

=======
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const firstName = user?.nombre?.split(' ')[0] || 'Operador'
<<<<<<< HEAD
  const esAdmin = user?.rol === 'admin'

  return (
    <nav className="navbar">
      <a
        className="nav-logo"
        onClick={() => goTo('/dashboard')}
        style={{ cursor: 'pointer' }}
      >
=======

  return (
    <nav className="navbar">
      {/* Logo */}
      <a className="nav-logo" onClick={() => goTo('/dashboard')} style={{ cursor: 'pointer' }}>
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
        <div className="nav-brand-icon">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
<<<<<<< HEAD

        <span className="nav-brand-name">AK-MARKET</span>
      </a>

=======
        <span className="nav-brand-name">AK-MARKET</span>
      </a>

      {/* Nav links */}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
      <div className="nav-links">
        <a
          className={`nav-link${activePage === 'inicio' ? ' active' : ''}`}
          onClick={() => goTo('/dashboard')}
        >
          Inicio
        </a>
<<<<<<< HEAD

        <a
          className={`nav-link${activePage === 'catalogo' ? ' active' : ''}`}
          onClick={() => goTo('/dashboard')}
        >
          Catálogo
        </a>

        <a
          className={`nav-link${activePage === 'armeria' ? ' active' : ''}`}
          onClick={() => goTo('/armeria')}
        >
          Mi armería
        </a>
      </div>

      <div className="nav-right">
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="nav-icon-btn"
            title="Notificaciones"
            onClick={() => setNotifOpen(v => !v)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>

            {noLeidas > 0 && <span className="notif-badge">{noLeidas}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span>Notificaciones</span>

                {noLeidas > 0 && (
                  <button className="notif-mark-all" onClick={handleMarcarTodasLeidas}>
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              {notificaciones.length === 0 ? (
                <p className="notif-empty">No tienes notificaciones</p>
              ) : (
                <ul className="notif-list">
                  {notificaciones.map(n => (
                    <li
                      key={n.id}
                      className={`notif-item${n.leida ? '' : ' notif-item--unread'}`}
                      onClick={() => !n.leida && handleMarcarLeida(n.id)}
                    >
                      <div className="notif-item-icon">
                        {n.tipo === 'producto_eliminado' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6"/>
                            <path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        )}

                        {n.tipo === 'cuenta_bloqueada' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                        )}

                        {n.tipo === 'sistema' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        )}
                      </div>

                      <div className="notif-item-body">
                        <p className="notif-item-titulo">{n.titulo}</p>
                        <p className="notif-item-msg">{n.mensaje}</p>
                        <p className="notif-item-fecha">
                          {new Date(n.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="nav-profile-btn"
            onClick={() => setMenuOpen(v => !v)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={firstName} className="avatar-img" />
            ) : (
              <div className="avatar">{initials}</div>
            )}

            <span className="nav-username">{firstName}</span>

            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`chevron${menuOpen ? ' open' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                {user?.avatar ? (
                  <img src={user.avatar} alt={firstName} className="avatar-img avatar-img--lg" />
                ) : (
                  <div className="avatar avatar--lg">{initials}</div>
                )}

                <div className="dropdown-user-info">
                  <p className="dropdown-name">{user?.nombre || 'Usuario'}</p>
                  <p className="dropdown-email">{user?.email || ''}</p>
                </div>
              </div>

              <div className="dropdown-divider" />

              {esAdmin && (
                <>
                  <button
                    className="dropdown-item dropdown-item--admin"
                    onClick={() => goTo('/admin')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Panel Administrativo
                  </button>

                  <div className="dropdown-divider" />
                </>
              )}

              <button
                className="dropdown-item"
                onClick={() => goTo('/perfil')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Mi perfil
              </button>

              <button
                className="dropdown-item"
                onClick={() => goTo('/armeria')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Mi armería
              </button>

              <button
                className="dropdown-item"
                onClick={() => goTo('/mis-productos')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Mis productos
              </button>

              <button
                className="dropdown-item"
                onClick={() => goTo('/configuracion')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Configuración
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item dropdown-item--danger"
                onClick={handleLogout}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
=======
        <a
          className={`nav-link${activePage === 'catalogo' ? ' active' : ''}`}
          onClick={() => goTo('/catalogo')}
        >
          Catálogo
        </a>
        <a
          className={`nav-link${activePage === 'vender' ? ' active' : ''}`}
          onClick={() => goTo('/vender')}
        >
          Vender
        </a>
        <a
          className={`nav-link${activePage === 'pedidos' ? ' active' : ''}`}
          onClick={() => goTo('/pedidos')}
        >
          Mis pedidos
        </a>
      </div>

      {/* Right section */}
      <div className="nav-right" ref={dropdownRef}>
        {/* Notification bell */}
        <button className="nav-icon-btn" title="Notificaciones">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-badge">2</span>
        </button>

        {/* Profile button */}
        <button className="nav-profile-btn" onClick={() => setMenuOpen(v => !v)}>
          {user?.avatar ? (
            <img src={user.avatar} alt={firstName} className="avatar-img" />
          ) : (
            <div className="avatar">{initials}</div>
          )}
          <span className="nav-username">{firstName}</span>
          <svg
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`chevron${menuOpen ? ' open' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="profile-dropdown">
            <div className="dropdown-header">
              {user?.avatar ? (
                <img src={user.avatar} alt={firstName} className="avatar-img avatar-img--lg" />
              ) : (
                <div className="avatar avatar--lg">{initials}</div>
              )}
              <div className="dropdown-user-info">
                <p className="dropdown-name">{user?.nombre || 'Usuario'}</p>
                <p className="dropdown-email">{user?.email || ''}</p>
              </div>
            </div>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item"
              onClick={() => goTo('/perfil')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Mi perfil
            </button>

            <button
              className="dropdown-item"
              onClick={() => goTo('/mis-productos')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Mis productos
            </button>

            <button
              className="dropdown-item"
              onClick={() => goTo('/configuracion')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Configuración
            </button>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item dropdown-item--danger"
              onClick={handleLogout}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
