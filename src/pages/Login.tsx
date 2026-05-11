import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Smartphone } from 'lucide-react'
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

              <div className="flex gap-2">
                <button 
                  type="button"
                  className="flex-1 h-[42px] bg-white border border-border text-on-surface text-[12px] font-bold flex items-center justify-center gap-2 hover:border-primary transition-colors active:scale-[0.98]"
                  onClick={async () => {
                    try {
                      await authService.signInWithGoogle()
                    } catch {
                      toast.error('Google login failed')
                    }
                  }}
                >
                  <Smartphone className="w-4 h-4 text-primary" /> MoMo
                </button>
                <button type="button" className="w-[42px] h-[42px] bg-white border border-border text-on-surface text-[14px] font-black flex items-center justify-center hover:border-primary transition-colors active:scale-[0.98]">G</button>
                <button type="button" className="w-[42px] h-[42px] bg-white border border-border text-on-surface text-[14px] font-black flex items-center justify-center hover:border-primary transition-colors active:scale-[0.98]">f</button>
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
