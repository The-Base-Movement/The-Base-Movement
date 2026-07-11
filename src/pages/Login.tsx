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
    label: 'Identify',
    title: 'Use your member identity',
    copy: 'Sign in with your email, phone number, or TBM registration number.',
    icon: 'badge',
  },
  {
    label: 'Verify',
    title: 'Confirm your password',
    copy: 'Your password unlocks your member dashboard and chapter tools.',
    icon: 'lock',
  },
  {
    label: 'Continue',
    title: 'Return to your work',
    copy: 'After login, you go back to the dashboard or the page you wanted to open.',
    icon: 'arrow_forward',
  },
]

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
        sessionStore.setItem('userName', user.user_metadata?.full_name || 'Patriot')
        if (user.user_metadata?.avatar_url)
          sessionStore.setItem('userAvatar', user.user_metadata.avatar_url)

        // Fetch regNo, auto-generate a TBM number if placeholder/missing
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

      toast.success('Welcome back, patriot!')
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
    <main className="bg-container-low min-h-screen px-4 py-8 lg:px-10 lg:py-10">
      <SEO
        title="Member Sign In"
        description="Secure access to the The Base Movement platform. Manage your membership, connect with your chapter, and participate in feedback."
        canonical="/login"
      />

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-[1120px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <section
          aria-label="Login steps"
          className="relative overflow-hidden border border-border bg-surface p-6 shadow-sm lg:min-h-[620px] lg:p-10"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div className="flex items-center gap-3">
            <img src={settings.logo_url} alt="The Base logo" className="h-12 w-12 object-contain" />
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                The Base Movement
              </p>
              <h1 className="m-0 text-2xl font-semibold tracking-tight text-on-surface lg:text-4xl">
                Member access, without the noise.
              </h1>
            </div>
          </div>

          <div className="mt-10 grid gap-4" role="tablist" aria-label="Login flow steps">
            {loginSteps.map((step, index) => {
              const isActive = index === activeStep
              return (
                <button
                  key={step.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStep(index)}
                  className="grid grid-cols-[44px_1fr] gap-4 border bg-transparent p-4 text-left transition-colors"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: isActive ? 'hsl(var(--primary) / 0.06)' : 'transparent',
                  }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'hsl(var(--primary))' : 'hsl(var(--surface-muted))',
                      color: isActive ? '#fff' : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 21 }}>
                      {step.icon}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-muted">
                      Step {index + 1} - {step.label}
                    </span>
                    <span className="mt-1 block text-base font-semibold text-on-surface">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-on-surface-muted">
                      {step.copy}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div
            className="mt-8 border border-border bg-card p-5"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Active step
            </p>
            <p className="mb-2 mt-2 text-xl font-semibold text-on-surface">{currentStep.title}</p>
            <p className="m-0 text-sm leading-6 text-on-surface-muted">{currentStep.copy}</p>
          </div>
        </section>

        <section aria-label="Member sign in" className="w-full">
          <div className="auth-frame">
            <div className="auth-header-label">Member Sign In</div>

            <div className="auth-content">
              <div className="auth-brand">
                <img src={settings.logo_url} alt="Logo" />
                <div>
                  <h1>The Base</h1>
                  <span>Member portal</span>
                </div>
              </div>

              <h2 className="auth-heading">Welcome back, patriot.</h2>
              <p className="auth-subheading">Sign in to your member account to continue.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="input-80a9bc"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Email, Phone, or Reg. No.
                  </label>
                  <input
                    name="email"
                    id="input-80a9bc"
                    type="text"
                    autoComplete="username"
                    className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kwesi@thebase.gh, 054..., or TBM-DI-267388"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="input-936899"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-primary text-[11.5px] font-semibold hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      name="password"
                      id="input-936899"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        height: 46,
                        background: 'transparent',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        paddingLeft: 16,
                        paddingRight: 44,
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s',
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 pb-2">
                  <input
                    name="name-769aef"
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 accent-primary"
                    defaultChecked
                  />
                  <label htmlFor="remember" className="text-[11.5px] font-medium text-on-surface">
                    Keep me signed in
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] font-medium text-sm tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary text-white border-none cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>{' '}
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign in{' '}
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                <div className="auth-footer">
                  New to the movement? <Link to="/register">Create an account →</Link>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
