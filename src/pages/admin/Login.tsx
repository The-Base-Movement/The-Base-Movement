import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 800,
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
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authService.login(email, password)
      toast.success('Access granted. Welcome to the Command Center.')
      navigate('/admin')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <SEO title="Admin Portal" noindex />

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Card */}
        <div style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.07)' }}>

          {/* Dark header */}
          <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', borderTop: '4px solid hsl(var(--primary))', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,107,63,.15)', border: '1px solid rgba(0,107,63,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>shield</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: '#fff', lineHeight: 1.2 }}>Command Center</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2 }}>The Base Movement · Restricted Access</div>
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
          <form onSubmit={handleLogin} style={{ background: '#fff', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ marginBottom: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))', marginBottom: 4 }}>Admin login</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Authorized personnel only</div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <input name="email" id="input-5337b3"
                type="email"
                required
                placeholder="admin@thebase.org"
                style={fieldStyle}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input name="password" id="input-55345f"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  style={{ ...fieldStyle, paddingRight: 42 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center' }}
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
              style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: 13, marginTop: 2 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {isLoading ? 'hourglass_empty' : 'login'}
              </span>
              {isLoading ? 'Authenticating...' : 'Sign in to command →'}
            </button>

          </form>

          {/* Footer */}
          <div style={{ padding: '14px 32px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))', textDecoration: 'none' }}>
              Member login instead →
            </Link>
          </div>
        </div>

        {/* Security notice */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>lock</span>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))' }}>
            Secured · Admin access is monitored and logged
          </span>
        </div>

      </div>
    </div>
  )
}
