import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import Navbar from '../components/Navbar'
import './configuracion.css'

const estadoInicialPassword = {
  actual: '',
  nueva: '',
  confirmar: '',
}

const estadoInicialBaja = {
  motivo: '',
  detalle: '',
  confirmar: false,
}

const estadoInicialIncidencia = {
  asunto: '',
  descripcion: '',
}

const MOTIVOS_BAJA = [
  'No uso la plataforma',
  'He encontrado una alternativa mejor',
  'Problemas con compras o pagos',
  'Problemas con vendedores o compradores',
  'No me siento seguro usando la plataforma',
  'Quiero eliminar mis datos por privacidad',
  'La plataforma me parece complicada',
  'Otro motivo',
]

const esWalletValida = (wallet) => {
  return /^0x[a-fA-F0-9]{40}$/.test(String(wallet || '').trim())
}

export default function Configuracion() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)

  const [passwordForm, setPasswordForm] = useState(estadoInicialPassword)
  const [bajaForm, setBajaForm] = useState(estadoInicialBaja)
  const [incidenciaForm, setIncidenciaForm] = useState(estadoInicialIncidencia)

  const [walletManual, setWalletManual] = useState('')
  const [walletSeleccionada, setWalletSeleccionada] = useState('')

  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [guardandoBaja, setGuardandoBaja] = useState(false)
  const [guardandoIncidencia, setGuardandoIncidencia] = useState(false)
  const [guardandoPreferencias, setGuardandoPreferencias] = useState(false)
  const [loadingWallet, setLoadingWallet] = useState(false)

  const [preferencias, setPreferencias] = useState({
    avisos_producto_nuevo: true,
    tema: localStorage.getItem('tema') || 'oscuro',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    cargarUsuario()
  }, [navigate])

  useEffect(() => {
    document.documentElement.dataset.theme = preferencias.tema
    localStorage.setItem('tema', preferencias.tema)
  }, [preferencias.tema])

  const cargarUsuario = async () => {
    setLoading(true)

    try {
      const data = await authService.me()
      const usuario = data.usuario

      setUser(usuario)
      setWalletManual(usuario.wallet || '')
      setWalletSeleccionada(usuario.wallet || '')

      setPreferencias({
        avisos_producto_nuevo: usuario.avisos_producto_nuevo !== false,
        tema: usuario.tema || localStorage.getItem('tema') || 'oscuro',
      })

      if (usuario.tema) {
        localStorage.setItem('tema', usuario.tema)
        document.documentElement.dataset.theme = usuario.tema
      }
    } catch (_) {
      authService.borrarSesion()
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const mostrarMensaje = (tipo, titulo, texto) => {
    setStatus({ tipo, titulo, texto })
  }

  const cerrarMensaje = () => {
    setStatus(null)
  }

  const handlePassword = async (e) => {
    e.preventDefault()

    if (!passwordForm.actual || !passwordForm.nueva || !passwordForm.confirmar) {
      mostrarMensaje('error', 'Faltan datos', 'Rellena todos los campos para cambiar la contraseña.')
      return
    }

    if (passwordForm.nueva.length < 8) {
      mostrarMensaje('error', 'Contraseña débil', 'La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (passwordForm.nueva !== passwordForm.confirmar) {
      mostrarMensaje('error', 'No coinciden', 'La nueva contraseña y la confirmación no coinciden.')
      return
    }

    setGuardandoPassword(true)

    try {
      await authService.cambiarPassword({
        password_actual: passwordForm.actual,
        password_nueva: passwordForm.nueva,
      })

      setPasswordForm(estadoInicialPassword)
      mostrarMensaje('ok', 'Contraseña cambiada', 'Tu contraseña se ha actualizado correctamente. El administrador recibirá un aviso.')
    } catch (err) {
      mostrarMensaje('error', 'Error al cambiar contraseña', err.message || 'No se ha podido cambiar la contraseña.')
    } finally {
      setGuardandoPassword(false)
    }
  }

  const seleccionarWalletMetaMask = async () => {
    setLoadingWallet(true)

    try {
      if (!window.ethereum) {
        mostrarMensaje('error', 'MetaMask no instalado', 'No tienes MetaMask instalado en este navegador.')
        return
      }

      const cuentas = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!cuentas || cuentas.length === 0) {
        mostrarMensaje('error', 'Wallet no encontrada', 'No se ha podido obtener ninguna cuenta de MetaMask.')
        return
      }

      const wallet = cuentas[0].toLowerCase()
      setWalletSeleccionada(wallet)
      setWalletManual(wallet)

      mostrarMensaje('ok', 'Wallet seleccionada', 'Se ha seleccionado la wallet de MetaMask. Pulsa “Guardar wallet” para guardarla en tu cuenta.')
    } catch (err) {
      if (err.code === 4001) {
        mostrarMensaje('error', 'Conexión cancelada', 'Has cancelado la conexión con MetaMask.')
      } else {
        mostrarMensaje('error', 'Error con MetaMask', err.message || 'No se ha podido leer la wallet.')
      }
    } finally {
      setLoadingWallet(false)
    }
  }

  const guardarWallet = async () => {
    const wallet = String(walletManual || '').trim().toLowerCase()

    if (!wallet) {
      mostrarMensaje('error', 'Wallet vacía', 'Pega una wallet o selecciónala desde MetaMask antes de guardarla.')
      return
    }

    if (!esWalletValida(wallet)) {
      mostrarMensaje('error', 'Wallet no válida', 'La wallet debe empezar por 0x y tener 42 caracteres.')
      return
    }

    setLoadingWallet(true)

    try {
      const data = await authService.updateMe({ wallet })

      if (data?.usuario) {
        setUser(data.usuario)
      }

      setWalletSeleccionada(wallet)
      setWalletManual(wallet)
      mostrarMensaje('ok', 'Wallet guardada', 'Tu nueva wallet se ha guardado correctamente.')
    } catch (err) {
      mostrarMensaje('error', 'Error al guardar wallet', err.message || 'No se ha podido guardar la wallet.')
    } finally {
      setLoadingWallet(false)
    }
  }

  const desconectarWallet = async () => {
    setLoadingWallet(true)

    try {
      const data = await authService.updateMe({ wallet: '' })

      if (data?.usuario) {
        setUser(data.usuario)
      }

      setWalletManual('')
      setWalletSeleccionada('')
      mostrarMensaje('ok', 'Wallet desconectada', 'Tu wallet se ha desconectado correctamente.')
    } catch (err) {
      mostrarMensaje('error', 'Error al desconectar', err.message || 'No se ha podido desconectar la wallet.')
    } finally {
      setLoadingWallet(false)
    }
  }

 const guardarPreferencias = async (nuevasPreferencias) => {
  setGuardandoPreferencias(true)

  const siguientesPreferencias = {
    ...preferencias,
    ...nuevasPreferencias,
  }

  setPreferencias(siguientesPreferencias)

  if (siguientesPreferencias.tema) {
    const finalTheme = siguientesPreferencias.tema === 'claro' ? 'claro' : 'oscuro'
    document.documentElement.setAttribute('data-theme', finalTheme)
    localStorage.setItem('tema', finalTheme)
  }

  try {
    const data = await authService.updateMe(siguientesPreferencias)

    if (data?.usuario) {
      setUser(data.usuario)
    }

    mostrarMensaje(
      'ok',
      'Preferencias guardadas',
      'La configuración se ha actualizado correctamente.'
    )
  } catch (err) {
    mostrarMensaje(
      'error',
      'Error al guardar',
      err.message || 'No se han podido guardar las preferencias.'
    )
  } finally {
    setGuardandoPreferencias(false)
  }
}

  const handleBaja = async (e) => {
    e.preventDefault()

    if (!bajaForm.motivo) {
      mostrarMensaje('error', 'Motivo obligatorio', 'Selecciona un motivo para darte de baja.')
      return
    }

    if (!bajaForm.confirmar) {
      mostrarMensaje('error', 'Confirma la baja', 'Debes confirmar que quieres dar de baja tu cuenta.')
      return
    }

    setGuardandoBaja(true)

    try {
      await authService.bajaCuenta({
        motivo: bajaForm.motivo,
        detalle: bajaForm.detalle,
      })

      authService.borrarSesion()
      mostrarMensaje('ok', 'Cuenta dada de baja', 'Tu cuenta se ha dado de baja y el administrador recibirá un aviso.')

      setTimeout(() => {
        navigate('/inicio')
      }, 1800)
    } catch (err) {
      mostrarMensaje('error', 'Error al dar de baja', err.message || 'No se ha podido dar de baja la cuenta.')
    } finally {
      setGuardandoBaja(false)
    }
  }

  const handleIncidencia = async (e) => {
    e.preventDefault()

    if (!incidenciaForm.asunto.trim() || !incidenciaForm.descripcion.trim()) {
      mostrarMensaje('error', 'Faltan datos', 'Escribe un asunto y una descripción para reportar la incidencia.')
      return
    }

    setGuardandoIncidencia(true)

    try {
      await authService.reportarIncidencia({
        asunto: incidenciaForm.asunto.trim(),
        descripcion: incidenciaForm.descripcion.trim(),
      })

      setIncidenciaForm(estadoInicialIncidencia)
      mostrarMensaje('ok', 'Incidencia enviada', 'Tu incidencia se ha enviado al administrador correctamente.')
    } catch (err) {
      mostrarMensaje('error', 'Error al enviar', err.message || 'No se ha podido enviar la incidencia.')
    } finally {
      setGuardandoIncidencia(false)
    }
  }

  const cortarWallet = (wallet) => {
    if (!wallet) return 'No conectada'
    return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`
  }

  if (loading) {
    return (
      <div className="config-root">
        <Navbar user={user} activePage="configuracion" onNavigate={p => navigate(p)} />
        <main className="config-main">
          <div className="config-loading">Cargando configuración...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="config-root">
      <Navbar user={user} activePage="configuracion" onNavigate={p => navigate(p)} />

      {status && (
        <div className="config-modal-backdrop">
          <div className="config-modal">
            <div className={`config-modal-icon config-modal-icon--${status.tipo}`}>
              {status.tipo === 'ok' ? (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <h3>{status.titulo}</h3>
            <p>{status.texto}</p>

            <button className="config-btn config-btn--primary" onClick={cerrarMensaje}>
              Entendido
            </button>
          </div>
        </div>
      )}

      <main className="config-main">
        <div className="config-container">
          <header className="config-header">
            <div>
              <span className="config-kicker">Centro de usuario</span>
              <h1>Configuración</h1>
              <p>Controla tu contraseña, wallet, avisos, tema, incidencias y baja de cuenta desde un único panel.</p>
            </div>

            <div className="config-user-card">
              <div className="config-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.nombre} />
                ) : (
                  <span>{user?.nombre ? user.nombre[0].toUpperCase() : '?'}</span>
                )}
              </div>

              <div>
                <strong>{user?.nombre || 'Usuario'}</strong>
                <small>{user?.email || ''}</small>
              </div>
            </div>
          </header>

          <div className="config-grid">
            <section className="config-card config-card--wallet config-card--wide">
              <div className="config-card-head config-card-head--row">
                <div>
                  <span className="config-section-pill">Blockchain</span>
                  <h2>Wallet MetaMask</h2>
                  <p>Selecciona una cartera desde MetaMask o pega manualmente una dirección nueva.</p>
                </div>

                <div className="wallet-status">
                  <span>Actual</span>
                  <strong>{cortarWallet(user?.wallet)}</strong>
                </div>
              </div>

              <div className="wallet-panel">
                <div className="wallet-info-box">
                  <span>Wallet seleccionada</span>
                  <strong>{cortarWallet(walletSeleccionada || walletManual)}</strong>

                  {user?.wallet && (
                    <a
                      href={`https://sepolia.etherscan.io/address/${user.wallet}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver wallet actual en Etherscan
                    </a>
                  )}
                </div>

                <div className="wallet-input-zone">
                  <label>
                    Nueva wallet
                    <input
                      value={walletManual}
                      onChange={e => {
                        setWalletManual(e.target.value)
                        setWalletSeleccionada(e.target.value)
                      }}
                      placeholder="0x0000000000000000000000000000000000000000"
                    />
                  </label>

                  <div className="config-actions">
                    <button
                      type="button"
                      className="config-btn config-btn--outline"
                      onClick={seleccionarWalletMetaMask}
                      disabled={loadingWallet}
                    >
                      {loadingWallet ? 'Leyendo MetaMask...' : 'Elegir desde MetaMask'}
                    </button>

                    <button
                      type="button"
                      className="config-btn config-btn--primary"
                      onClick={guardarWallet}
                      disabled={loadingWallet}
                    >
                      Guardar wallet
                    </button>

                    <button
                      type="button"
                      className="config-btn config-btn--ghost"
                      onClick={desconectarWallet}
                      disabled={loadingWallet || !user?.wallet}
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="config-card">
              <div className="config-card-head">
                <span className="config-section-pill">Seguridad</span>
                <h2>Cambiar contraseña</h2>
                <p>Al cambiarla, el administrador recibirá una notificación de seguridad.</p>
              </div>

              <form className="config-form" onSubmit={handlePassword}>
                <label>
                  Contraseña actual
                  <input
                    type="password"
                    value={passwordForm.actual}
                    onChange={e => setPasswordForm(f => ({ ...f, actual: e.target.value }))}
                    placeholder="Contraseña actual"
                  />
                </label>

                <label>
                  Nueva contraseña
                  <input
                    type="password"
                    value={passwordForm.nueva}
                    onChange={e => setPasswordForm(f => ({ ...f, nueva: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                  />
                </label>

                <label>
                  Confirmar nueva contraseña
                  <input
                    type="password"
                    value={passwordForm.confirmar}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmar: e.target.value }))}
                    placeholder="Repite la nueva contraseña"
                  />
                </label>

                <button className="config-btn config-btn--primary" disabled={guardandoPassword}>
                  {guardandoPassword ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </section>

            <section className="config-card">
              <div className="config-card-head">
                <span className="config-section-pill">Preferencias</span>
                <h2>Avisos y apariencia</h2>
                <p>Configura si quieres recibir avisos y el tema visual de la aplicación.</p>
              </div>

              <div className="config-switch-row">
                <div>
                  <strong>Producto nuevo en el mercado</strong>
                  <span>Recibirás una notificación cuando se publique un producto nuevo.</span>
                </div>

                <button
                  type="button"
                  className={`config-switch${preferencias.avisos_producto_nuevo ? ' config-switch--on' : ''}`}
                  onClick={() => guardarPreferencias({
                    avisos_producto_nuevo: !preferencias.avisos_producto_nuevo,
                  })}
                  disabled={guardandoPreferencias}
                >
                  <span />
                </button>
              </div>

              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-option${preferencias.tema === 'oscuro' ? ' theme-option--active' : ''}`}
                  onClick={() => guardarPreferencias({ tema: 'oscuro' })}
                  disabled={guardandoPreferencias}
                >
                  <span className="theme-dot theme-dot--dark" />
                  Modo oscuro
                </button>

                <button
                  type="button"
                  className={`theme-option${preferencias.tema === 'claro' ? ' theme-option--active' : ''}`}
                  onClick={() => guardarPreferencias({ tema: 'claro' })}
                  disabled={guardandoPreferencias}
                >
                  <span className="theme-dot theme-dot--light" />
                  Modo claro
                </button>
              </div>
            </section>

            <section className="config-card config-card--wide">
              <div className="config-card-head">
                <span className="config-section-pill">Soporte</span>
                <h2>Reportar incidencia</h2>
                <p>La incidencia se guardará en Firebase y le saltará una notificación al administrador.</p>
              </div>

              <form className="config-form" onSubmit={handleIncidencia}>
                <label>
                  Asunto
                  <input
                    value={incidenciaForm.asunto}
                    onChange={e => setIncidenciaForm(f => ({ ...f, asunto: e.target.value }))}
                    placeholder="Ej: Error al comprar un producto"
                  />
                </label>

                <label>
                  Descripción
                  <textarea
                    rows={5}
                    value={incidenciaForm.descripcion}
                    onChange={e => setIncidenciaForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Explica qué ha pasado, en qué pantalla estabas y qué error salió..."
                  />
                </label>

                <button className="config-btn config-btn--primary" disabled={guardandoIncidencia}>
                  {guardandoIncidencia ? 'Enviando...' : 'Enviar incidencia'}
                </button>
              </form>
            </section>

            <section className="config-card config-card--danger config-card--wide">
              <div className="config-card-head">
                <span className="config-section-pill config-section-pill--danger">Zona peligrosa</span>
                <h2>Darse de baja</h2>
                <p>Tu cuenta quedará desactivada, se guardará el motivo y el administrador recibirá una notificación.</p>
              </div>

              <form className="config-form" onSubmit={handleBaja}>
                <div className="motivos-grid">
                  {MOTIVOS_BAJA.map(motivo => (
                    <button
                      key={motivo}
                      type="button"
                      className={`motivo-chip${bajaForm.motivo === motivo ? ' motivo-chip--active' : ''}`}
                      onClick={() => setBajaForm(f => ({ ...f, motivo }))}
                    >
                      {motivo}
                    </button>
                  ))}
                </div>

                <label>
                  Detalle del motivo
                  <textarea
                    rows={4}
                    value={bajaForm.detalle}
                    onChange={e => setBajaForm(f => ({ ...f, detalle: e.target.value }))}
                    placeholder="Cuéntanos más detalles sobre el motivo de la baja..."
                  />
                </label>

                <label className="config-check">
                  <input
                    type="checkbox"
                    checked={bajaForm.confirmar}
                    onChange={e => setBajaForm(f => ({ ...f, confirmar: e.target.checked }))}
                  />
                  <span>Confirmo que quiero dar de baja mi cuenta</span>
                </label>

                <button className="config-btn config-btn--danger" disabled={guardandoBaja}>
                  {guardandoBaja ? 'Procesando...' : 'Dar de baja mi cuenta'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}