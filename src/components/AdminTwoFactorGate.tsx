/**
 * AdminTwoFactorGate Component
 * -------------------------------------------------------------
 * Full-screen 2FA gate checking authenticator codes.
 * Prompts user for a 6-digit verification code, launches a Supabase MFA challenge,
 * and validates before letting authorized admins access dashboard controls.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminTwoFactorGateProps {
  factorId: string
  onVerified: () => void
}

/**
 * AdminTwoFactorGate component definition.
 */
export default function AdminTwoFactorGate({ factorId, onVerified }: AdminTwoFactorGateProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Challenge-verify transaction checking codes.
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length < 6) return
    setIsLoading(true)
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId })
      if (challenge.error) throw challenge.error
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      })
      if (verify.error) throw verify.error
      toast.success('Identity confirmed. Opening Command Center.')
      onVerified()
    } catch {
      toast.error('Invalid verification code. Please try again.')
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#181d19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          borderTop: '4px solid hsl(var(--accent))',
          padding: '32px 28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 36, color: 'hsl(var(--primary))' }}
          >
            shield_lock
          </span>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              color: '#181d19',
              margin: '10px 0 6px',
            }}
          >
            Admin verification required
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12.5,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Enter the 6-digit code from your authenticator app to access the admin dashboard.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoFocus
            style={{
              width: '100%',
              height: 52,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              fontSize: 24,
              letterSpacing: '0.4em',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#181d19',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 14,
            }}
          />
          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="btn btn-primary"
            style={{ width: '100%', height: 44, fontSize: 13 }}
          >
            {isLoading ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link
            to="/dashboard"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              textDecoration: 'none',
            }}
          >
            ← Back to member dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
