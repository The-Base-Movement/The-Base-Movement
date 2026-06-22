/**
 * VerifiedRoute Component
 * -------------------------------------------------------------
 * Route guard that extends `ProtectedRoute` with a member status check.
 * Only members whose `users.status` is NOT 'Pending' may access the route.
 *
 * Flow:
 * 1. While auth loads → render nothing.
 * 2. Unauthenticated → redirect to /login.
 * 3. Auth resolved, status loading → show `DotLoader` spinner.
 * 4. Status = 'Pending' → show `FullPageState variant="403"` (access denied).
 * 5. Any other status → render the nested `<Outlet />`.
 *
 * Used to gate dashboard pages that require a fully verified membership,
 * such as the membership card and KYC upload pages.
 */

import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { FullPageState, DotLoader } from '@/components/states'

export default function VerifiedRoute() {
  const { session, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('users')
      .select('status')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStatus(data?.status ?? null)
        setStatusLoading(false)
      })
  }, [session?.user?.id])

  if (authLoading) return null
  if (!session) return <Navigate to="/login" replace />
  if (statusLoading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 0',
        }}
      >
        <DotLoader label="Verifying access…" />
      </div>
    )
  if (status === 'Pending')
    return (
      <div style={{ padding: '24px 0', maxWidth: 560, margin: '0 auto' }}>
        <FullPageState variant="403" />
      </div>
    )

  return <Outlet />
}
