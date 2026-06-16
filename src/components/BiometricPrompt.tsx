import { useState } from 'react'
import { deviceTrackingService, type EvaluateResult } from '@/services/deviceTrackingService'

/**
 * Full-screen biometric prompt shown after device capture when a passkey step is
 * needed. Two modes, driven by the evaluate decision:
 *   - enrol  : device has no passkey yet — offer to set up Windows Hello / Face ID.
 *   - stepup : unknown/changed device — verify identity with the existing passkey
 *              (falls back to enrolment if no passkey exists anywhere).
 *
 * WebAuthn requires a user gesture, so every ceremony is triggered by a button.
 *   - enrol mode is non-blocking: "Set up later" lets the user proceed.
 *   - step-up mode is MANDATORY (it only fires when the device's ISP/network
 *     changed): the user must re-verify with their biometric to continue, or
 *     cancel — which signs them out. There is no skip-through.
 */
export default function BiometricPrompt({
  result,
  onDone,
  onCancel,
}: {
  result: EvaluateResult
  onDone: () => void
  onCancel?: () => void
}) {
  const isStepUp = result.decision === 'step_up_required'
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const runEnrol = async (rebind: boolean) => {
    setStatus('working')
    setMessage('')
    try {
      await deviceTrackingService.enrolBiometric(result.device_id, {
        rebind,
        fingerprintHash: result.fingerprint_hash,
      })
      onDone()
    } catch (err) {
      console.warn('[biometric] enrol failed:', err)
      setStatus('error')
      setMessage('Biometric setup was cancelled or failed.')
    }
  }

  const runStepUp = async () => {
    if (!result.device_id || !result.fingerprint_hash) return onDone()
    setStatus('working')
    setMessage('')
    try {
      const outcome = await deviceTrackingService.stepUpBiometric(
        result.device_id,
        result.fingerprint_hash
      )
      if (outcome === 'verified') return onDone()
      if (outcome === 'needs_enrol') return runEnrol(true) // no passkey yet → enrol + rebind
      setStatus('error')
      setMessage('We could not verify your biometric. Try again to continue.')
    } catch (err) {
      console.warn('[biometric] step-up failed:', err)
      setStatus('error')
      setMessage('Verification was cancelled. Try again to continue.')
    }
  }

  const title = isStepUp ? 'Verify this device' : 'Secure this device'
  const body = isStepUp
    ? 'Your network has changed since this device was last verified. Re-verify with your biometric (Windows Hello / Face ID) to continue.'
    : 'Add a biometric (Windows Hello / Face ID / fingerprint) so only your devices can reach the admin panel.'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: 'min(420px, 92vw)',
          textAlign: 'center',
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
            margin: '0 auto 16px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
          >
            fingerprint
          </span>
        </div>

        <p
          style={{
            margin: '0 0 8px',
            fontSize: 18,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {title}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          {body}
        </p>

        {message && (
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'hsl(var(--destructive))' }}>
            {message}
          </p>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 10 }}
          disabled={status === 'working'}
          onClick={() => (isStepUp ? runStepUp() : runEnrol(false))}
        >
          {status === 'working'
            ? 'Waiting for biometric…'
            : isStepUp
              ? 'Verify with biometric'
              : 'Enable biometric'}
        </button>

        <button
          className="btn btn-ghost"
          style={{ width: '100%' }}
          disabled={status === 'working'}
          onClick={isStepUp ? (onCancel ?? onDone) : onDone}
        >
          {isStepUp ? 'Cancel & sign out' : 'Set up later'}
        </button>
      </div>
    </div>
  )
}
