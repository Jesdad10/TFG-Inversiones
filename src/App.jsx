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

import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/inicio" element={<Inicio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/catalogo" element={<Dashboard />} />

        <Route path="/perfil" element={<Profile />} />
        <Route path="/vender" element={<Vender />} />
        <Route path="/mis-productos" element={<MisProductos />} />
        <Route path="/armeria" element={<Armeria />} />

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

export default App