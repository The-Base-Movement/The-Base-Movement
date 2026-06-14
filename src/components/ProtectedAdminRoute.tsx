import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import AdminTwoFactorGate from '@/components/AdminTwoFactorGate'
import AdminDeviceCapture from '@/components/AdminDeviceCapture'

/**
 * Session flag set after a successful 2FA verification when entering /admin/*.
 * DashboardLayout (member side) removes it, so crossing member → admin always
 * re-prompts, while navigation within the admin panel stays free.
 */
export const ADMIN_GATE_KEY = 'admin_gate_verified'

type GateStatus = 'checking' | 'allowed' | 'challenge'

export default function ProtectedAdminRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  const [status, setStatus] = useState<GateStatus>('checking')
  const [factorId, setFactorId] = useState('')

  useEffect(() => {
    let cancelled = false

    async function checkGate() {
      if (!session) return

      // Already verified during this admin visit — let them through
      if (sessionStorage.getItem(ADMIN_GATE_KEY) === '1') {
        if (!cancelled) setStatus('allowed')
        return
      }

      try {
        const { data: factors, error } = await supabase.auth.mfa.listFactors()
        if (error) throw error
        const totp = factors?.totp?.find((f) => f.status === 'verified') ?? factors?.totp?.[0]
        if (totp) {
          if (!cancelled) {
            setFactorId(totp.id)
            setStatus('challenge')
          }
        } else {
          // No 2FA enrolled — same behavior as admin login (no lockout)
          if (!cancelled) setStatus('allowed')
        }
      } catch {
        // Factor lookup failed — fail open to match previous behavior rather
        // than locking every admin out on a transient auth API error
        if (!cancelled) setStatus('allowed')
      }
    }

    checkGate()
    return () => {
      cancelled = true
    }
  }, [session])

  if (isLoading) return null

  if (!session) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  if (status === 'checking') return null

  if (status === 'challenge') {
    return (
      <AdminTwoFactorGate
        factorId={factorId}
        onVerified={() => {
          sessionStorage.setItem(ADMIN_GATE_KEY, '1')
          setStatus('allowed')
        }}
      />
    )
  }

  // Device-binding capture for tracked roles runs inside this wrapper, which
  // renders the admin <Outlet /> once done (non-blocking / fail-open).
  return <AdminDeviceCapture />
}
