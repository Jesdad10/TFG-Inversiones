import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Vender from './pages/Vender'
import MisProductos from './pages/MisProductos'
import AdminPanel from './pages/AdminPanel'
import Armeria from './pages/Armeria'
import Inicio from './pages/Inicio'
import Configuracion from './pages/Configuracion'

import AdminRoute from './components/AdminRoute'
import { authService } from './services/auth'

function aplicarTema(tema) {
  const finalTheme = tema === 'claro' ? 'claro' : 'oscuro'
  document.documentElement.setAttribute('data-theme', finalTheme)
  localStorage.setItem('tema', finalTheme)
}

function ThemeBootstrap() {
  useEffect(() => {
    const temaLocal = localStorage.getItem('tema') || 'oscuro'
    aplicarTema(temaLocal)

    const token = localStorage.getItem('token')
    if (!token) return

    authService.me()
      .then((data) => {
        if (data?.usuario?.tema) {
          aplicarTema(data.usuario.tema)
        }
      })
      .catch(() => {})
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeBootstrap />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/inicio" element={<Inicio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/catalogo" element={<Dashboard />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/vender" element={<Vender />} />
        <Route path="/armeria" element={<Armeria />} />
        <Route path="/configuracion" element={<Configuracion />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}