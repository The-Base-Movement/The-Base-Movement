// src/pages/PaymentComplete.tsx
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import SEO from '@/components/SEO'

export default function PaymentComplete() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [countdown, setCountdown] = useState(3)

  const params = new URLSearchParams(window.location.search)
  const rawStatus = params.get('Status') ?? params.get('status') ?? 'Success'
  const reference =
    params.get('ClientReference') ?? params.get('clientReference') ?? params.get('reference') ?? ''
  const success = ['success', 'successful', 'paid', 'completed'].includes(rawStatus.toLowerCase())

  const targetPath = session ? '/dashboard/my-donations' : '/donate'

  useEffect(() => {
    // Notify opener if running in a popup window
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          { type: 'hubtel_complete', success, reference },
          window.location.origin
        )
        window.close()
      } catch {
        // Opener close blocked by browser policy
      }
    }

    // Notify parent if running inside an iframe
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'hubtel_complete', success, reference },
          window.location.origin
        )
      } catch {
        // Cross-origin iframe postMessage error
      }
    }

    // Auto-redirect timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate(targetPath, { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate, targetPath, success, reference])

  return (
    <>
      <SEO title="Payment Complete" noindex />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Public Sans', sans-serif",
          background: 'hsl(var(--background))',
          padding: 24,
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: success ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 36,
              color: success ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            }}
          >
            {success ? 'check_circle' : 'error'}
          </span>
        </div>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {success ? 'Payment Received' : 'Payment Verification Pending'}
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            {success
              ? 'Thank you for supporting The Base Movement. Your contribution has been recorded.'
              : 'Your transaction was submitted and is being processed.'}
          </p>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Redirecting to {session ? 'My Donations' : 'Donations'} in {countdown} second
          {countdown === 1 ? '' : 's'}…
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <Link to={targetPath} className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Go to My Donations
          </Link>
        </div>
      </div>
    </>
  )
}
