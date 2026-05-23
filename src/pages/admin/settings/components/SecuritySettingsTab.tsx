import type { Factor } from '@supabase/supabase-js'
import { createPortal } from 'react-dom'

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface MfaEnrollData {
  id: string
  qr: string
}

interface SecuritySettingsTabProps {
  passwordForm: PasswordForm
  setPasswordForm: (form: PasswordForm) => void
  isSaving: boolean
  handleUpdatePassword: () => void
  mfaFactors: Factor[]
  handleStartMfaEnroll: () => void
  handleUnenrollMfa: (id: string) => void
  showMfaDialog: boolean
  setShowMfaDialog: (show: boolean) => void
  mfaStep: 'qr' | 'verify'
  setMfaStep: (step: 'qr' | 'verify') => void
  mfaEnrollData: MfaEnrollData | null
  mfaCode: string
  setMfaCode: (code: string) => void
  handleVerifyMfa: () => void
}

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

export function SecuritySettingsTab({
  passwordForm,
  setPasswordForm,
  isSaving,
  handleUpdatePassword,
  mfaFactors,
  handleStartMfaEnroll,
  handleUnenrollMfa,
  showMfaDialog,
  setShowMfaDialog,
  mfaStep,
  setMfaStep,
  mfaEnrollData,
  mfaCode,
  setMfaCode,
  handleVerifyMfa,
}: SecuritySettingsTabProps) {
  const mfaActive = mfaFactors.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Password panel */}
      <div className="panel">
        <div className="ph">
          <span>Security Credentials</span>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="input-577d4f" style={labelSt}>
                New password
              </label>
              <input
                name="name-577d4f"
                id="input-577d4f"
                type="password"
                style={inputSt}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="input-5fe6aa" style={labelSt}>
                Confirm new password
              </label>
              <input
                name="name-5fe6aa"
                id="input-5fe6aa"
                type="password"
                style={inputSt}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleUpdatePassword}
              disabled={isSaving || !passwordForm.newPassword}
            >
              {isSaving ? 'Hardening…' : 'Harden Security Credentials'}
            </button>
          </div>
        </div>
      </div>

      {/* MFA panel */}
      <div className="panel">
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Row 1: icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: mfaActive ? 'rgba(16,185,129,0.08)' : 'hsl(var(--container-low))',
                border: `1px solid ${mfaActive ? 'rgba(16,185,129,0.2)' : 'hsl(var(--border))'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  color: mfaActive ? '#10b981' : 'hsl(var(--on-surface-muted))',
                }}
              >
                smartphone
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              Two-Factor Authentication
            </p>
          </div>
          {/* Row 2: status badge */}
          {mfaActive ? (
            <span className="pill pill-ok" style={{ alignSelf: 'flex-start' }}>
              Protected
            </span>
          ) : (
            <span className="pill pill-warn" style={{ alignSelf: 'flex-start' }}>
              Not configured
            </span>
          )}
          {/* Row 3: description */}
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Add an extra layer of security to your admin account by requiring a verification code
            from your mobile device.
          </p>
          {/* Row 4: action button */}
          {mfaActive ? (
            <button
              className="btn btn-dest btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => handleUnenrollMfa(mfaFactors[0].id)}
            >
              Disable protection
            </button>
          ) : (
            <button
              className="btn btn-outline btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={handleStartMfaEnroll}
            >
              Enable MFA Protection
            </button>
          )}
        </div>
      </div>

      {/* MFA setup modal */}
      {showMfaDialog &&
        createPortal(
          <>
            <div
              onClick={() => setShowMfaDialog(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }}
            />
            <div
              style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%,-50%)',
                background: '#fff',
                borderRadius: 4,
                padding: 28,
                width: '90%',
                maxWidth: 400,
                zIndex: 101,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 4px',
                }}
              >
                Configure MFA
              </h3>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 20px',
                }}
              >
                Follow these steps to secure your administrative account.
              </p>

              {mfaStep === 'qr' && mfaEnrollData && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 4,
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <img
                      src={mfaEnrollData.qr}
                      alt="MFA QR Code"
                      style={{ width: 192, height: 192 }}
                      decoding="async"
                      loading="lazy"
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        margin: '0 0 4px',
                      }}
                    >
                      Scan this QR Code
                    </p>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      Use Google Authenticator, Authy, or any TOTP app.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setMfaStep('verify')}
                  >
                    I've scanned it, proceed
                  </button>
                </div>
              )}

              {mfaStep === 'verify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="input-007f09" style={labelSt}>
                      Verification code
                    </label>
                    <input
                      name="mfaCode"
                      id="input-007f09"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="000 000"
                      maxLength={6}
                      style={{
                        ...inputSt,
                        textAlign: 'center',
                        fontSize: 22,
                        letterSpacing: '0.4em',
                        height: 52,
                        fontWeight: 'var(--font-weight-semibold, 600)',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        textAlign: 'center',
                        marginTop: 6,
                      }}
                    >
                      Enter the 6-digit code from your authenticator app.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleVerifyMfa}
                    disabled={isSaving || mfaCode.length < 6}
                  >
                    {isSaving ? 'Verifying…' : 'Verify and Enable MFA'}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setMfaStep('qr')}
                  >
                    Go back to QR code
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
