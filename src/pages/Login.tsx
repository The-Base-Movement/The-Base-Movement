import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { sessionStore } from '@/lib/sessionStore'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

export default function Login() {
  const { settings } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const adminUser = await adminService.initialize()
      if (adminUser) {
        toast.success('Welcome back. Redirecting to the admin panel.')
        navigate('/admin', { replace: true })
      } else {
        toast.success('Welcome back, patriot!')
        navigate(from, { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error instanceof Error ? error.message : 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
      <SEO
        title="Member Sign In"
        description="Secure access to the The Base Movement platform. Manage your membership, connect with your chapter, and participate in feedback."
        canonical="/login"
      />

      <div className="max-w-[420px] w-full">
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
                  Email or Phone
                </label>
                <input
                  name="email"
                  id="input-80a9bc"
                  type="text"
                  autoComplete="username"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwesi@thebase.gh or 054..."
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
                    Authenticating…
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
      </div>
    </main>
  )
}
