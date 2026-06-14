import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import {
  deviceTrackingService,
  isDeviceTrackedRole,
  type EvaluateResult,
} from '@/services/deviceTrackingService'
import BiometricPrompt from '@/components/BiometricPrompt'

/**
 * Device-binding capture for privileged admin roles, rendered by
 * ProtectedAdminRoute after the 2FA gate.
 *
 *  - Runs once per browser session (sessionStorage flag), like the 2FA gate.
 *  - Non-blocking + fail-open: any error lets the admin through; only a slot
 *    explicitly marked `blocked` shows a stop screen.
 *  - When the decision needs a passkey step (enrol a new/unenrolled device, or
 *    step-up on an unknown device) a BiometricPrompt overlay is shown. The user
 *    already passed 2FA, so the prompt is skippable and never locks anyone out.
 */
const CAPTURE_KEY = 'admin_device_captured'

export default function AdminDeviceCapture() {
  const [blocked, setBlocked] = useState(false)
  const [prompt, setPrompt] = useState<EvaluateResult | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (sessionStorage.getItem(CAPTURE_KEY) === '1') return
    ;(async () => {
      try {
        // adminService may not be initialised yet at mount — resolve the current
        // admin first (same pattern as ITDepartmentLayout) before deciding.
        const user = adminService.getCurrentUser() ?? (await adminService.initialize())
        if (!user || !isDeviceTrackedRole(user.role)) {
          sessionStorage.setItem(CAPTURE_KEY, '1')
          return
        }

        const res = await deviceTrackingService.evaluateCurrentDevice()

        if (res?.tracked && res.decision === 'blocked') {
          setBlocked(true)
          return // do not set the flag — re-check on next entry
        }

        const needsPasskey =
          res?.tracked &&
          (res.decision === 'step_up_required' || (res.webauthn_required && !!res.device_id))

        if (needsPasskey) {
          setPrompt(res) // resolve via the BiometricPrompt overlay
          return
        }

        sessionStorage.setItem(CAPTURE_KEY, '1')
      } catch (err) {
        // Fail open: never block admin access on a capture error.
        console.warn('[device-capture] skipped:', err)
        sessionStorage.setItem(CAPTURE_KEY, '1')
      }
    })()
  }, [])

  if (blocked) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
          gap: 16,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'hsl(var(--destructive) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28, color: 'hsl(var(--destructive))' }}
          >
            block
          </span>
        </div>
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 18,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Device blocked
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              maxWidth: 360,
            }}
          >
            This device has been blocked for your account. Contact the IT department to restore
            access or register a new device.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Outlet />
      {prompt && (
        <BiometricPrompt
          result={prompt}
          onDone={() => {
            sessionStorage.setItem(CAPTURE_KEY, '1')
            setPrompt(null)
          }}
        />
      )}
    </>
  )
}
