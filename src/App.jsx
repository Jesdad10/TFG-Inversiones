import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Vender from './pages/Vender'
import MisProductos from './pages/MisProductos'
<<<<<<< HEAD
import AdminPanel from './pages/AdminPanel'
import Armeria from './pages/Armeria'
=======
import Admin from './pages/Admin'

import AdminRoute from './components/AdminRoute'
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<<<<<<< HEAD
=======

>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/vender" element={<Vender />} />
        <Route path="/mis-productos" element={<MisProductos />} />
<<<<<<< HEAD
        <Route path="/armeria" element={<Armeria />} />
        <Route path="/admin" element={<AdminPanel />} />
=======

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App