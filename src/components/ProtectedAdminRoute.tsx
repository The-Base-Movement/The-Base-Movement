import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedAdminRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!session) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  return <Outlet />
}
