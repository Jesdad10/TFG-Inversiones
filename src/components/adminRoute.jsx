import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '../services/auth'

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [permitido, setPermitido] = useState(false)

  useEffect(() => {
    const comprobarAdmin = async () => {
      try {
        const data = await authService.me()

        if (data?.usuario?.rol === 'admin') {
          setPermitido(true)
        } else {
          setPermitido(false)
        }
      } catch {
        setPermitido(false)
      } finally {
        setLoading(false)
      }
    }

    comprobarAdmin()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080808',
          color: '#EDE8E8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
        }}
      >
        Comprobando permisos...
      </div>
    )
  }

  if (!permitido) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}