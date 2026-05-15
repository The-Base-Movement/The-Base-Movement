import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
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
        
        // Proactively fetch and store regNo
        const profile = await adminService.getMemberProfileByAuthId(user.id)
        if (profile) {
          localStorage.setItem('userRegNo', profile.id)
        }
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] font-bold text-sm tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary text-white border-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span> Authenticating…
                  </>
                ) : (
                  <>
                    Sign in <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
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
