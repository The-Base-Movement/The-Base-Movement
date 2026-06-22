/**
 * ProtectedRoute Component
 * -------------------------------------------------------------
 * Basic authentication guard for the member dashboard (`/dashboard/*`).
 * While auth is loading: renders nothing (prevents flash).
 * Unauthenticated: redirects to /login, preserving the attempted path in
 * `location.state.from` so the login page can redirect back after sign-in.
 * Authenticated: renders the nested `<Outlet />`.
 *
 * For KYC-verified-only routes, use `VerifiedRoute` instead.
 * For admin routes, use `ProtectedAdminRoute` instead.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
