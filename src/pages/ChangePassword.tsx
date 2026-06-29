import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import SEO from '@/components/SEO'

function sanitiseAuthError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : ''
  if (
    msg.toLowerCase().includes('password should contain') ||
    msg.toLowerCase().includes('password must contain') ||
    msg.toLowerCase().includes('abcdefghijklmnopqrstuvwxyz')
  ) {
    return 'Password must include uppercase and lowercase letters, a number, and a special character (e.g. !@#$%).'
  }
  return msg || fallback
}

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Update password in the auth layer
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      })
      if (authError) throw authError

      // 2. Clear the must_change_password flag in auth metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { must_change_password: false },
      })
      if (metaError) throw metaError

      // 3. Clear the must_change_password flag in the public.users database record
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id)
        if (dbError) throw dbError
      }

      toast.success('Your permanent password has been set successfully!')
      // Redirect to the main dashboard page
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      console.error('[PASSWORD CHANGE ERROR]', err)
      toast.error(sanitiseAuthError(err, 'Failed to update password. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto 0 auto' }}>
      <SEO
        title="Setup Permanent Password"
        description="Configure your secure permanent password to finalize account activation."
        noindex
      />

      <div className="panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--primary))',
              background: 'rgba(0, 107, 63, 0.08)',
              padding: 10,
              borderRadius: '50%',
            }}
          >
            lock_reset
          </span>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
              }}
            >
              Set Permanent Password
            </h2>
            <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
              Required upon first login for account security
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: 'hsl(var(--on-surface-muted))',
            marginBottom: 24,
          }}
        >
          You are currently signed in with a temporary password sent via SMS. Please set a strong,
          permanent password of your choice to secure your account.
        </p>

        <form
          onSubmit={handlePasswordChange}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="new-pass"
              style={{
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              New Permanent Password
            </label>
            <input
              id="new-pass"
              type="password"
              autoComplete="new-password"
              style={{
                width: '100%',
                height: 46,
                background: 'transparent',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                paddingLeft: 16,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="confirm-pass"
              style={{
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Confirm Permanent Password
            </label>
            <input
              id="confirm-pass"
              type="password"
              autoComplete="new-password"
              style={{
                width: '100%',
                height: 46,
                background: 'transparent',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                paddingLeft: 16,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              height: 50,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
              marginTop: 12,
            }}
          >
            {isLoading ? (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  progress_activity
                </span>
                Updating credentials…
              </>
            ) : (
              <>
                Activate Account &amp; Save
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  check_circle
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
