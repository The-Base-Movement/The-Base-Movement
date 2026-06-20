import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
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
 *  - Unexpected capture errors still fail open so transient API faults do not
 *    lock out admins.
 *  - Hard-blocked slots and non-Brave browsers show the stop screen.
 *  - A changed Brave fingerprint on a biometric-enrolled slot requires a
 *    successful WebAuthn step-up before the fingerprint can be rebound.
 *  - When the enrolled device has no passkey yet, a BiometricPrompt overlay is
 *    shown so the admin can bind Windows Hello / Face ID to the known device.
 */
const CAPTURE_KEY = 'admin_device_captured'

export default function AdminDeviceCapture() {
  const [blocked, setBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState<string | null>(null)
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
          setBlockReason(res.reason ?? null)
          setBlocked(true)
          return // do not set the flag — re-check on next entry
        }

        const needsPasskey =
          res?.tracked &&
          (res.decision === 'step_up_required' || res.webauthn_required) &&
          !!res.device_id

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
    const isBrowserBlock = blockReason === 'non_brave_browser'
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
            background: isBrowserBlock
              ? 'hsl(var(--accent) / 0.12)'
              : 'hsl(var(--destructive) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 28,
              color: isBrowserBlock ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
            }}
          >
            {isBrowserBlock ? 'security_update_warning' : 'block'}
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
            {isBrowserBlock ? 'Brave Browser Required' : 'Device blocked'}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              maxWidth: 380,
              lineHeight: 1.6,
            }}
          >
            {isBrowserBlock ? (
              <>
                Security policy requires{' '}
                <strong style={{ color: 'hsl(var(--on-surface))' }}>Brave Browser</strong> for all
                admin logins. Please switch to Brave to continue. <br />
                <span style={{ fontSize: 12, marginTop: 6, display: 'inline-block' }}>
                  If you are using Brave, disable{' '}
                  <strong style={{ color: 'hsl(var(--on-surface))' }}>Fingerprint Shielding</strong>{' '}
                  for this site via the Brave Shield icon in the address bar.
                </span>
              </>
            ) : (
              'This device has been blocked for your account. Contact the IT department to restore access or register a new device.'
            )}
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
          onCancel={async () => {
            // Mandatory ISP-change re-verify was declined → sign out, do not enter.
            try {
              await authService.logout()
            } finally {
              window.location.assign('/login')
            }
          }}
        />
      )}
    </>
  )
}
