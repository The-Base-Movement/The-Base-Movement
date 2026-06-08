import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

type RecoveryMethod = 'phone' | 'email'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  padding: '0 16px',
  fontSize: 14,
  fontWeight: 'var(--font-weight-medium, 500)',
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}

export default function ForgotPassword() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [method, setMethod] = useState<RecoveryMethod>('phone')

  // Phone tab state
  const [phone, setPhone] = useState('')
  const [regNo, setRegNo] = useState('')

  // Email tab state
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !regNo) {
      toast.error('Please enter both your phone number and Patriot ID.')
      return
    }
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.trim(), reg_no: regNo.trim().toUpperCase() },
      })
      if (error) throw error
      toast.success(data?.message || 'Verification code sent successfully!')
      navigate('/verify-otp', { state: { phone: phone.trim() } })
    } catch (err: unknown) {
      console.error('[OTP SEND ERROR]', err)
      toast.error(
        err instanceof Error
          ? err.message
          : 'No account matching this Patriot ID and phone number was found.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your registered email address.')
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setEmailSent(true)
    } catch (err: unknown) {
      console.error('[EMAIL RESET ERROR]', err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
      <SEO
        title="Recover Password"
        description="Reset your password via SMS verification code or email link."
        canonical="/forgot-password"
      />

      <div className="max-w-[420px] w-full">
        <div className="auth-frame">
          <div className="auth-header-label">Password Recovery</div>

          <div className="auth-content">
            <div className="auth-brand">
              <img src={settings.logo_url} alt="Logo" />
              <div>
                <h1>The Base</h1>
                <span>Member portal</span>
              </div>
            </div>

            <h2 className="auth-heading">Recover your account.</h2>
            <p className="auth-subheading">
              Choose how you would like to reset your password by SMS code or email link.
            </p>

            {/* Method tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                marginBottom: 24,
              }}
            >
              {(['phone', 'email'] as RecoveryMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMethod(m)
                    setEmailSent(false)
                  }}
                  style={{
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'background 0.15s',
                    background: method === m ? 'hsl(var(--primary))' : 'transparent',
                    color: method === m ? '#fff' : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {m === 'phone' ? 'sms' : 'mail'}
                  </span>
                  {m === 'phone' ? 'SMS Code' : 'Email Link'}
                </button>
              ))}
            </div>

            {/* ── Phone OTP form ── */}
            {method === 'phone' && (
              <form
                onSubmit={handleRequestOTP}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label htmlFor="regNo" style={labelStyle}>
                    Patriot ID (Reg No)
                  </label>
                  <input
                    id="regNo"
                    type="text"
                    style={inputStyle}
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="TBM-GH-XXXXXX"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" style={labelStyle}>
                    Registered Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    style={inputStyle}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 054XXXXXXX or +233..."
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
                    marginTop: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>{' '}
                      Sending Code…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        sms
                      </span>{' '}
                      Send SMS Code
                    </>
                  )}
                </button>
                <div className="auth-footer">
                  Remembered your password? <Link to="/login">Sign in →</Link>
                </div>
              </form>
            )}

            {/* ── Email reset form ── */}
            {method === 'email' && !emailSent && (
              <form
                onSubmit={handleEmailReset}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    Registered Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                  }}
                >
                  We will send a secure reset link to this address. The link expires in 1 hour.
                </p>
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
                    marginTop: 4,
                  }}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                      >
                        progress_activity
                      </span>{' '}
                      Sending…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        mail
                      </span>{' '}
                      Send Reset Link
                    </>
                  )}
                </button>
                <div className="auth-footer">
                  Remembered your password? <Link to="/login">Sign in →</Link>
                </div>
              </form>
            )}

            {/* ── Email sent confirmation ── */}
            {method === 'email' && emailSent && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 0 16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
                  >
                    mark_email_read
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'center',
                  }}
                >
                  Check your inbox
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}
                >
                  A reset link has been sent to <strong>{email}</strong>. Click the link in the
                  email to set a new password. Check your spam folder if you do not see it.
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEmailSent(false)}
                  style={{ marginTop: 4 }}
                >
                  Try a different email
                </button>
                <div className="auth-footer">
                  Remembered your password? <Link to="/login">Sign in →</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
