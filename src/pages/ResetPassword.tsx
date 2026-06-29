import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

/**
 * Supabase Auth returns a raw character-set dump when the password policy
 * isn't met (e.g. "Password should contain at least one character of each:
 * abcdefg..."). We detect that and swap it for a readable message.
 */
function sanitiseAuthError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : ''
  if (
    msg.toLowerCase().includes('password should contain') ||
    msg.toLowerCase().includes('password must contain') ||
    msg.toLowerCase().includes('abcdefghijklmnopqrstuvwxyz')
  ) {
    return 'Password must include uppercase and lowercase letters, a number, and a special character (e.g. !@#$%).'
  }
  return msg || fallback
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  padding: '0 16px',
  fontSize: 14,
  fontWeight: 'var(--font-weight-medium, 500)',
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}

type PageState = 'loading' | 'mfa' | 'ready' | 'success' | 'invalid' | 'verify_click'

export default function ResetPassword() {
  const { settings } = useBranding()
  const navigate = useNavigate()

  // Parse URL query parameters
  const params = new URLSearchParams(window.location.search)
  const queryEmail = params.get('email') || ''
  const queryToken = params.get('token') || ''
  const queryError = params.get('error') || ''
  const queryErrorDesc = params.get('error_description') || ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  // MFA step-up: accounts with TOTP enabled must reach AAL2 before the password
  // can be changed, so we prompt for the authenticator code first.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false)
  const [isVerifyingLink, setIsVerifyingLink] = useState(false)

  const isMounted = useRef(true)

  // Once a recovery session exists, decide whether we still need an MFA
  // step-up (AAL2) before allowing the password change.
  const prepare = async () => {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        const totp = factors?.totp?.find((f) => f.status === 'verified') ?? factors?.totp?.[0]
        if (totp?.id) {
          if (isMounted.current) {
            setMfaFactorId(totp.id)
            setPageState('mfa')
          }
          return
        }
      }
    } catch {
      // If the AAL/factor lookup fails, fall through and let updateUser surface
      // any real problem.
    }
    if (isMounted.current) {
      setPageState('ready')
    }
  }

  // Handle the verification link OTP click (prevents prefetchers from consuming it)
  const handleVerifyLink = async () => {
    if (!queryEmail || !queryToken) return
    setIsVerifyingLink(true)
    setPageState('loading')
    try {
      console.warn('[reset-password] Manually verifying custom link OTP...', { email: queryEmail })
      const { data, error } = await supabase.auth.verifyOtp({
        email: queryEmail,
        token: queryToken,
        type: 'recovery',
      })
      if (error) throw error
      if (data.session) {
        await prepare()
      } else {
        if (isMounted.current) setPageState('invalid')
      }
    } catch (err: unknown) {
      console.error('[verifyOtp error]', err)
      toast.error(err instanceof Error ? err.message : 'Invalid link or OTP.')
      if (isMounted.current) setPageState('invalid')
    } finally {
      if (isMounted.current) setIsVerifyingLink(false)
    }
  }

  useEffect(() => {
    isMounted.current = true
    let timeout: ReturnType<typeof setTimeout> | null = null

    // Supabase fires PASSWORD_RECOVERY when the user clicks the email reset link.
    // The URL fragment contains the access_token which Supabase auto-exchanges.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        void prepare()
      }
    })

    const verifyAndPrepare = async () => {
      if (queryError) {
        console.warn('[reset-password] Error query param detected:', queryError, queryErrorDesc)
        if (isMounted.current) setPageState('invalid')
        return
      }

      // Check current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // If queryEmail is present, make sure it matches the current session user.
        // Otherwise, sign out the mismatched user first.
        if (queryEmail && session.user?.email?.toLowerCase() !== queryEmail.toLowerCase()) {
          console.warn('[reset-password] Session email mismatch. Signing out old session.')
          await supabase.auth.signOut({ scope: 'local' })
        } else {
          if (isMounted.current) {
            if (timeout) {
              clearTimeout(timeout)
              timeout = null
            }
            void prepare()
          }
          return
        }
      }

      // If custom query email/token are present, show verification button to protect against pre-fetching scanners
      if (queryEmail && queryToken) {
        if (isMounted.current) {
          setPageState('verify_click')
        }
        return
      }

      // Give the listener a moment to fire; if still loading after 5s, token is invalid
      if (isMounted.current) {
        timeout = setTimeout(() => {
          if (isMounted.current) {
            setPageState((s) => (s === 'loading' ? 'invalid' : s))
          }
        }, 5000)
      }
    }

    void verifyAndPrepare()

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
      if (timeout) clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaFactorId) return
    setIsVerifyingMfa(true)
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      })
      if (cErr) throw cErr
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      })
      if (vErr) throw vErr
      setPageState('ready')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid code. Please try again.')
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      // Clear must_change_password flag in public.users if present
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ must_change_password: false }).eq('id', user.id)
      }

      setPageState('success')
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      console.error('[RESET PASSWORD ERROR]', err)
      toast.error(sanitiseAuthError(err, 'Failed to reset password. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
      <SEO
        title="Set New Password"
        description="Create a new password for your Base Movement account."
        noindex
      />

      <div className="max-w-[420px] w-full">
        <div className="auth-frame">
          <div className="auth-header-label">Set New Password</div>

          <div className="auth-content">
            <div className="auth-brand">
              <img src={settings.logo_url} alt="Logo" />
              <div>
                <h1>The Base</h1>
                <span>Member portal</span>
              </div>
            </div>

            {/* Loading */}
            {pageState === 'loading' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '24px 0',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 36,
                    color: 'hsl(var(--primary))',
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  progress_activity
                </span>
                <p style={{ margin: 0, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
                  Verifying your reset link…
                </p>
              </div>
            )}

            {/* MFA step-up: account has TOTP enabled */}
            {pageState === 'mfa' && (
              <>
                <h2 className="auth-heading">Confirm it's you.</h2>
                <p className="auth-subheading">
                  This account has two-factor authentication enabled. Enter the 6-digit code from
                  your authenticator app to continue.
                </p>
                <form
                  onSubmit={handleVerifyMfa}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div>
                    <label htmlFor="mfa-code" style={labelStyle}>
                      Authentication Code
                    </label>
                    <input
                      id="mfa-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      style={{ ...inputStyle, letterSpacing: '0.4em', textAlign: 'center' }}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingMfa || mfaCode.length < 6}
                    className="btn btn-primary"
                    style={{
                      height: 50,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    {isVerifyingMfa ? (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                        >
                          progress_activity
                        </span>{' '}
                        Verifying…
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Invalid / expired link */}
            {pageState === 'invalid' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 0 16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'hsl(var(--destructive) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: 'hsl(var(--destructive))' }}
                  >
                    link_off
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                  }}
                >
                  Reset link expired or invalid
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  This link has expired or already been used. Reset links are valid for 1 hour.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46 }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Request a new link
                </button>
              </div>
            )}

            {/* Verify Click State */}
            {pageState === 'verify_click' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 0 16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
                  >
                    security
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                  }}
                >
                  Confirm Reset Request
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Verify your request to set a new password for <br />
                  <strong style={{ color: 'hsl(var(--on-surface))' }}>{queryEmail}</strong>
                </p>
                <button
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 13,
                    marginTop: 8,
                  }}
                  disabled={isVerifyingLink}
                  onClick={handleVerifyLink}
                >
                  {isVerifyingLink ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>{' '}
                      Verifying…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        verified_user
                      </span>{' '}
                      Verify & Continue
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Ready: show new password form */}
            {pageState === 'ready' && (
              <>
                <h2 className="auth-heading">Choose a new password.</h2>
                <p className="auth-subheading">
                  Your identity has been verified. Enter and confirm your new password below.
                </p>
                <form
                  onSubmit={handleReset}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div>
                    <label htmlFor="new-pass" style={labelStyle}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="new-pass"
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        style={{ ...inputStyle, paddingRight: 44 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--on-surface-muted))',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {showPass ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm-pass" style={labelStyle}>
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-pass"
                      type="password"
                      autoComplete="new-password"
                      style={inputStyle}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--destructive))' }}>
                      Passwords do not match.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                    className="btn btn-primary"
                    style={{
                      height: 50,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: 13,
                      marginTop: 8,
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                        >
                          progress_activity
                        </span>{' '}
                        Updating…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          lock_reset
                        </span>{' '}
                        Set New Password
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Success */}
            {pageState === 'success' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 0 16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
                  >
                    check_circle
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                  }}
                >
                  Password updated!
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  Your new password has been saved. Redirecting you to sign in…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
