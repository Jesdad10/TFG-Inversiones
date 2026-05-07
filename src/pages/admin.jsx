import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/admin'
import { authService } from '../services/auth'
import './Admin.css'

const categorias = [
  'Rifles AEG',
  'Pistolas GBB',
  'Sniper',
  'Accesorios',
  'Equipamiento',
  'Piezas',
]

const condiciones = [
  'Nuevo',
  'Como nuevo',
  'Bueno',
  'Aceptable',
]

const ETH_EUR_FALLBACK = 3000

export default function Admin() {
  const navigate = useNavigate()

  const [tab, setTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [ethRateEUR, setEthRateEUR] = useState(ETH_EUR_FALLBACK)
  const [cargandoEth, setCargandoEth] = useState(false)

  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [filtroUsuariosEstado, setFiltroUsuariosEstado] = useState('todos')

  const [busquedaProductos, setBusquedaProductos] = useState('')
  const [filtroProductosEstado, setFiltroProductosEstado] = useState('todos')
  const [filtroProductosCategoria, setFiltroProductosCategoria] = useState('todos')

  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    wallet: '',
    rol: 'usuario',
  })

  const [formProducto, setFormProducto] = useState({
    titulo: '',
    categoria: 'Rifles AEG',
    condicion: 'Nuevo',
    descripcion: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    precioEUR: '',
    imagen: '',
  })

  const precioETHCalculado = formProducto.precioEUR
    ? Number(formProducto.precioEUR) / ethRateEUR
    : 0

  const precioETHFormateado = precioETHCalculado
    ? precioETHCalculado.toFixed(6)
    : '0.000000'

  const cargarPrecioETH = async () => {
    setCargandoEth(true)

    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur'
      )

      const data = await res.json()
      const precio = Number(data?.ethereum?.eur)

      if (precio && precio > 0) {
        setEthRateEUR(precio)
      }
    } catch {
      setEthRateEUR(ETH_EUR_FALLBACK)
    } finally {
      setCargandoEth(false)
    }
  }

  const cargarDatos = async () => {
    setLoading(true)
    setError('')

    try {
      const [u, p] = await Promise.all([
        adminService.listarUsuarios(),
        adminService.listarProductos(),
      ])

      setUsuarios(u)
      setProductos(p)
    } catch (err) {
      setError(err.message || 'Error al cargar el panel admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    cargarPrecioETH()
  }, [])

  const cambiarUsuario = (e) => {
    setFormUsuario({
      ...formUsuario,
      [e.target.name]: e.target.value,
    })
  }

  const cambiarProducto = (e) => {
    setFormProducto({
      ...formProducto,
      [e.target.name]: e.target.value,
    })
  }

  const crearUsuario = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setOk('')

    try {
      await adminService.crearUsuario(formUsuario)

      setFormUsuario({
        nombre: '',
        email: '',
        password: '',
        wallet: '',
        rol: 'usuario',
      })

      setOk('Usuario creado correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al crear usuario')
    } finally {
      setGuardando(false)
    }
  }

  const crearProducto = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setOk('')

    try {
      await adminService.crearProducto({
        ...formProducto,
        precioEUR: Number(formProducto.precioEUR),
        precioETH: Number(precioETHCalculado.toFixed(8)),
        ethRateEUR: Number(ethRateEUR),
      })

      setFormProducto({
        titulo: '',
        categoria: 'Rifles AEG',
        condicion: 'Nuevo',
        descripcion: '',
        marca: '',
        modelo: '',
        numeroSerie: '',
        precioEUR: '',
        imagen: '',
      })

      setOk('Producto creado correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al crear producto')
    } finally {
      setGuardando(false)
    }
  }

  const bajaUsuario = async (id) => {
    if (!window.confirm('¿Seguro que quieres dar de baja este usuario?')) return

    try {
      setError('')
      setOk('')
      await adminService.darBajaUsuario(id)
      setOk('Usuario dado de baja correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al dar de baja el usuario')
    }
  }

  const activarUsuario = async (id) => {
    try {
      setError('')
      setOk('')
      await adminService.activarUsuario(id)
      setOk('Usuario activado correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al activar el usuario')
    }
  }

  const bajaProducto = async (id) => {
    if (!window.confirm('¿Seguro que quieres dar de baja este producto?')) return

    try {
      setError('')
      setOk('')
      await adminService.darBajaProducto(id)
      setOk('Producto dado de baja correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al dar de baja el producto')
    }
  }

  const activarProducto = async (id) => {
    try {
      setError('')
      setOk('')
      await adminService.activarProducto(id)
      setOk('Producto activado correctamente')
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'Error al activar el producto')
    }
  }

  const cerrarSesion = async () => {
    try {
      await authService.logout()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const texto = busquedaUsuarios.trim().toLowerCase()

    return usuarios.filter((u) => {
      const coincideBusqueda =
        !texto ||
        u.nombre?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto) ||
        u.wallet?.toLowerCase().includes(texto)

      const coincideEstado =
        filtroUsuariosEstado === 'todos' ||
        (filtroUsuariosEstado === 'activos' && u.activo) ||
        (filtroUsuariosEstado === 'baja' && !u.activo)

      return coincideBusqueda && coincideEstado
    })
  }, [usuarios, busquedaUsuarios, filtroUsuariosEstado])

  const productosFiltrados = useMemo(() => {
    const texto = busquedaProductos.trim().toLowerCase()

    return productos.filter((p) => {
      const coincideBusqueda =
        !texto ||
        p.titulo?.toLowerCase().includes(texto) ||
        p.marca?.toLowerCase().includes(texto) ||
        p.modelo?.toLowerCase().includes(texto) ||
        p.numeroSerie?.toLowerCase().includes(texto)

      const coincideEstado =
        filtroProductosEstado === 'todos' ||
        (filtroProductosEstado === 'activos' && p.activo) ||
        (filtroProductosEstado === 'baja' && !p.activo)

      const coincideCategoria =
        filtroProductosCategoria === 'todos' ||
        p.categoria === filtroProductosCategoria

      return coincideBusqueda && coincideEstado && coincideCategoria
    })
  }, [
    productos,
    busquedaProductos,
    filtroProductosEstado,
    filtroProductosCategoria,
  ])

  const totalUsuarios = usuarios.length
  const totalAdmins = usuarios.filter((u) => u.rol === 'admin').length
  const totalUsuariosActivos = usuarios.filter((u) => u.activo).length

  const totalProductos = productos.length
  const totalProductosActivos = productos.filter((p) => p.activo).length
  const totalPendienteMint = productos.filter(
    (p) => p.estadoBlockchain === 'pendiente_mint'
  ).length

  return (
    <div className="admin-root">
      <main className="admin-main">
        <section className="admin-hero">
          <div className="admin-hero__inner">
            <div className="admin-hero__top">
              <div>
                <p className="admin-kicker">Panel interno</p>
                <h1>Administración AK-MARKET</h1>
                <p className="admin-subtitle">
                  Gestiona usuarios, productos y el estado blockchain de cada réplica.
                </p>
              </div>

              <div className="admin-hero-actions">
                <button
                  className="admin-btn admin-btn--soft"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir a la web
                </button>

                <button
                  className="admin-btn admin-btn--primary"
                  onClick={cargarDatos}
                >
                  Actualizar datos
                </button>

                <button
                  className="admin-btn admin-btn--danger"
                  onClick={cerrarSesion}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            <div className="admin-stats">
              <article className="stat-card">
                <span className="stat-card__label">Usuarios totales</span>
                <strong className="stat-card__value">{totalUsuarios}</strong>
                <span className="stat-card__meta">
                  {totalUsuariosActivos} activos
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Administradores</span>
                <strong className="stat-card__value">{totalAdmins}</strong>
                <span className="stat-card__meta">
                  Control del panel
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Productos totales</span>
                <strong className="stat-card__value">{totalProductos}</strong>
                <span className="stat-card__meta">
                  {totalProductosActivos} activos
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-card__label">Pendientes de mint</span>
                <strong className="stat-card__value">{totalPendienteMint}</strong>
                <span className="stat-card__meta">
                  Blockchain
                </span>
              </article>
            </div>
          </div>

          <div className="admin-grid-bg" />
          <div className="admin-orb admin-orb--1" />
          <div className="admin-orb admin-orb--2" />
        </section>

        <section className="admin-container">
          <div className="admin-toolbar">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${tab === 'usuarios' ? 'admin-tab--active' : ''}`}
                onClick={() => setTab('usuarios')}
              >
                Usuarios
              </button>

              <button
                className={`admin-tab ${tab === 'productos' ? 'admin-tab--active' : ''}`}
                onClick={() => setTab('productos')}
              >
                Productos
              </button>
            </div>

            <div className="admin-toolbar__info">
              <span>
                Cambio ETH actual:{' '}
                <strong>
                  {cargandoEth
                    ? 'Cargando...'
                    : `1 ETH = ${Number(ethRateEUR).toFixed(2)} €`}
                </strong>
              </span>
            </div>
          </div>

          {error && <p className="admin-msg admin-msg--err">{error}</p>}
          {ok && <p className="admin-msg admin-msg--ok">{ok}</p>}

          {loading ? (
            <div className="admin-loading">
              <span className="admin-spinner" />
              <p>Cargando panel...</p>
            </div>
          ) : (
            <>
              {tab === 'usuarios' && (
                <div className="admin-layout">
                  <section className="admin-card admin-card--form">
                    <div className="admin-card-head admin-card-head--stack">
                      <h2>Crear usuario</h2>
                      <p>Alta manual de nuevos usuarios y administradores.</p>
                    </div>

                    <form className="admin-form" onSubmit={crearUsuario}>
                      <div className="admin-field">
                        <label>Nombre</label>
                        <input
                          name="nombre"
                          value={formUsuario.nombre}
                          onChange={cambiarUsuario}
                          placeholder="Nombre del usuario"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Email</label>
                        <input
                          name="email"
                          type="email"
                          value={formUsuario.email}
                          onChange={cambiarUsuario}
                          placeholder="usuario@email.com"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Contraseña</label>
                        <input
                          name="password"
                          type="password"
                          value={formUsuario.password}
                          onChange={cambiarUsuario}
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Wallet</label>
                        <input
                          name="wallet"
                          value={formUsuario.wallet}
                          onChange={cambiarUsuario}
                          placeholder="0x..."
                        />
                      </div>

                      <div className="admin-field">
                        <label>Rol</label>
                        <select
                          name="rol"
                          value={formUsuario.rol}
                          onChange={cambiarUsuario}
                        >
                          <option value="usuario">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <button className="admin-primary" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Crear usuario'}
                      </button>
                    </form>
                  </section>

                  <section className="admin-card admin-card--wide">
                    <div className="admin-card-head">
                      <div>
                        <h2>Usuarios</h2>
                        <p>{usuariosFiltrados.length} resultados mostrados</p>
                      </div>
                    </div>

                    <div className="admin-filters">
                      <div className="admin-search">
                        <input
                          type="text"
                          placeholder="Buscar por nombre, email o wallet..."
                          value={busquedaUsuarios}
                          onChange={(e) => setBusquedaUsuarios(e.target.value)}
                        />
                      </div>

                      <div className="admin-selects">
                        <select
                          value={filtroUsuariosEstado}
                          onChange={(e) => setFiltroUsuariosEstado(e.target.value)}
                        >
                          <option value="todos">Todos</option>
                          <option value="activos">Solo activos</option>
                          <option value="baja">Solo baja</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Wallet</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>

                        <tbody>
                          {usuariosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="6">
                                <div className="admin-empty">
                                  No hay usuarios con esos filtros.
                                </div>
                              </td>
                            </tr>
                          ) : (
                            usuariosFiltrados.map((u) => (
                              <tr key={u.id} className={!u.activo ? 'row-off' : ''}>
                                <td>{u.nombre}</td>
                                <td>{u.email}</td>
                                <td>
                                  <span className={`badge ${u.rol === 'admin' ? 'badge--admin' : ''}`}>
                                    {u.rol}
                                  </span>
                                </td>
                                <td className="wallet-cell">{u.wallet}</td>
                                <td>
                                  {u.activo ? (
                                    <span className="state state--on">Activo</span>
                                  ) : (
                                    <span className="state state--off">Baja</span>
                                  )}
                                </td>
                                <td>
                                  <div className="table-actions">
                                    {u.activo ? (
                                      <button
                                        className="btn-danger"
                                        onClick={() => bajaUsuario(u.id)}
                                      >
                                        Dar baja
                                      </button>
                                    ) : (
                                      <button
                                        className="btn-soft"
                                        onClick={() => activarUsuario(u.id)}
                                      >
                                        Activar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {tab === 'productos' && (
                <div className="admin-layout">
                  <section className="admin-card admin-card--form">
                    <div className="admin-card-head admin-card-head--stack">
                      <h2>Crear producto</h2>
                      <p>Alta de nuevos productos con conversión automática EUR → ETH.</p>
                    </div>

                    <form className="admin-form" onSubmit={crearProducto}>
                      <div className="admin-field">
                        <label>Título</label>
                        <input
                          name="titulo"
                          value={formProducto.titulo}
                          onChange={cambiarProducto}
                          placeholder="Réplica M4 AEG"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Categoría</label>
                        <select
                          name="categoria"
                          value={formProducto.categoria}
                          onChange={cambiarProducto}
                        >
                          {categorias.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label>Condición</label>
                        <select
                          name="condicion"
                          value={formProducto.condicion}
                          onChange={cambiarProducto}
                        >
                          {condiciones.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="admin-field">
                        <label>Marca</label>
                        <input
                          name="marca"
                          value={formProducto.marca}
                          onChange={cambiarProducto}
                          placeholder="Specna Arms, Tokyo Marui..."
                        />
                      </div>

                      <div className="admin-field">
                        <label>Modelo</label>
                        <input
                          name="modelo"
                          value={formProducto.modelo}
                          onChange={cambiarProducto}
                          placeholder="M4, Glock, Balista..."
                        />
                      </div>

                      <div className="admin-field">
                        <label>Número de serie</label>
                        <input
                          name="numeroSerie"
                          value={formProducto.numeroSerie}
                          onChange={cambiarProducto}
                          placeholder="SER-0001"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Precio EUR</label>
                        <input
                          name="precioEUR"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formProducto.precioEUR}
                          onChange={cambiarProducto}
                          placeholder="150"
                        />
                      </div>

                      <div className="admin-field">
                        <label>Precio ETH calculado</label>
                        <input
                          value={`${precioETHFormateado} ETH`}
                          disabled
                          readOnly
                        />
                      </div>

                      <div className="admin-field">
                        <label>Imagen URL</label>
                        <input
                          name="imagen"
                          value={formProducto.imagen}
                          onChange={cambiarProducto}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="admin-field admin-field--full">
                        <label>Descripción</label>
                        <textarea
                          name="descripcion"
                          value={formProducto.descripcion}
                          onChange={cambiarProducto}
                          placeholder="Descripción del producto..."
                        />
                      </div>

                      <button className="admin-primary" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Crear producto'}
                      </button>
                    </form>
                  </section>

                  <section className="admin-card admin-card--wide">
                    <div className="admin-card-head">
                      <div>
                        <h2>Productos</h2>
                        <p>{productosFiltrados.length} resultados mostrados</p>
                      </div>
                    </div>

                    <div className="admin-filters">
                      <div className="admin-search">
                        <input
                          type="text"
                          placeholder="Buscar por título, marca, modelo o serie..."
                          value={busquedaProductos}
                          onChange={(e) => setBusquedaProductos(e.target.value)}
                        />
                      </div>

                      <div className="admin-selects">
                        <select
                          value={filtroProductosEstado}
                          onChange={(e) => setFiltroProductosEstado(e.target.value)}
                        >
                          <option value="todos">Todos</option>
                          <option value="activos">Solo activos</option>
                          <option value="baja">Solo baja</option>
                        </select>

                        <select
                          value={filtroProductosCategoria}
                          onChange={(e) => setFiltroProductosCategoria(e.target.value)}
                        >
                          <option value="todos">Todas las categorías</option>
                          {categorias.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Condición</th>
                            <th>Precio</th>
                            <th>Dueños</th>
                            <th>Blockchain</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>

                        <tbody>
                          {productosFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan="8">
                                <div className="admin-empty">
                                  No hay productos con esos filtros.
                                </div>
                              </td>
                            </tr>
                          ) : (
                            productosFiltrados.map((p) => (
                              <tr key={p.id} className={!p.activo ? 'row-off' : ''}>
                                <td>
                                  <div className="product-mini">
                                    {p.imagen ? (
                                      <img src={p.imagen} alt={p.titulo} />
                                    ) : (
                                      <div className="product-noimg">AK</div>
                                    )}

                                    <div>
                                      <strong>{p.titulo}</strong>
                                      <span>
                                        {p.marca} {p.modelo}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>{p.categoria}</td>
                                <td>{p.condicion}</td>

                                <td>
                                  <strong>{p.precioEUR}€</strong>
                                  <span className="mini-muted">
                                    {Number(p.precioETH || 0).toFixed(6)} ETH
                                  </span>
                                </td>

                                <td>{p.numPropietarios || 0}</td>

                                <td>
                                  <span className="state state--pending">
                                    {p.estadoBlockchain || 'pendiente_mint'}
                                  </span>
                                </td>

                                <td>
                                  {p.activo ? (
                                    <span className="state state--on">Activo</span>
                                  ) : (
                                    <span className="state state--off">Baja</span>
                                  )}
                                </td>

                                <td>
                                  <div className="table-actions">
                                    {p.activo ? (
                                      <button
                                        className="btn-danger"
                                        onClick={() => bajaProducto(p.id)}
                                      >
                                        Dar baja
                                      </button>
                                    ) : (
                                      <button
                                        className="btn-soft"
                                        onClick={() => activarProducto(p.id)}
                                      >
                                        Activar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}