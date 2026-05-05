import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import './Navbar.css'

export default function Navbar({ user, activePage }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    try { await authService.logout() } catch (_) {}
    authService.borrarSesion()
    navigate('/login')
  }

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const firstName = user?.nombre?.split(' ')[0] || 'Operador'

  return (
    <nav className="navbar">
      {/* Logo */}
      <a className="nav-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="nav-brand-icon">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <path d="M3,25 L14,3 L14,25" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8,15 L14,15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14,15 L25,3" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M14,15 L25,25" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="nav-brand-name">AK-MARKET</span>
      </a>

      {/* Nav links */}
      <div className="nav-links">
        <a
          className={`nav-link${activePage === 'inicio' ? ' active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          Inicio
        </a>
        <a
          className={`nav-link${activePage === 'catalogo' ? ' active' : ''}`}
          onClick={() => navigate('/catalogo')}
        >
          Catálogo
        </a>
        <a
          className={`nav-link${activePage === 'vender' ? ' active' : ''}`}
          onClick={() => navigate('/vender')}
        >
          Vender
        </a>
        <a
          className={`nav-link${activePage === 'pedidos' ? ' active' : ''}`}
          onClick={() => navigate('/pedidos')}
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
              onClick={() => { setMenuOpen(false); navigate('/perfil') }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Mi perfil
            </button>

            <button
              className="dropdown-item"
              onClick={() => { setMenuOpen(false); navigate('/configuracion') }}
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
