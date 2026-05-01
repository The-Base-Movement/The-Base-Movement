import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userAvatar', 'https://i.pravatar.cc/150?u=a042581f4e29026704d')
    window.dispatchEvent(new Event('storage'))
    navigate('/dashboard')
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
                placeholder="e.g. 201234567 or you@example.com"
                className="w-full form-understate p-4 text-charcoal-dark text-sm"
              />
              <p className="text-[10px] text-slate-500 font-meta tracking-wide mt-1">
                Enter your phone number (with or without country code) or your email address
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-charcoal-dark font-meta tracking-widest uppercase">
                  Password
                </label>
                <Link to="#" className="text-xs text-brand-green hover:underline font-meta">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  className="w-full form-understate p-4 text-charcoal-dark text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-green"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-green hover:opacity-90 text-white font-meta font-bold uppercase tracking-wider py-4 transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-body-md">
              Not a member yet?{' '}
              <Link to="/register" className="text-brand-green font-bold hover:underline">
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
