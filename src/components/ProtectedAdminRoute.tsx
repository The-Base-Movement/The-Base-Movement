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
const MFA_SETUP_PATH = '/admin/settings'
const MFA_SETUP_TAB = 'security'

export default function ProtectedAdminRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  const [status, setStatus] = useState<GateStatus>(
    sessionStorage.getItem(ADMIN_GATE_KEY) === '1' ? 'allowed' : 'checking'
  )
  const [factorId, setFactorId] = useState(
    sessionStorage.getItem(ADMIN_GATE_KEY) === '1' ? 'bypass' : ''
  )

  useEffect(() => {
    let cancelled = false

    async function checkGate() {
      if (!session) return

      // Already verified during this admin visit — let them through
      if (sessionStorage.getItem(ADMIN_GATE_KEY) === '1') {
        if (!cancelled) {
          setFactorId('bypass')
          setStatus('allowed')
        }
        return
      }

      try {
        const { data: factors, error } = await supabase.auth.mfa.listFactors()
        if (error) throw error
        const totp = factors?.totp?.find((f) => f.status === 'verified')
        if (totp) {
          if (!cancelled) {
            setFactorId(totp.id)
            setStatus('challenge')
          }
        } else {
          if (!cancelled) {
            setFactorId('')
            setStatus('allowed')
          }
        }
      } catch {
        if (!cancelled) {
          setFactorId('')
          setStatus('allowed')
        }
      }
    }

    checkGate()
    return () => {
      cancelled = true
    }
  }, [session, location.pathname])

  if (isLoading) return null

  if (!session) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  if (status === 'checking') return null

  const tab = new URLSearchParams(location.search).get('tab')
  const onSecuritySetupPath = location.pathname === MFA_SETUP_PATH && tab === MFA_SETUP_TAB

  // No verified admin factor enrolled: allow only the security settings setup
  // path; all other admin routes fail closed and redirect into setup.
  if (!factorId) {
    if (onSecuritySetupPath) {
      return <AdminDeviceCapture />
    }
    return <Navigate to={`${MFA_SETUP_PATH}?tab=${MFA_SETUP_TAB}`} replace />
  }

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
