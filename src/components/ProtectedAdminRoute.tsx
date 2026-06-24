/**
 * ProtectedAdminRoute Component
 * -------------------------------------------------------------
 * Route guard for all `/admin/*` pages. Implements a three-phase security gate:
 *
 * 1. Auth check: unauthenticated users are redirected to /admin-login.
 * 2. MFA check (via Supabase `mfa.getAuthenticatorAssuranceLevel` and
 *    `mfa.listFactors`):
 *    - No TOTP factor enrolled → redirect to security settings setup, UNLESS
 *      the current path is already the security setup page.
 *    - TOTP enrolled but AAL < aal2 → render `AdminTwoFactorGate` challenge.
 *    - TOTP enrolled and AAL = aal2 → allow.
 *    - No factor enrolled → allow (MFA is optional until Phase 2 enforcement).
 * 3. Device capture: `AdminDeviceCapture` wraps the admin `<Outlet />` to
 *    register the device for tracked roles (fail-open, non-blocking).
 *
 * The `ADMIN_GATE_KEY` session flag is set after a successful 2FA challenge
 * so that navigating within /admin doesn't re-prompt, but crossing from
 * member → admin always does (DashboardLayout clears the flag on unmount).
 */

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
  const [status, setStatus] = useState<GateStatus>('checking')
  const [factorId, setFactorId] = useState('')
  const [errorState, setErrorState] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkGate() {
      if (!session) return

      try {
        // Query the server-authoritative AAL and enrolled factors
        const [aalRes, factorsRes] = await Promise.all([
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ])

        if (aalRes.error) throw aalRes.error
        if (factorsRes.error) throw factorsRes.error

        const aal = aalRes.data
        const factors = factorsRes.data

        const totp = factors?.totp?.find((f) => f.status === 'verified')

        if (totp) {
          const gateFlag = sessionStorage.getItem(ADMIN_GATE_KEY)

          if (aal?.currentLevel === 'aal2' && gateFlag) {
            // MFA completed and gate flag present — allow through
            if (!cancelled) {
              setFactorId(totp.id)
              setStatus('allowed')
            }
          } else {
            // Either AAL < aal2 or gate flag was cleared (member → admin switch)
            // Force a re-challenge
            if (!cancelled) {
              setFactorId(totp.id)
              setStatus('challenge')
            }
          }
        } else {
          // No MFA enrolled yet
          if (!cancelled) {
            setFactorId('')
            setStatus('allowed')
          }
        }
      } catch (err) {
        console.error('[MFA Gate] verification error:', err)
        if (!cancelled) {
          setErrorState('Security gate verification failed. Please sign in again.')
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
    sessionStorage.removeItem(ADMIN_GATE_KEY)
    sessionStorage.removeItem('admin_gate_passed')
    return <Navigate to="/command" state={{ from: location }} replace />
  }

  if (errorState) {
    sessionStorage.removeItem(ADMIN_GATE_KEY)
    sessionStorage.removeItem('admin_gate_passed')
    return <Navigate to="/command" state={{ error: errorState }} replace />
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
