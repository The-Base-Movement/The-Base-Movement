import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const NAG_INTERVAL_MS = 5 * 60 * 1000 // re-prompt every 5 minutes until enrolled

/**
 * Caution popup shown to any admin who has not enrolled a 2FA (TOTP) factor.
 * Dismissing it only buys 5 minutes — it keeps re-appearing until they set up
 * two-factor authentication in Admin Settings → Security.
 */
export function MfaSetupNag() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Suppress the popup while they're on the settings page actually enrolling
  const onSettingsPage = location.pathname === '/admin/settings'
  const onSettingsPageRef = useRef(onSettingsPage)
  onSettingsPageRef.current = onSettingsPage

  const isEnrolled = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      return (data?.totp ?? []).some((f) => f.status === 'verified')
    } catch {
      // Can't confirm either way — don't nag on a transient API error
      return true
    }
  }, [])

  const scheduleRecheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (await isEnrolled()) return
      if (onSettingsPageRef.current) {
        scheduleRecheck() // they're (hopefully) enrolling — check again later
        return
      }
      setVisible(true)
    }, NAG_INTERVAL_MS)
  }, [isEnrolled])

  useEffect(() => {
    let cancelled = false
    if (!session) return
    ;(async () => {
      if (await isEnrolled()) return
      if (cancelled) return
      if (onSettingsPageRef.current) {
        scheduleRecheck()
        return
      }
      setVisible(true)
    })()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [session, isEnrolled, scheduleRecheck])

  const remindLater = () => {
    setVisible(false)
    scheduleRecheck()
  }

  const goToSettings = () => {
    setVisible(false)
    scheduleRecheck() // if they bail without enrolling, the nag returns
    navigate('/admin/settings?tab=security')
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          borderTop: '4px solid hsl(var(--accent))',
          padding: '28px 26px',
          boxSizing: 'border-box',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 30, color: 'hsl(var(--accent))', flexShrink: 0 }}
          >
            gpp_maybe
          </span>
          <div>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
                margin: '0 0 6px',
              }}
            >
              Secure your admin account
            </h2>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12.5,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Your account has admin privileges but two-factor authentication is not set up. Without
              2FA, anyone with your password can reach the Command Center. Please activate it now in{' '}
              <strong>Settings → Security</strong>. This reminder will keep appearing until 2FA is
              enabled.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={goToSettings}
            className="btn btn-primary"
            style={{ flex: 1, height: 40, fontSize: 12.5 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6 }}>
              shield_lock
            </span>
            Set up 2FA now
          </button>
          <button
            onClick={remindLater}
            className="btn btn-outline"
            style={{ height: 40, fontSize: 12.5, padding: '0 16px' }}
          >
            Remind me in 5 min
          </button>
        </div>
      </div>
    </div>
  )
}
