import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'
import PasswordField, { PasswordMatchHint } from '@/components/PasswordField'
import { matchTone } from '@/components/passwordMatch'

const otpLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}

const otpInputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  padding: '0 16px',
  fontSize: 14,
  fontWeight: 'var(--font-weight-medium, 500)',
  outline: 'none',
  boxSizing: 'border-box',
}

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

export default function VerifyOTP() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const location = useLocation()

  // Retrieve pre-filled phone number if available from ForgotPassword redirection state
  const redirectedPhone = (location.state as { phone?: string })?.phone || ''

  const [phone, setPhone] = useState(redirectedPhone)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Resend OTP cooldown timer logic
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone) {
      toast.error('Phone number is required.')
      return
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error('Please enter a valid 6-digit verification code.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp-and-reset', {
        body: { phone: phone.trim(), otp: otp.trim(), newPassword },
      })

      if (error) throw error

      toast.success(data?.message || 'Password successfully updated!')
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      console.error('[OTP VERIFY ERROR]', err)
      toast.error(
        sanitiseAuthError(err, 'Invalid or expired verification code. Please check and try again.')
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!phone) {
      toast.error('Enter your phone number to resend.')
      return
    }
    setResendTimer(60) // 1 minute cooldown

    try {
      const { data: resData, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.trim() },
      })

      if (error) throw error
      toast.success(resData?.message || 'New verification code sent!')
    } catch (err: unknown) {
      console.error('[OTP RESEND ERROR]', err)
      toast.error('Failed to dispatch code. Please request recovery again.')
      setResendTimer(0)
    }
  }

  return (
    <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
      <SEO
        title="Verify Code & Reset Password"
        description="Enter the security code sent via SMS to verify your mobile number and set your new account password."
        canonical="/verify-otp"
        noindex
      />

      <div className="max-w-[420px] w-full">
        <div className="auth-frame">
          <div className="auth-header-label">Verification & Reset</div>

          <div className="auth-content">
            <div className="auth-brand">
              <img src={settings.logo_url} alt="Logo" />
              <div>
                <h1>The Base</h1>
                <span>Member portal</span>
              </div>
            </div>

            <h2 className="auth-heading">Verify & Reset.</h2>
            <p className="auth-subheading">
              Enter the 6-digit code sent to your phone and define your new password below.
            </p>

            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              {!redirectedPhone && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    id="phone"
                    type="tel"
                    className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 054XXXXXXX"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="otp"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={handleResend}
                    className={`text-[11.5px] font-semibold hover:underline bg-none border-none p-0 cursor-pointer ${resendTimer > 0 ? 'text-on-surface-muted cursor-not-allowed' : 'text-primary'}`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  name="otp"
                  id="otp"
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-semibold tracking-[0.4em] text-center focus:border-primary transition-colors outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                />
              </div>

              <PasswordField
                id="newPassword"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="••••••••"
                labelStyle={otpLabelStyle}
                inputStyle={otpInputStyle}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                tone={matchTone(newPassword, confirmPassword)}
                labelStyle={otpLabelStyle}
                inputStyle={otpInputStyle}
              />

              <PasswordMatchHint tone={matchTone(newPassword, confirmPassword)} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] font-medium text-sm tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-primary text-white border-none cursor-pointer mt-4"
              >
                {isLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                    >
                      progress_activity
                    </span>{' '}
                    Updating Password…
                  </>
                ) : (
                  <>
                    Reset Password{' '}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      lock_open
                    </span>
                  </>
                )}
              </button>

              <div className="auth-footer">
                Back to <Link to="/login">Sign in →</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
