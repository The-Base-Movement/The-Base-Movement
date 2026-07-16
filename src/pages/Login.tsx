import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { sessionStore } from '@/lib/sessionStore'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { validatePhone } from '@/lib/phoneValidation'
import SEO from '@/components/SEO'

const loginSteps = [
  {
    label: 'Members',
    title: 'Track your chapter and constituency work',
    copy: 'Follow campaigns, dues, reports, and movement activity from one secure member portal.',
    icon: 'groups',
  },
  {
    label: 'Finance',
    title: 'Verified contributions only',
    copy: 'Donation cards, receipts, and chapter or constituency figures stay tied to confirmed movement records.',
    icon: 'payments',
  },
  {
    label: 'Field',
    title: 'Return to operations fast',
    copy: 'After login, you go back to the dashboard or the page you wanted to open.',
    icon: 'route',
  },
]

const inputStyle = {
  width: '100%',
  height: 44,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-md)',
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface))',
  padding: '0 42px',
  fontSize: 13,
  boxSizing: 'border-box' as const,
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  marginBottom: 7,
  fontSize: 11,
  fontWeight: 700,
  color: 'hsl(var(--on-surface))',
}

export default function Login() {
  const { settings } = useBranding()
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
  const logo = settings.logo_url || '/branding/logo.png'

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true })
  }, [session, navigate])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((step) => (step + 1) % loginSteps.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    const isPhone = /^\+?[\d\s()-]+$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7
    if (!isEmail && isPhone) {
      const phoneErr = validatePhone(trimmed)
      if (phoneErr) {
        toast.error(phoneErr)
        return
      }
    }
    if (!isEmail && !isPhone) {
      toast.error('Please enter a valid email or phone number.')
      return
    }
    setIsLoading(true)

    try {
      await authService.login(email, password)

      const user = authService.getUser()
      if (user) {
        sessionStore.setItem('isLoggedIn', 'true')
        sessionStore.setItem('userName', user.user_metadata?.full_name || 'Compatriot')
        if (user.user_metadata?.avatar_url) {
          sessionStore.setItem('userAvatar', user.user_metadata.avatar_url)
        }

        const profile = await adminService.getMemberProfileByAuthId(user.id)
        if (profile) {
          const regNo = /^TBM-(GH|DI)-\d{6}$/.test(profile.id)
            ? profile.id
            : ((await adminService.ensureRegistrationNumber(user.id)) ?? profile.id)
          sessionStore.setItem('userRegNo', regNo)
          sessionStore.setItem('userPlatform', profile.platform || 'GHANA')
        }
      }

      window.dispatchEvent(new Event('storage'))

      toast.success('Welcome back, compatriot!')
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error instanceof Error ? error.message : 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentStep = loginSteps[activeStep]

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, hsl(var(--surface-warm)) 0%, hsl(var(--background)) 100%)',
        padding: 'clamp(18px, 5vw, 56px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <SEO
        title="Member Sign In"
        description="Secure access to the The Base Movement platform. Manage your membership, connect with your chapter or constituency, and participate in feedback."
        canonical="/login"
      />

      <div
        style={{
          maxWidth: 1160,
          minHeight: 'min(720px, calc(100vh - 112px))',
          margin: '0 auto',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'hsl(var(--surface))',
          boxShadow: '0 26px 80px rgba(20, 40, 32, 0.18)',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          className="login-browser-grid"
          style={{
            minHeight: 'min(720px, calc(100vh - 112px))',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
          }}
        >
          <section
            aria-label="Member sign in"
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
                marginBottom: 64,
                gap: 16,
              }}
            >
              <Link
                to="/"
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <img
                  src={logo}
                  alt="The Base logo"
                  style={{ width: 42, height: 42, objectFit: 'contain' }}
                />
                <strong style={{ fontSize: 18, color: 'hsl(var(--on-surface))' }}>The Base</strong>
              </Link>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'hsl(var(--on-surface-muted))',
                  fontSize: 12,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
                className="back-to-website-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_back
                </span>
                Back to site
              </Link>
            </div>

            <h1
              style={{
                margin: 0,
                color: 'hsl(var(--on-surface))',
                fontSize: 'clamp(28px, 4vw, 36px)',
                lineHeight: 1.05,
                letterSpacing: 0,
              }}
            >
              Hi, welcome back
            </h1>
            <p
              style={{ margin: '10px 0 24px', color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}
            >
              Sign in to continue to your movement dashboard.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label htmlFor="member-login-id" style={labelStyle}>
                  Email, phone, or registration number
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
                    id="member-login-id"
                    name="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email, 054..., or TBM-DI-267388"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="member-login-password" style={labelStyle}>
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
                    id="member-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="your password"
                    required
                    style={{ ...inputStyle, paddingRight: 46 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 9,
                      border: 0,
                      background: 'transparent',
                      color: 'hsl(var(--on-surface-muted))',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '2px 0 10px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  <input type="checkbox" style={{ accentColor: 'hsl(var(--primary))' }} />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  style={{ color: 'hsl(var(--primary))', fontSize: 12, fontWeight: 700 }}
                >
                  Forgot password
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  height: 48,
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--primary))',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.76 : 1,
                }}
              >
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 12,
                  margin: '14px 0 8px',
                }}
              >
                <span style={{ height: 1, background: 'hsl(var(--border))' }} />
                <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                  Secure member access
                </span>
                <span style={{ height: 1, background: 'hsl(var(--border))' }} />
              </div>

              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Don&apos;t have an account?{' '}
                <Link to="/register" style={{ color: 'hsl(var(--primary))', fontWeight: 700 }}>
                  Register
                </Link>
              </p>
            </form>
          </section>

          <section
            aria-label="Movement dashboard preview"
            className="login-showcase-panel"
            style={{
              position: 'relative',
              padding: 'clamp(34px, 6vw, 70px)',
              overflow: 'hidden',
              background:
                'linear-gradient(145deg, hsl(var(--container-low)) 0%, hsl(var(--container-hi)) 100%)',
            }}
          >
            <style>{`
              @keyframes work-pulse {
                0%, 100% {
                  transform: scale(1);
                  color: hsl(var(--primary));
                  text-shadow: 0 0 0px hsla(var(--primary), 0);
                }
                50% {
                  transform: scale(1.05);
                  color: hsl(156, 100%, 30%);
                  text-shadow: 0 0 8px hsla(var(--primary), 0.35);
                }
              }

              @keyframes ghana-shimmer {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }

              @keyframes ghana-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }

              .animated-work {
                display: inline-block;
                color: hsl(var(--primary));
                font-weight: var(--font-weight-bold);
                animation: work-pulse 3s ease-in-out infinite;
                transition: all 0.3s ease;
              }

              .animated-ghana {
                display: inline-block;
                font-weight: var(--font-weight-black);
                background: linear-gradient(
                  to right,
                  #CE1126 0%,  /* Ghana Red */
                  #FCD116 50%, /* Ghana Gold */
                  #006B3F 100% /* Ghana Green */
                );
                background-size: 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: ghana-shimmer 3s linear infinite, ghana-float 4s ease-in-out infinite;
              }

              .back-to-website-btn {
                transition: all 0.2s ease-in-out;
              }

              .back-to-website-btn:hover {
                color: hsl(var(--primary)) !important;
                transform: translateX(-4px);
              }
            `}</style>

            {/* Watermark image */}
            <img
              src="/branding/patterns/eagle-in-flight.webp"
              alt=""
              style={{
                position: 'absolute',
                right: '-5%',
                bottom: '-5%',
                width: '380px',
                height: 'auto',
                opacity: 0.06,
                pointerEvents: 'none',
                zIndex: 0,
                userSelect: 'none',
              }}
            />

            <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 28,
                  padding: '0 16px',
                  border: '1px solid hsl(var(--on-surface))',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Movement portal
              </span>
              <h2
                style={{
                  maxWidth: 520,
                  margin: '24px 0 12px',
                  fontSize: 'clamp(34px, 5vw, 52px)',
                  lineHeight: 1.08,
                  letterSpacing: 0,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Track and monitor the <span className="animated-work">work</span> that moves{' '}
                <span className="animated-ghana">Ghana</span> forward
              </h2>
              <p
                style={{
                  maxWidth: 520,
                  margin: 0,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                Access chapter and constituency tools, verified donations, events, and field updates
                from one secure Base dashboard.
              </p>

              <div
                style={{
                  marginTop: 36,
                  width: 'min(100%, 520px)',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--card))',
                  boxShadow: '0 22px 48px rgba(20, 40, 32, 0.13)',
                  padding: 18,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                {loginSteps.map((step, index) => {
                  const active = index === activeStep
                  return (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '38px 1fr auto',
                        gap: 12,
                        alignItems: 'center',
                        border: 0,
                        background: active ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: active ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                          color: active ? '#fff' : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 19 }}>
                          {step.icon}
                        </span>
                      </span>
                      <span>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {step.title}
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            marginTop: 2,
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {step.label}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        view
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  marginLeft: 'min(34%, 160px)',
                  marginTop: -38,
                  width: 'min(100%, 360px)',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--surface))',
                  boxShadow: '0 26px 60px rgba(20, 40, 32, 0.18)',
                  overflow: 'hidden',
                  minHeight: 180,
                }}
              >
                <div
                  style={{
                    height: 34,
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {currentStep.label} snapshot
                </div>
                <div style={{ padding: 18 }}>
                  <strong
                    style={{ display: 'block', marginBottom: 8, color: 'hsl(var(--on-surface))' }}
                  >
                    {currentStep.title}
                  </strong>
                  <p
                    style={{
                      margin: 0,
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {currentStep.copy}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
