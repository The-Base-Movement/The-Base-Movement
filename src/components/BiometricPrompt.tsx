/**
 * BiometricPrompt Component
 * -------------------------------------------------------------
 * A full-screen dialog handling WebAuthn credential ceremonies (passkeys / fingerprints).
 * Modes:
 * - enroll: Binds Windows Hello / Face ID passkeys to the user profile
 * - step-up: Mandatory verification of biometrics when security context (like Brave fingerprints) changes
 */

import { useState } from 'react'
import { deviceTrackingService, type EvaluateResult } from '@/services/deviceTrackingService'

/**
 * BiometricPrompt component definition.
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
  const [canRecover, setCanRecover] = useState(false)

  /**
   * Invokes WebAuthn navigator credentials API to register/enroll a new biometric credential.
   */
  const runEnrol = async (rebind: boolean) => {
    setStatus('working')
    setMessage('')
    try {
      const verified = await deviceTrackingService.enrolBiometric(result.device_id, {
        rebind,
        fingerprintHash: result.fingerprint_hash,
      })
      if (!verified) throw new Error('Biometric setup was not verified.')
      onDone()
    } catch (err) {
      console.warn('[biometric] enrol failed:', err)
      setStatus('error')
      setMessage('Biometric setup was cancelled or failed.')
    }
  }

  /**
   * Invokes WebAuthn navigator credentials assertion/challenge API to verify the existing passkey.
   */
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
      if (outcome === 'needs_enrol') return runEnrol(true)
      setStatus('error')
      setMessage('We could not verify your biometric. Try again to continue.')
      setCanRecover(true)
    } catch (err) {
      console.warn('[biometric] step-up failed:', err)
      setStatus('error')
      setMessage(
        'The previous biometric could not be used. Retry, or recover after reinstalling Brave.'
      )
      setCanRecover(true)
    }
  }

  const title = isStepUp ? 'Verify this device' : 'Secure this device'
  const body = isStepUp
    ? 'Brave needs to confirm this registered device again. Verify with Windows Hello / Face ID to continue.'
    : 'Add a biometric (Windows Hello / Face ID / fingerprint) so only your devices can reach the admin panel.'

  const enrollFailed = !isStepUp && status === 'error'

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
            background: enrollFailed
              ? 'hsl(var(--destructive) / 0.08)'
              : 'hsl(var(--primary) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 28,
              color: enrollFailed ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
            }}
          >
            {enrollFailed ? 'warning' : 'fingerprint'}
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
          {enrollFailed ? 'Biometric setup failed' : title}
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          {enrollFailed
            ? 'The biometric setup was cancelled or your device does not support it. You can continue and set it up later from your profile settings.'
            : body}
        </p>

        {message && !enrollFailed && (
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'hsl(var(--destructive))' }}>
            {message}
          </p>
        )}

        {/* Enrollment failed: promote Continue as the primary action */}
        {enrollFailed ? (
          <>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 10 }}
              onClick={onDone}
            >
              Continue to admin panel
            </button>
            <button
              className="btn btn-ghost"
              style={{ width: '100%' }}
              onClick={() => runEnrol(false)}
            >
              Try biometric setup again
            </button>
          </>
        ) : (
          <>
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

            {isStepUp && canRecover && (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: 10 }}
                disabled={status === 'working'}
                onClick={() => runEnrol(true)}
              >
                Recover after Brave reinstall
              </button>
            )}

            <button
              className="btn btn-ghost"
              style={{ width: '100%' }}
              disabled={status === 'working'}
              onClick={isStepUp ? (onCancel ?? onDone) : onDone}
            >
              {isStepUp ? 'Cancel & sign out' : 'Set up later'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
