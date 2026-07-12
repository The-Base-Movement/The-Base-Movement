import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { validatePhone } from '@/lib/phoneValidation'
import SEO from '@/components/SEO'
import { AdminGate } from '@/components/admin/AdminGate'

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
  const { session } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMfaPrompt, setShowMfaPrompt] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (session) {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    sessionStorage.removeItem('admin_device_captured')
    sessionStorage.removeItem('admin_gate_verified')

    if (location.state?.error) {
      toast.error(location.state.error)
      // Clear location state to prevent repeating the toast on page refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state, session, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) return
    const trimmed = email.trim()
    const isEmailAddr = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    const isPhoneNum = /^\+?[\d\s()-]+$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7
    if (!isEmailAddr && isPhoneNum) {
      const phoneErr = validatePhone(trimmed)
      if (phoneErr) {
        toast.error(phoneErr)
        return
      }
    }
    if (!isEmailAddr && !isPhoneNum) {
      toast.error('Please enter a valid email or phone number.')
      return
    }
    setIsLoading(true)
    try {
      await authService.login(email, password)

      const factors = await authService.listMfaFactors()
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
      await authService.challengeAndVerifyMfa(mfaFactorId, normalizedCode)

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
    <AdminGate>
      <main
        style={{
          minHeight: '100vh',
          padding: 'clamp(18px, 5vw, 56px)',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #d8e9ee 0%, #f5faf6 48%, #d6e5ea 100%)',
        }}
      >
        <SEO title="Admin Portal" noindex />
        <div
          className="login-browser-grid"
          style={{
            maxWidth: 1160,
            minHeight: 'min(720px, calc(100vh - 112px))',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'hsl(var(--surface))',
            boxShadow: '0 26px 80px rgba(20,40,32,.18)',
            border: '1px solid rgba(255,255,255,.72)',
          }}
        >
          <section
            aria-label="Role manager sign in"
            style={{
              padding: 'clamp(28px, 5vw, 48px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: 'hsl(var(--card))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 54,
              }}
            >
              <Link
                to="/"
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <img
                  src="/branding/logo.png"
                  alt="The Base logo"
                  style={{ width: 42, height: 42, objectFit: 'contain' }}
                />
                <strong style={{ fontSize: 18, color: 'hsl(var(--on-surface))' }}>The Base</strong>
              </Link>
              <span className="pill pill-warn">Restricted</span>
            </div>

            {!showMfaPrompt ? (
              <form
                onSubmit={handleLogin}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <input
                  name="website_url"
                  type="text"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
                />
                <div style={{ marginBottom: 8 }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 'clamp(28px, 4vw, 36px)',
                      lineHeight: 1.05,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Role manager sign in
                  </h1>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Continue to the movement Command Center.
                  </p>
                </div>

                <div>
                  <label htmlFor="admin-login-email" style={labelStyle}>
                    Email address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: 12,
                        fontSize: 18,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      alternate_email
                    </span>
                    <input
                      name="email"
                      id="admin-login-email"
                      type="email"
                      required
                      autoComplete="username"
                      placeholder="manager@thebase.org"
                      style={{
                        ...fieldStyle,
                        borderRadius: 'var(--radius-md)',
                        padding: '0 14px 0 42px',
                      }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin-login-password" style={labelStyle}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        left: 14,
                        top: 12,
                        fontSize: 18,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      key
                    </span>
                    <input
                      name="password"
                      id="admin-login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      style={{ ...fieldStyle, borderRadius: 'var(--radius-md)', padding: '0 42px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: 48, marginTop: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isLoading ? 'hourglass_empty' : 'login'}
                  </span>
                  {isLoading ? 'Authenticating...' : 'Continue securely'}
                </button>
                <Link
                  to="/forgot-password"
                  style={{
                    textAlign: 'center',
                    color: 'hsl(var(--primary))',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Forgot password?
                </Link>
              </form>
            ) : (
              <form
                onSubmit={handleVerifyMfa}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: 28, color: 'hsl(var(--on-surface))' }}>
                    Verify your identity
                  </h1>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>
                <div>
                  <label htmlFor="input-mfa" style={labelStyle}>
                    Verification code
                  </label>
                  <input
                    name="mfaCode"
                    id="input-mfa"
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="one-time-code"
                    placeholder="000 000"
                    maxLength={6}
                    style={{
                      ...fieldStyle,
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: 22,
                      letterSpacing: '0.4em',
                      height: 52,
                      fontWeight: 600,
                    }}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || mfaCode.replace(/\D/g, '').length < 6}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: 48 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isLoading ? 'hourglass_empty' : 'verified_user'}
                  </span>
                  {isLoading ? 'Verifying...' : 'Verify identity'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMfaPrompt(false)}
                  className="btn btn-outline"
                  style={{ width: '100%', justifyContent: 'center', height: 40 }}
                  disabled={isLoading}
                >
                  Back to login
                </button>
              </form>
            )}

            <div
              style={{
                marginTop: 28,
                paddingTop: 18,
                borderTop: '1px solid hsl(var(--border))',
                textAlign: 'center',
              }}
            >
              <Link
                to="/login"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  textDecoration: 'none',
                }}
              >
                Member login instead
              </Link>
            </div>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                justifyContent: 'center',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                lock
              </span>
              Admin access is monitored and logged
            </div>
          </section>

          <section
            aria-label="Admin security protocol"
            className="login-showcase-panel"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 'clamp(40px, 7vw, 76px)',
              color: '#fff',
              background: 'linear-gradient(145deg, #0c1812 0%, #163c2a 58%, #0b2519 100%)',
            }}
          >
            <img
              src="/branding/patterns/eagle-in-flight.webp"
              alt=""
              style={{
                position: 'absolute',
                right: '-8%',
                bottom: '-5%',
                width: 420,
                opacity: 0.05,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 30,
                  padding: '0 14px',
                  border: '1px solid rgba(255,255,255,.28)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  shield_lock
                </span>
                Security protocol
              </span>
              <h2
                style={{
                  maxWidth: 520,
                  margin: '24px 0 12px',
                  fontSize: 'clamp(34px, 5vw, 52px)',
                  lineHeight: 1.08,
                  color: '#fff',
                }}
              >
                Privileged access requires verified identity
              </h2>
              <p
                style={{
                  maxWidth: 520,
                  margin: 0,
                  color: 'rgba(255,255,255,.68)',
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                The Command Center protects movement operations through controlled role access and
                layered authentication.
              </p>

              <div style={{ marginTop: 36, display: 'grid', gap: 12 }}>
                {[
                  [
                    'badge',
                    'Verified role access',
                    'Only approved role managers can enter the Command Center.',
                  ],
                  [
                    'phonelink_lock',
                    'Mandatory two-factor authentication',
                    'A verified authenticator code is required for privileged access.',
                  ],
                  [
                    'monitoring',
                    'Monitored sessions',
                    'Sign-ins and administrative activity are securely logged.',
                  ],
                ].map(([icon, title, copy], index) => (
                  <div
                    key={title}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr auto',
                      gap: 14,
                      alignItems: 'center',
                      padding: '16px 18px',
                      border: '1px solid rgba(255,255,255,.12)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,.06)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)',
                        color: '#70d5a2',
                        background: 'rgba(112,213,162,.12)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 21 }}>
                        {icon}
                      </span>
                    </span>
                    <span>
                      <strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
                        {title}
                      </strong>
                      <span
                        style={{
                          display: 'block',
                          color: 'rgba(255,255,255,.58)',
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {copy}
                      </span>
                    </span>
                    <span style={{ color: 'rgba(255,255,255,.32)', fontSize: 11 }}>
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 26,
                  color: 'rgba(255,255,255,.48)',
                  fontSize: 11,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  policy
                </span>
                Unauthorized access attempts may be investigated.
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminGate>
  )
}
