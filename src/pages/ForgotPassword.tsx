import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'

export default function ForgotPassword() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [regNo, setRegNo] = useState('')
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
      // Navigate to OTP verification page, passing the phone number via router state
      navigate('/verify-otp', { state: { phone: phone.trim() } })
    } catch (err: unknown) {
      console.error('[OTP SEND ERROR]', err)
      const message =
        err instanceof Error
          ? err.message
          : 'No account matching this Patriot ID and phone number was found.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
      <SEO
        title="Recover Password"
        description="Verify your identity using your Patriot ID and receive a password recovery verification code on your registered phone number."
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
              Enter your Patriot Registration Number and phone number to receive a 6-digit
              verification code.
            </p>

            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="regNo"
                  className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                >
                  Patriot ID (Reg No)
                </label>
                <input
                  name="regNo"
                  id="regNo"
                  type="text"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="TBM-GH-XXXXXX"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="phone"
                  className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                >
                  Registered Phone Number
                </label>
                <input
                  name="phone"
                  id="phone"
                  type="tel"
                  className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 054XXXXXXX or +233..."
                  required
                />
              </div>

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
                    Generating OTP…
                  </>
                ) : (
                  <>
                    Send Verification Code{' '}
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      sms
                    </span>
                  </>
                )}
              </button>

              <div className="auth-footer">
                Remembered your password? <Link to="/login">Sign in →</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
