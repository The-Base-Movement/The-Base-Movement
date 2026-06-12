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
