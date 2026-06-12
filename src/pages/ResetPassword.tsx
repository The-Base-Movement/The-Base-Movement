import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

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

type PageState = 'loading' | 'ready' | 'success' | 'invalid'

export default function ResetPassword() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user clicks the email reset link.
    // The URL fragment contains the access_token which Supabase auto-exchanges.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready')
      }
    })

    // Also check if there is already a valid session (user may have already exchanged the token)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready')
      } else {
        // Give the listener a moment to fire; if still loading after 3s, token is invalid
        const timeout = setTimeout(() => {
          setPageState((s) => (s === 'loading' ? 'invalid' : s))
        }, 3000)
        return () => clearTimeout(timeout)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
      toast.error(
        err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      )
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
