import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { toast } from 'sonner'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login(email, password)
      
      // Update legacy local storage items for compatibility with dashboard UI
      const user = authService.getUser()
      if (user) {
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('userName', user.user_metadata?.full_name || 'Patriot')
        if (user.user_metadata?.avatar_url) localStorage.setItem('userAvatar', user.user_metadata.avatar_url)
      }
      
      localStorage.setItem('isLoggedIn', 'true')
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
    <main className="bg-surface-warm font-body-md min-h-screen flex flex-col justify-center py-12">
      <div className="max-w-md w-full mx-auto px-4">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="The Base" className="h-16 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-black text-charcoal-dark uppercase tracking-tighter font-meta mb-2">The Base</h1>
          <p className="text-sm text-slate-500 font-meta tracking-widest uppercase">Member Sign In</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-none shadow-sm p-8 md:p-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase">
                Phone Number or Email
              </label>
              <input
                id="phone"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. you@example.com"
                className="w-full form-understate p-4 text-charcoal-dark text-sm"
                required
              />
              <p className="text-[10px] text-slate-500 font-meta tracking-wide mt-1">
                Enter your email address associated with your membership
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase">
                  Password
                </label>
                <Link to="#" className="text-xs text-[var(--brand-green)] hover:underline font-meta">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full form-understate p-4 text-charcoal-dark text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--brand-green)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--brand-green)] hover:opacity-90 text-white font-meta font-bold uppercase tracking-wider py-4 transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-meta tracking-widest">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await authService.signInWithGoogle()
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Google login failed')
                }
              }}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-charcoal-dark font-meta font-bold uppercase tracking-wider py-4 transition-all active:scale-[0.99] flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign In with Google
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-body-md">
              Not a member yet?{' '}
              <Link to="/register" className="text-[var(--brand-green)] font-bold hover:underline">
                Join the Movement
              </Link>
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} The Base. Secure Login.
          </p>
        </div>
      </div>
    </main>
  )
}
