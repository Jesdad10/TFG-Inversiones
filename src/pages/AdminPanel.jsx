import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { articulosService } from '../services/articulos'
import Navbar from '../components/Navbar'
import { chatService } from '../services/chat'
import './AdminPanel.css'

const ACCION_LABELS = {
  eliminar_usuario: 'Usuario eliminado',
  bloquear_usuario: 'Usuario bloqueado',
  desbloquear_usuario: 'Usuario desbloqueado',
  eliminar_producto: 'Producto eliminado',
  crear_usuario: 'Usuario creado',
  cambiar_rol: 'Rol cambiado',
}

export default function AdminPanel() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [seccion, setSeccion] = useState('resumen')
  const [loading, setLoading] = useState(false)
  const [notificacionesKey, setNotificacionesKey] = useState(0)

  const [stats, setStats] = useState(null)

  const [usuarios, setUsuarios] = useState([])
  const [busqUser, setBusqUser] = useState('')
  const [mostrarEliminados, setMostrarEliminados] = useState(false)
  const [mostrarCrearUsuario, setMostrarCrearUsuario] = useState(false)

  const [articulos, setArticulos] = useState([])
  const [busqArt, setBusqArt] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [modalReactivarProducto, setModalReactivarProducto] = useState(null)
  const [reactivarEditando, setReactivarEditando] = useState(false)

  const [reactivarForm, setReactivarForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    condicion: '',
    precio_eur: '',
    precio_crypto: '',
    crypto: 'ETH',
    foto_principal: '',
  })

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

  const [mensajeAdmin, setMensajeAdmin] = useState(null)

  const [crearForm, setCrearForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'user',
  })

  const [crearStatus, setCrearStatus] = useState(null)
  const [crearMsg, setCrearMsg] = useState('')

  // Chat soporte
  const [chats, setChats] = useState([])
  const [chatSeleccionado, setChatSeleccionado] = useState(null)
  const [chatMensajes, setChatMensajes] = useState([])
  const [chatTexto, setChatTexto] = useState('')
  const [chatEnviando, setChatEnviando] = useState(false)
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0)
  const chatMensajesEndRef = useRef(null)

  const refrescarNotificaciones = () => {
    setNotificacionesKey(prev => prev + 1)
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

      if (payload.rol !== 'admin') {
        navigate('/dashboard')
        return
      }

      setUser({
        id: payload.id,
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

  // Polling de fondo: no leídos totales (funciona en cualquier sección)
  useEffect(() => {
    if (!user) return

    let mounted = true
    const fetchUnread = async () => {
      try {
        const data = await chatService.adminGetUnread()
        if (mounted) setChatUnreadTotal(data.totalUnread || 0)
      } catch {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, [user])

  // Polling: lista de chats cuando el admin está en la sección chat
  useEffect(() => {
    if (seccion !== 'chat' || !user) return

    let mounted = true
    const fetchChats = async () => {
      try {
        const data = await chatService.adminGetChats()
        if (mounted) setChats(data.chats || [])
      } catch {}
    }

    fetchChats()
    const interval = setInterval(fetchChats, 2000)
    return () => { mounted = false; clearInterval(interval) }
  }, [seccion, user])

  // Polling: mensajes del chat seleccionado
  useEffect(() => {
    if (!chatSeleccionado?.id || seccion !== 'chat') return

    let mounted = true
    const fetchMensajes = async () => {
      try {
        const data = await chatService.adminGetMensajes(chatSeleccionado.id)
        if (mounted) setChatMensajes(data.mensajes || [])
      } catch {}
    }

    fetchMensajes()
    const interval = setInterval(fetchMensajes, 2000)
    return () => { mounted = false; clearInterval(interval) }
  }, [chatSeleccionado?.id, seccion])

  // Scroll al final de mensajes del admin
  useEffect(() => {
    chatMensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMensajes])

  const cargarSeccion = async (s) => {
    setLoading(true)

    try {
      if (s === 'chat') return

      if (s === 'resumen') {
        const d = await authService.adminGetStats()
        setStats(d)
        refrescarNotificaciones()
      }

      if (s === 'usuarios') {
        const d = await authService.adminGetUsuarios()
        setUsuarios(d.usuarios || [])
      }

      if (s === 'productos') {
        const d = await authService.adminGetArticulos()
        setArticulos(d.articulos || [])
        refrescarNotificaciones()
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

  const handleSeleccionarChat = async (chat) => {
    setChatSeleccionado(chat)
    setChatMensajes([])
    try {
      const data = await chatService.adminGetMensajes(chat.id)
      setChatMensajes(data.mensajes || [])
      const leidos = chat.unreadAdmin || 0
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadAdmin: 0 } : c))
      if (leidos > 0) setChatUnreadTotal(prev => Math.max(0, prev - leidos))
    } catch {}
  }

  const handleAdminReply = async () => {
    const text = chatTexto.trim()
    if (!text || chatEnviando || !chatSeleccionado) return
    setChatEnviando(true)
    try {
      await chatService.adminReply(chatSeleccionado.id, text)
      setChatTexto('')
      // Resetear altura del textarea
      const ta = document.querySelector('.ap-chat-reply-input')
      if (ta) ta.style.height = 'auto'
      const data = await chatService.adminGetMensajes(chatSeleccionado.id)
      setChatMensajes(data.mensajes || [])
    } catch (err) {
      console.error('Admin reply error:', err)
    } finally {
      setChatEnviando(false)
    }
  }

  const handleCerrarChat = async () => {
    if (!chatSeleccionado) return
    await chatService.adminSetEstado(chatSeleccionado.id, 'closed').catch(() => {})
    setChatSeleccionado(prev => ({ ...prev, status: 'closed' }))
    setChats(prev => prev.map(c => c.id === chatSeleccionado.id ? { ...c, status: 'closed' } : c))
  }

  const handleAbrirChat = async () => {
    if (!chatSeleccionado) return
    await chatService.adminSetEstado(chatSeleccionado.id, 'open').catch(() => {})
    setChatSeleccionado(prev => ({ ...prev, status: 'open' }))
    setChats(prev => prev.map(c => c.id === chatSeleccionado.id ? { ...c, status: 'open' } : c))
  }

  const formatChatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatChatDate = (timestamp) => {
    if (!timestamp) return ''
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const handleBloquear = async () => {
    if (!modalBloquear) return

    try {
      await authService.adminBloquearUsuario(modalBloquear.id, motivoBloqueo)

      setUsuarios(prev => prev.map(u =>
        u.id === modalBloquear.id
          ? { ...u, bloqueado: 1, motivo_bloqueo: motivoBloqueo }
          : u
      ))

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Usuario bloqueado',
        texto: `El usuario "${modalBloquear.nombre}" ha sido bloqueado correctamente.`,
      })

      refrescarNotificaciones()

      setModalBloquear(null)
      setMotivoBloqueo('')
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al bloquear',
        texto: err.message || 'No se ha podido bloquear el usuario.',
      })
    }
  }

  const handleDesbloquear = async (id) => {
    try {
      await authService.adminDesbloquearUsuario(id)

      const usuario = usuarios.find(u => u.id === id)

      setUsuarios(prev => prev.map(u =>
        u.id === id
          ? { ...u, bloqueado: 0, motivo_bloqueo: null }
          : u
      ))

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Usuario desbloqueado',
        texto: `El usuario "${usuario?.nombre || 'Usuario'}" ha sido desbloqueado correctamente.`,
      })

      refrescarNotificaciones()
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al desbloquear',
        texto: err.message || 'No se ha podido desbloquear el usuario.',
      })
    }
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

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Rol actualizado',
        texto: `El rol de "${modalCambiarRol.nombre}" se ha cambiado a "${nuevoRol}".`,
      })

      refrescarNotificaciones()

      setModalCambiarRol(null)
      setPasswordRol('')
    } catch (err) {
      setPasswordRolError(err.message || 'Contraseña incorrecta')
    }
  }

  const handleEliminarUsuario = async () => {
    if (!modalElimUser) return

    try {
      await authService.adminEliminarUsuario(modalElimUser.id)

      setUsuarios(prev => prev.map(u =>
        u.id === modalElimUser.id
          ? { ...u, activo: 0 }
          : u
      ))

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Usuario eliminado',
        texto: `El usuario "${modalElimUser.nombre}" ha sido eliminado correctamente.`,
      })

      refrescarNotificaciones()

      setModalElimUser(null)
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al eliminar usuario',
        texto: err.message || 'No se ha podido eliminar el usuario.',
      })
    }
  }

  const handleEliminarProducto = async () => {
    if (!modalElimProd) return

    try {
      await authService.adminEliminarArticulo(modalElimProd.id, motivoElimProd)

      await authService.crearNotificacion({
        usuario_id: user.id,
        tipo: 'producto_eliminado',
        titulo: 'Producto eliminado',
        mensaje: `Has eliminado el producto "${modalElimProd.titulo}".`,
      }).catch(() => {})

      const claveEliminado = claveProductoMercado(modalElimProd)

      setArticulos(prev => prev.map(a => {
        const mismaClave = claveProductoMercado(a) === claveEliminado

        if (a.id === modalElimProd.id || mismaClave) {
          return {
            ...a,
            estado: 'eliminado',
            eliminado_por_admin: 1,
            motivo_eliminacion: motivoElimProd,
          }
        }

        return a
      }))

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Producto eliminado',
        texto: `El producto "${modalElimProd.titulo}" se ha eliminado correctamente.`,
      })

      refrescarNotificaciones()

      setModalElimProd(null)
      setMotivoElimProd('')
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al eliminar',
        texto: err.message || 'No se ha podido eliminar el producto.',
      })
    }
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault()

    setCrearStatus(null)
    setCrearMsg('')

    try {
      await authService.adminCrearUsuario(crearForm)

      setCrearStatus('ok')
      setCrearMsg('Usuario creado correctamente')

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Usuario creado',
        texto: `El usuario "${crearForm.nombre}" se ha creado correctamente.`,
      })

      setCrearForm({
        nombre: '',
        email: '',
        password: '',
        rol: 'user',
      })

      const d = await authService.adminGetUsuarios()
      setUsuarios(d.usuarios || [])

      refrescarNotificaciones()

      setTimeout(() => {
        setCrearStatus(null)
        setMostrarCrearUsuario(false)
      }, 1200)
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

  const obtenerFotosProducto = (producto) => {
    if (Array.isArray(producto.fotos) && producto.fotos.length > 0) {
      return producto.fotos
    }

    if (producto.foto_principal) {
      return [producto.foto_principal]
    }

    if (producto.foto) {
      return [producto.foto]
    }

    if (producto.imagen) {
      return [producto.imagen]
    }

    return []
  }

  const abrirModalReactivarProducto = (producto) => {
    setModalReactivarProducto(producto)
    setReactivarEditando(false)

    setReactivarForm({
      titulo: producto.titulo || '',
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      condicion: producto.condicion || '',
      precio_eur: producto.precio_eur || '',
      precio_crypto: producto.precio_crypto || '',
      crypto: producto.crypto || 'ETH',
      foto_principal: producto.foto_principal || producto.foto || '',
    })
  }

  const volverAAnadirMismoProducto = async () => {
    if (!modalReactivarProducto) return

    const fotos = obtenerFotosProducto(modalReactivarProducto)

    if (fotos.length === 0) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Falta la foto',
        texto: 'Este producto caducado no tiene foto guardada. Pulsa "Cambiar características" o vuelve a publicarlo desde "+ Crear producto".',
      })
      return
    }

    try {
      await articulosService.crear({
        titulo: modalReactivarProducto.titulo || '',
        descripcion: modalReactivarProducto.descripcion || '',
        categoria: modalReactivarProducto.categoria || '',
        condicion: modalReactivarProducto.condicion || '',
        precio_eur: modalReactivarProducto.precio_eur || '',
        precio_crypto: modalReactivarProducto.precio_crypto || '',
        crypto: modalReactivarProducto.crypto || 'ETH',

        fotos,
        foto_principal: fotos[0],

        usuario_arma_id: modalReactivarProducto.usuario_arma_id || null,
        historial_arma_id: modalReactivarProducto.historial_arma_id || null,
      })

      await authService.crearNotificacion({
        usuario_id: user.id,
        tipo: 'producto_reactivado',
        titulo: 'Producto reactivado',
        mensaje: `Has vuelto a añadir el producto "${modalReactivarProducto.titulo}" al mercado.`,
      }).catch(() => {})

      const d = await authService.adminGetArticulos()
      setArticulos(d.articulos || [])

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Producto añadido',
        texto: `El producto "${modalReactivarProducto.titulo}" se ha vuelto a añadir al mercado.`,
      })

      refrescarNotificaciones()

      setModalReactivarProducto(null)
      setReactivarEditando(false)
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al volver a añadir',
        texto: err.message || 'No se ha podido volver a añadir el producto.',
      })
    }
  }

  const volverAAnadirEditado = async () => {
    if (!modalReactivarProducto) return

    const fotos = obtenerFotosProducto(modalReactivarProducto)

    if (fotos.length === 0) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Falta la foto',
        texto: 'Este producto no tiene foto guardada. Vuelve a publicarlo desde "+ Crear producto" para añadir una foto nueva.',
      })
      return
    }

    try {
      await articulosService.crear({
        ...reactivarForm,

        fotos,
        foto_principal: fotos[0],

        usuario_arma_id: modalReactivarProducto.usuario_arma_id || null,
        historial_arma_id: modalReactivarProducto.historial_arma_id || null,
      })

      await authService.crearNotificacion({
        usuario_id: user.id,
        tipo: 'producto_reactivado',
        titulo: 'Producto reactivado',
        mensaje: `Has vuelto a añadir el producto "${reactivarForm.titulo}" al mercado con cambios.`,
      }).catch(() => {})

      const d = await authService.adminGetArticulos()
      setArticulos(d.articulos || [])

      setMensajeAdmin({
        tipo: 'ok',
        titulo: 'Producto añadido',
        texto: `El producto "${reactivarForm.titulo}" se ha vuelto a añadir al mercado.`,
      })

      refrescarNotificaciones()

      setModalReactivarProducto(null)
      setReactivarEditando(false)
    } catch (err) {
      setMensajeAdmin({
        tipo: 'error',
        titulo: 'Error al volver a añadir',
        texto: err.message || 'No se ha podido volver a añadir el producto.',
      })
    }
  }

  const normalizarClave = (valor) => {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  const claveProductoMercado = (producto) => {
    return [
      normalizarClave(producto.titulo),
      normalizarClave(producto.categoria),
      normalizarClave(producto.condicion),
    ].join('|')
  }

  const quedarseConMasReciente = (lista) => {
    return Object.values(
      lista.reduce((acc, a) => {
        const key = claveProductoMercado(a)

        if (!acc[key]) {
          acc[key] = a
          return acc
        }

        const fechaActual = new Date(a.created_at || a.updated_at || 0).getTime()
        const fechaGuardada = new Date(acc[key].created_at || acc[key].updated_at || 0).getTime()

        if (fechaActual > fechaGuardada) {
          acc[key] = a
        }

        return acc
      }, {})
    )
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

  const articulosActivos = quedarseConMasReciente(
    articulos.filter(a => String(a.estado || '').toLowerCase() === 'activo')
  )

  const clavesProductosActivos = new Set(
    articulos
      .filter(a => String(a.estado || '').toLowerCase() === 'activo')
      .map(a => claveProductoMercado(a))
  )

  const articulosCaducados = quedarseConMasReciente(
    articulos.filter(a => {
      const estado = String(a.estado || '').toLowerCase()
      return estado === 'expirado' || estado === 'caducado'
    })
  )

  const filtrarPorBusquedaProducto = (a) => {
    return (
      String(a.titulo || '').toLowerCase().includes(busqArt.toLowerCase()) ||
      String(a.usuario_nombre || '').toLowerCase().includes(busqArt.toLowerCase()) ||
      String(a.usuario_email || '').toLowerCase().includes(busqArt.toLowerCase()) ||
      String(a.seller || '').toLowerCase().includes(busqArt.toLowerCase())
    )
  }

  const articulosFiltrados = articulosActivos.filter(a => {
    if (!filtrarPorBusquedaProducto(a)) return false

    if (filtroEstado === 'todos') return true
    if (filtroEstado === 'activo') return true

    return false
  })

  const articulosCaducadosFiltrados = articulosCaducados.filter(a => {
    return filtrarPorBusquedaProducto(a)
  })

  const productoYaReactivado = (productoCaducado) => {
    const claveCaducado = claveProductoMercado(productoCaducado)
    return clavesProductosActivos.has(claveCaducado)
  }

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
      <Navbar
        key={notificacionesKey}
        user={user}
        activePage="admin"
        onNavigate={p => navigate(p)}
      />

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

            <button
              className={`ap-chat-btn${seccion === 'chat' ? ' ap-chat-btn--active' : ''}${chatUnreadTotal > 0 && seccion !== 'chat' ? ' ap-chat-btn--alerta' : ''}`}
              title="Chat de soporte con usuarios"
              onClick={() => setSeccion('chat')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Chat soporte
              {chatUnreadTotal > 0 && seccion !== 'chat' && (
                <span className="ap-chat-badge ap-chat-badge--unread">
                  {chatUnreadTotal}
                </span>
              )}
            </button>
          </div>

          <div className="ap-tabs">
            {[
              { id: 'resumen', label: 'Resumen' },
              { id: 'usuarios', label: 'Usuarios' },
              { id: 'productos', label: 'Productos' },
              { id: 'historial-armas', label: 'Historial armas' },
              { id: 'historial', label: 'Administrador histórico' },
              { id: 'chat', label: 'Chat soporte' },
            ].map(t => (
              <button
                key={t.id}
                className={`ap-tab${seccion === t.id ? ' ap-tab--active' : ''}`}
                onClick={() => setSeccion(t.id)}
              >
                {t.label}
                {t.id === 'chat' && chatUnreadTotal > 0 && (
                  <span className="ap-tab-badge">
                    {chatUnreadTotal}
                  </span>
                )}
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

                <button
                  type="button"
                  className="ap-btn ap-btn--primary"
                  onClick={() => setMostrarCrearUsuario(v => !v)}
                >
                  + Crear usuario
                </button>

                <span className="ap-count">{usuariosActivos.length} usuarios activos</span>
              </div>

              {mostrarCrearUsuario && (
                <div className="ap-form-card ap-form-card--inline">
                  <h3>Crear usuario</h3>

                  <form className="ap-form" onSubmit={handleCrearUsuario}>
                    <div className="ap-form-row">
                      <label>
                        Nombre
                        <input
                          value={crearForm.nombre}
                          onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))}
                          placeholder="Nombre del usuario"
                          required
                        />
                      </label>

                      <label>
                        Email
                        <input
                          type="email"
                          value={crearForm.email}
                          onChange={e => setCrearForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="correo@email.com"
                          required
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
                          minLength={8}
                          required
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

                      <button
                        type="button"
                        className="ap-btn ap-btn--outline"
                        onClick={() => setMostrarCrearUsuario(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

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
                </select>

                <button
                  type="button"
                  className="ap-btn ap-btn--primary"
                  onClick={() => navigate('/vender')}
                >
                  + Crear producto
                </button>

                <span className="ap-count">{articulosFiltrados.length} productos</span>
              </div>

              {loading ? (
                <div className="ap-spinner" />
              ) : (
                <>
                  <div className="ap-table-wrap">
                    <table className="ap-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Vendedor</th>
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
                                {(a.foto || a.foto_principal) && (
                                  <img
                                    className="ap-prod-img"
                                    src={a.foto || a.foto_principal}
                                    alt={a.titulo}
                                  />
                                )}

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
                              <p className="ap-user-name">{a.usuario_nombre || a.seller || 'Usuario'}</p>
                              <p className="ap-user-email">{a.usuario_email || ''}</p>
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
                      <p className="ap-empty">No hay productos en el mercado que coincidan con la búsqueda.</p>
                    )}
                  </div>

                  <div className="ap-expired-products">
                    <div className="ap-expired-head">
                      <h3>Productos caducados</h3>
                      <span className="ap-count">{articulosCaducadosFiltrados.length} caducados</span>
                    </div>

                    <div className="ap-table-wrap">
                      <table className="ap-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Vendedor</th>
                            <th>Precio</th>
                            <th>Dueños</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>

                        <tbody>
                          {articulosCaducadosFiltrados.map(a => (
                            <tr key={a.id}>
                              <td>
                                <div className="ap-prod-cell">
                                  {(a.foto || a.foto_principal) && (
                                    <img
                                      className="ap-prod-img"
                                      src={a.foto || a.foto_principal}
                                      alt={a.titulo}
                                    />
                                  )}

                                  <div>
                                    <p className="ap-prod-title">{a.titulo}</p>
                                    <p className="ap-prod-cat">{a.categoria}</p>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <p className="ap-user-name">{a.usuario_nombre || a.seller || 'Usuario'}</p>
                                <p className="ap-user-email">{a.usuario_email || ''}</p>
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
                                <span className={`ap-badge ap-badge--${a.estado}`}>
                                  {a.estado}
                                </span>
                              </td>

                              <td>
                                <div className="ap-actions">
                                  {productoYaReactivado(a) ? (
                                    <span className="ap-badge ap-badge--activo">
                                      Ya añadido
                                    </span>
                                  ) : (
                                    <button
                                      className="ap-btn ap-btn--primary"
                                      onClick={() => abrirModalReactivarProducto(a)}
                                    >
                                      Volver a añadir
                                    </button>
                                  )}

                                  <button
                                    className="ap-btn ap-btn--danger"
                                    onClick={() => {
                                      setModalElimProd(a)
                                      setMotivoElimProd('')
                                    }}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {articulosCaducadosFiltrados.length === 0 && (
                        <p className="ap-empty">No hay productos caducados.</p>
                      )}
                    </div>
                  </div>
                </>
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

          {seccion === 'chat' && (
            <div className="ap-section">
              <div className="ap-chat-panel">
                {/* Lista de conversaciones */}
                <div className="ap-chat-list">
                  <div className="ap-chat-list-header">
                    Conversaciones
                    <span className="ap-chat-list-count">{chats.length}</span>
                  </div>

                  {chats.length === 0 ? (
                    <div className="ap-chat-list-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#5A4545', marginBottom: 8 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>Aún no hay conversaciones</p>
                    </div>
                  ) : (
                    chats.map(chat => (
                      <div
                        key={chat.id}
                        className={`ap-chat-item${chatSeleccionado?.id === chat.id ? ' ap-chat-item--active' : ''}`}
                        onClick={() => handleSeleccionarChat(chat)}
                      >
                        <div className="ap-chat-item-top">
                          <p className="ap-chat-item-name">{chat.userName || 'Usuario'}</p>
                          {(chat.unreadAdmin || 0) > 0 && (
                            <span className="ap-chat-unread">{chat.unreadAdmin}</span>
                          )}
                        </div>
                        <p className="ap-chat-item-email">{chat.userEmail || ''}</p>
                        <p className="ap-chat-item-preview">{chat.lastMessage || '—'}</p>
                        <div className="ap-chat-item-meta">
                          <span className="ap-chat-item-time">{formatChatDate(chat.lastMessageAt)}</span>
                          <span className={chat.status === 'closed' ? 'ap-chat-status-closed' : 'ap-chat-status-open'}>
                            {chat.status === 'closed' ? 'Cerrado' : 'Abierto'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Conversación seleccionada */}
                <div className="ap-chat-conv">
                  {!chatSeleccionado ? (
                    <div className="ap-chat-empty-state">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>Selecciona una conversación</p>
                    </div>
                  ) : (
                    <>
                      <div className="ap-chat-conv-header">
                        <div>
                          <p className="ap-chat-conv-user">{chatSeleccionado.userName}</p>
                          <p className="ap-chat-conv-email">{chatSeleccionado.userEmail}</p>
                        </div>
                        <div className="ap-chat-conv-actions">
                          {chatSeleccionado.status === 'closed' ? (
                            <button className="ap-btn ap-btn--outline" onClick={handleAbrirChat}>
                              Reabrir
                            </button>
                          ) : (
                            <button className="ap-btn ap-btn--danger" onClick={handleCerrarChat}>
                              Cerrar chat
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="ap-chat-msgs">
                        {chatMensajes.length === 0 && (
                          <div className="ap-chat-empty-state" style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, color: '#5A4545' }}>No hay mensajes todavía</p>
                          </div>
                        )}

                        {chatMensajes.map(msg => (
                          <div
                            key={msg.id}
                            className={`ap-chat-bubble${msg.senderRole === 'admin' ? ' ap-chat-bubble--admin' : ''}`}
                          >
                            <div className="ap-chat-bubble-avatar">
                              {msg.senderRole === 'admin' ? 'A' : (chatSeleccionado.userName?.[0]?.toUpperCase() || 'U')}
                            </div>
                            <div className="ap-chat-bubble-text">
                              <p>{msg.text}</p>
                              <span className="ap-chat-bubble-time">{formatChatTime(msg.timestamp)}</span>
                            </div>
                          </div>
                        ))}

                        <div ref={chatMensajesEndRef} />
                      </div>

                      {chatSeleccionado.status === 'closed' ? (
                        <div className="ap-chat-closed-bar">
                          Chat cerrado — pulsa "Reabrir" para responder
                        </div>
                      ) : (
                        <div className="ap-chat-reply">
                          <textarea
                            className="ap-chat-reply-input"
                            placeholder="Escribe una respuesta..."
                            value={chatTexto}
                            onChange={e => {
                              setChatTexto(e.target.value)
                              const el = e.target
                              el.style.height = 'auto'
                              el.style.height = Math.min(el.scrollHeight, 80) + 'px'
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleAdminReply()
                              }
                            }}
                            rows={1}
                            disabled={chatEnviando}
                          />
                          <button
                            className="ap-btn ap-btn--primary"
                            onClick={handleAdminReply}
                            disabled={chatEnviando || !chatTexto.trim()}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                            Enviar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
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

      {modalReactivarProducto && (
        <div className="ap-modal-backdrop">
          <div className="ap-modal ap-modal--wide">
            <h3>Volver a añadir producto</h3>

            <p>
              ¿Quieres volver a añadir <strong>{modalReactivarProducto.titulo}</strong> al mercado?
            </p>

            {!reactivarEditando ? (
              <>
                <p className="ap-user-email">
                  Puedes publicarlo con las mismas características o cambiarlas antes.
                </p>

                <div className="ap-modal-actions">
                  <button
                    className="ap-btn ap-btn--outline"
                    onClick={() => setModalReactivarProducto(null)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="ap-btn ap-btn--outline"
                    onClick={() => setReactivarEditando(true)}
                  >
                    Cambiar características
                  </button>

                  <button
                    className="ap-btn ap-btn--primary"
                    onClick={volverAAnadirMismoProducto}
                  >
                    Mismas características
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="ap-form">
                  <div className="ap-form-row">
                    <label>
                      Título
                      <input
                        value={reactivarForm.titulo}
                        onChange={e => setReactivarForm(f => ({ ...f, titulo: e.target.value }))}
                      />
                    </label>

                    <label>
                      Categoría
                      <input
                        value={reactivarForm.categoria}
                        onChange={e => setReactivarForm(f => ({ ...f, categoria: e.target.value }))}
                      />
                    </label>
                  </div>

                  <div className="ap-form-row">
                    <label>
                      Condición
                      <input
                        value={reactivarForm.condicion}
                        onChange={e => setReactivarForm(f => ({ ...f, condicion: e.target.value }))}
                      />
                    </label>

                    <label>
                      Crypto
                      <select
                        value={reactivarForm.crypto}
                        onChange={e => setReactivarForm(f => ({ ...f, crypto: e.target.value }))}
                      >
                        <option value="ETH">ETH</option>
                      </select>
                    </label>
                  </div>

                  <div className="ap-form-row">
                    <label>
                      Precio EUR
                      <input
                        type="number"
                        value={reactivarForm.precio_eur}
                        onChange={e => setReactivarForm(f => ({ ...f, precio_eur: e.target.value }))}
                      />
                    </label>

                    <label>
                      Precio ETH
                      <input
                        type="number"
                        step="0.000001"
                        value={reactivarForm.precio_crypto}
                        onChange={e => setReactivarForm(f => ({ ...f, precio_crypto: e.target.value }))}
                      />
                    </label>
                  </div>

                  <label className="ap-form-field ap-form-field--full">
                    <span>Descripción</span>

                    <textarea
                      rows={5}
                      value={reactivarForm.descripcion}
                      onChange={e => setReactivarForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Descripción del producto..."
                    />
                  </label>
                </div>

                <div className="ap-modal-actions">
                  <button
                    className="ap-btn ap-btn--outline"
                    onClick={() => setReactivarEditando(false)}
                  >
                    Volver
                  </button>

                  <button
                    className="ap-btn ap-btn--outline"
                    onClick={() => setModalReactivarProducto(null)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="ap-btn ap-btn--primary"
                    onClick={volverAAnadirEditado}
                  >
                    Publicar cambiado
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mensajeAdmin && (
        <div className="ap-modal-backdrop">
          <div className="ap-modal">
            <div className="ap-modal-icon">
              {mensajeAdmin.tipo === 'ok' ? (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#CC1F1F" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>

            <h3>{mensajeAdmin.titulo}</h3>
            <p>{mensajeAdmin.texto}</p>

            <div className="ap-modal-actions">
              <button
                className="ap-btn ap-btn--primary"
                onClick={() => setMensajeAdmin(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
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