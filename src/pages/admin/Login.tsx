import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 400,
  fontSize: 13,
  outline: 'none',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 600,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const,
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMfaPrompt, setShowMfaPrompt] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    sessionStorage.removeItem('admin_device_captured')
    sessionStorage.removeItem('admin_gate_verified')

    if (location.state?.error) {
      toast.error(location.state.error)
      // Clear location state to prevent repeating the toast on page refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.login(email, password)

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError
      const verifiedTotp = factors?.totp?.find((factor) => factor.status === 'verified')

      if (verifiedTotp) {
        setMfaFactorId(verifiedTotp.id)
        setShowMfaPrompt(true)
        setIsLoading(false)
        return
      }

      toast.warning('Two-factor authentication must be set up before full admin access is allowed.')
      navigate('/admin/settings?tab=security')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please check your credentials.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedCode = mfaCode.replace(/\D/g, '').slice(0, 6)
    if (normalizedCode.length < 6) return
    setIsLoading(true)
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challenge.error) throw challenge.error
      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: normalizedCode,
      })
      if (verify.error) throw verify.error

      // MFA proven at login — don't re-challenge at the admin gate this visit
      sessionStorage.setItem('admin_gate_verified', '1')
      toast.success('Access granted. Welcome to the Command Center.')
      navigate('/admin')
    } catch {
      toast.error('Invalid verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <SEO title="Admin Portal" noindex />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Card */}
        <div
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.07)',
          }}
        >
          {/* Dark header */}
          <div
            style={{
              background: 'linear-gradient(135deg,#0f1310,#1f2620)',
              borderTop: '4px solid hsl(var(--primary))',
              padding: '28px 32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(0,107,63,.15)',
                  border: '1px solid rgba(0,107,63,.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
                >
                  shield
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  Admin Access
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,.4)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                    marginTop: 2,
                  }}
                >
                  The Base Movement · Restricted Access
                </div>
              </div>
            </div>
            {/* Ghana flag stripe */}
            <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#CE1126' }} />
              <div style={{ flex: 1, background: '#FCD116' }} />
              <div style={{ flex: 1, background: '#006b3f' }} />
            </div>
          </div>

          {/* Form body */}
          {!showMfaPrompt ? (
            <form
              onSubmit={handleLogin}
              style={{
                background: 'hsl(var(--card))',
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div style={{ marginBottom: 2 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                    marginBottom: 4,
                  }}
                >
                  Admin login
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  Authorized personnel only
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="input-5337b3" style={labelStyle}>
                  Email address
                </label>
                <input
                  aria-label="admin@thebase.org"
                  name="email"
                  id="input-5337b3"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@thebase.org"
                  style={fieldStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="input-55345f" style={labelStyle}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    aria-label="••••••••"
                    name="password"
                    id="input-55345f"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    style={{ ...fieldStyle, paddingRight: 42 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-dest"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: 48,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {isLoading ? 'hourglass_empty' : 'login'}
                </span>
                {isLoading ? 'Authenticating...' : 'Sign in to command →'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyMfa}
              style={{
                background: 'hsl(var(--card))',
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div style={{ marginBottom: 2 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                    marginBottom: 4,
                  }}
                >
                  Two-Factor Authentication
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                  }}
                >
                  Enter the 6-digit code from your authenticator app
                </div>
              </div>

              <div>
                <label htmlFor="input-mfa" style={labelStyle}>
                  Verification code
                </label>
                <input
                  name="mfaCode"
                  id="input-mfa"
                  type="text"
                  required
                  autoComplete="one-time-code"
                  placeholder="000 000"
                  maxLength={6}
                  style={{
                    ...fieldStyle,
                    textAlign: 'center',
                    fontSize: 22,
                    letterSpacing: '0.4em',
                    height: 52,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                  }}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.replace(/\D/g, '').length < 6}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: 48,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {isLoading ? 'hourglass_empty' : 'verified_user'}
                </span>
                {isLoading ? 'Verifying...' : 'Verify Identity →'}
              </button>

              <button
                type="button"
                onClick={() => setShowMfaPrompt(false)}
                className="btn btn-outline"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  height: 40,
                  fontSize: 12,
                }}
                disabled={isLoading}
              >
                Back to login
              </button>
            </form>
          )}

          {/* Footer */}
          <div
            style={{
              padding: '14px 32px',
              borderTop: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              textAlign: 'center',
            }}
          >
            <Link
              to="/login"
              style={{
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface-muted))',
                textDecoration: 'none',
              }}
            >
              Member login instead →
            </Link>
          </div>
        </div>

        {/* Security notice */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
          >
            lock
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Secured · Admin access is monitored and logged
          </span>
        </div>
      </div>
    </div>
  )
}
