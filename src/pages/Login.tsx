import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/neon-button'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

export default function Login() {
  const { settings } = useBranding()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login(email, password)
      
      const user = authService.getUser()
      if (user) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userName', user.user_metadata?.full_name || 'Patriot')
        if (user.user_metadata?.avatar_url) localStorage.setItem('userAvatar', user.user_metadata.avatar_url)
      }
      
      window.dispatchEvent(new Event('storage'))
      toast.success('Welcome back, patriot!')
      navigate('/dashboard')
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
          <div className="auth-header-label">
            01 · Login <span>Returning patriot</span>
          </div>

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
                <span className="text-[10.5px] font-[800] text-on-surface-muted uppercase tracking-[.06em] block">
                  Email or Phone
                </span>
                <input 
                  type="text"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwesi@thebase.gh or 054..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-[800] text-on-surface-muted uppercase tracking-[.06em] block">
                    Password
                  </span>
                  <Link to="#" className="text-primary text-[11.5px] font-[800] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input 
                  type="password"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pb-2">
                <input type="checkbox" id="remember" className="w-4 h-4 accent-primary" defaultChecked />
                <label htmlFor="remember" className="text-[11.5px] font-[700] text-on-surface">
                  Keep me signed in
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="w-full h-[52px] font-bold text-sm tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="auth-divider">Or continue with</div>

              <div className="flex flex-col gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-[46px] font-bold text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                  onClick={async () => {
                    try {
                      await authService.signInWithGoogle()
                    } catch {
                      toast.error('Google login failed')
                    }
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

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
