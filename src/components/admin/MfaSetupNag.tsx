import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const NAG_INTERVAL_MS = 5 * 60 * 1000 // re-prompt every 5 minutes until enrolled

// The installed supabase-js types don't surface the MFA helpers here, so we
// narrow to just the calls we use (mirrors the cast in admin/Settings.tsx).
interface SupabaseAuthWithMFA {
  mfa: {
    listFactors: () => Promise<{
      data: { totp?: { status: string }[] } | null
      error: AuthError | null
    }>
    enroll: (params: {
      factorType: 'totp'
    }) => Promise<{ data: { id: string; totp: { qr_code: string } }; error: AuthError | null }>
    challenge: (params: {
      factorId: string
    }) => Promise<{ data: { id: string }; error: AuthError | null }>
    verify: (params: {
      factorId: string
      challengeId: string
      code: string
    }) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>
  }
}

const mfaAuth = () => supabase.auth as unknown as SupabaseAuthWithMFA

type Step = 'intro' | 'qr' | 'verify'

/**
 * Caution popup shown to any admin who has not enrolled a 2FA (TOTP) factor.
 * The whole enrollment (QR + code verification) runs inline here — clicking
 * "Set up 2FA now" starts it immediately, and a successful verify enables 2FA
 * and dismisses the popup so the admin proceeds. Skipping only buys 5 minutes;
 * the reminder keeps re-appearing until a verified factor exists.
 */
export function MfaSetupNag() {
  const { session } = useAuth()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<Step>('intro')
  const [enrollData, setEnrollData] = useState<{ id: string; qr: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Suppress the popup while they're on the settings page actually enrolling.
  // Kept in a ref (updated in an effect) so the timer callback reads the latest
  // value without re-creating the schedule.
  const onSettingsPage = location.pathname === '/admin/settings'
  const onSettingsPageRef = useRef(onSettingsPage)
  useEffect(() => {
    onSettingsPageRef.current = onSettingsPage
  }, [onSettingsPage])

  const isEnrolled = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await mfaAuth().mfa.listFactors()
      if (error) throw error
      return (data?.totp ?? []).some((f) => f.status === 'verified')
    } catch {
      // Can't confirm either way — don't nag on a transient API error
      return true
    }
  }, [])

  // Holds the latest scheduleRecheck so the timer can re-arm itself without the
  // callback referencing its own (not-yet-declared) identity.
  const scheduleRecheckRef = useRef<() => void>(() => {})

  const scheduleRecheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (await isEnrolled()) return
      if (onSettingsPageRef.current) {
        scheduleRecheckRef.current() // they're (hopefully) enrolling — check again later
        return
      }
      setVisible(true)
    }, NAG_INTERVAL_MS)
  }, [isEnrolled])

  useEffect(() => {
    scheduleRecheckRef.current = scheduleRecheck
  }, [scheduleRecheck])

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

  // Reset the inline flow whenever the popup is dismissed.
  const close = () => {
    setVisible(false)
    setStep('intro')
    setEnrollData(null)
    setCode('')
  }

  const remindLater = () => {
    close()
    scheduleRecheck()
  }

  // "Set up 2FA now" — begin enrollment immediately, inline.
  const handleActivate = async () => {
    setBusy(true)
    try {
      const { data, error } = await mfaAuth().mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setEnrollData({ id: data.id, qr: data.totp.qr_code })
      setCode('')
      setStep('qr')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start 2FA enrollment')
    } finally {
      setBusy(false)
    }
  }

  // Verify the 6-digit code, enable the factor, then proceed.
  const handleVerify = async () => {
    if (!enrollData || code.length < 6) return
    setBusy(true)
    try {
      const auth = mfaAuth()
      const challenge = await auth.mfa.challenge({ factorId: enrollData.id })
      if (challenge.error) throw challenge.error
      const verify = await auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challenge.data.id,
        code,
      })
      if (verify.error) throw verify.error
      toast.success('Two-factor authentication enabled')
      if (timerRef.current) clearTimeout(timerRef.current)
      close() // 2FA active — dismiss and let the admin continue
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '2FA verification failed')
    } finally {
      setBusy(false)
    }
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
        {/* ── Intro ─────────────────────────────── */}
        {step === 'intro' && (
          <>
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
                  Your account has admin privileges but two-factor authentication is not set up.
                  Without 2FA, anyone with your password can reach the Command Center. Activating
                  takes about a minute — keep your authenticator app handy.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={handleActivate}
                disabled={busy}
                className="btn btn-primary"
                style={{ flex: 1, height: 40, fontSize: 12.5 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, marginRight: 6 }}
                >
                  shield_lock
                </span>
                {busy ? 'Starting…' : 'Set up 2FA now'}
              </button>
              <button
                onClick={remindLater}
                disabled={busy}
                className="btn btn-outline"
                style={{ height: 40, fontSize: 12.5, padding: '0 16px' }}
              >
                Remind me in 5 min
              </button>
            </div>
          </>
        )}

        {/* ── Step 1: scan QR ───────────────────── */}
        {step === 'qr' && enrollData && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                alignSelf: 'flex-start',
              }}
            >
              Scan this QR code
            </h2>
            <div
              style={{
                padding: 16,
                background: 'hsl(var(--container-low))',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <img
                src={enrollData.qr}
                alt="2FA QR code"
                style={{ width: 192, height: 192, display: 'block' }}
                decoding="async"
              />
            </div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'center',
              }}
            >
              Use Google Authenticator, Authy, or any TOTP app, then continue.
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                className="btn btn-outline"
                style={{ height: 40, fontSize: 12.5, padding: '0 16px' }}
                onClick={remindLater}
                disabled={busy}
              >
                Later
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, height: 40, fontSize: 12.5, justifyContent: 'center' }}
                onClick={() => setStep('verify')}
              >
                I&apos;ve scanned it, continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: verify code ───────────────── */}
        {step === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Enter verification code
            </h2>
            <input
              name="mfaCode"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000 000"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              style={{
                width: '100%',
                height: 52,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 22,
                textAlign: 'center',
                letterSpacing: '0.4em',
                borderRadius: 'var(--radius-sm)',
                color: 'hsl(var(--on-surface))',
                boxSizing: 'border-box',
              }}
            />
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Enter the 6-digit code from your authenticator app.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', height: 40, fontSize: 12.5, justifyContent: 'center' }}
              onClick={handleVerify}
              disabled={busy || code.length < 6}
            >
              {busy ? 'Verifying…' : 'Verify and enable 2FA'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setStep('qr')}
                disabled={busy}
              >
                Back to QR code
              </button>
              <button className="btn btn-ghost btn-sm" onClick={remindLater} disabled={busy}>
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
