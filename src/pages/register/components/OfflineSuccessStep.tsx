import { useState } from 'react'
import type { RegistrationFormData } from '@/types/registration'
import { useOfflineSync } from '@/hooks/useOfflineSync'

interface OfflineSuccessStepProps {
  formData: RegistrationFormData
  photoUrl?: string | null
  selfieUrl?: string | null
  onRegisterAnother: () => void
}

export function OfflineSuccessStep({
  formData,
  photoUrl,
  selfieUrl,
  onRegisterAnother,
}: OfflineSuccessStepProps) {
  const { isOnline, isSyncing, triggerSync } = useOfflineSync()
  const [syncInitiated, setSyncInitiated] = useState(false)

  const firstName = formData.fullName.split(' ')[0]

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return
    setSyncInitiated(true)
    await triggerSync()
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
      {/* Success Title Header */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{
            background: 'rgba(234, 179, 8, 0.12)', // gold transparency
            color: '#eab308',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
            cloud_off
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-on-surface tracking-tighter font-meta mb-2">
          Saved Offline Successfully
        </h1>
        <p className="text-on-surface-muted font-meta tracking-tight text-xs max-w-md mx-auto">
          Welcome to the movement, {firstName}. Your registration is securely stored on this device
          as a draft.
        </p>
      </div>

      <div className="space-y-8">
        {/* Offline Status Vault Panel */}
        <div
          className="panel"
          style={{
            padding: '24px 28px',
            position: 'relative',
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          {/* Brand Left bar - Gold to indicate cached draft state */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: '#eab308',
            }}
          />

          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
            <h3 className="font-meta font-semibold text-[13px] text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-accent" style={{ fontSize: 18 }}>
                encrypted
              </span>
              Offline Draft Encryption Vault
            </h3>
            <span
              className="pill font-medium text-[10px]"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                padding: '3px 8px',
              }}
            >
              LOCALLY SECURED
            </span>
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                check_circle
              </span>
              <div>
                <h4 className="text-xs font-semibold text-on-surface font-meta mb-0.5">
                  Compatriot Registration Draft Created
                </h4>
                <p className="text-[11px] text-on-surface-muted font-medium">
                  Form data for <strong>{formData.fullName}</strong> captured successfully.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                check_circle
              </span>
              <div>
                <h4 className="text-xs font-semibold text-on-surface font-meta mb-0.5">
                  Biometrics & Identity Documents Cached
                </h4>
                <p className="text-[11px] text-on-surface-muted font-medium">
                  {photoUrl || selfieUrl
                    ? 'ID Card scanning and selfie files saved securely in local IndexedDB store.'
                    : 'Information validated. Profile ready for server deployment.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  color: isOnline ? 'var(--primary)' : '#eab308',
                  animation: !isOnline ? 'pulse 2s infinite ease-in-out' : 'none',
                }}
              >
                {isOnline ? 'check_circle' : 'hourglass_empty'}
              </span>
              <div>
                <h4 className="text-xs font-semibold text-on-surface font-meta mb-0.5">
                  {isOnline ? 'Uplink Signal Available' : 'Awaiting HQ Network Uplink'}
                </h4>
                <p className="text-[11px] text-on-surface-muted font-medium">
                  {isOnline
                    ? 'Internet connection detected! Ready to synchronize draft.'
                    : 'System is waiting for internet connection. Will auto-sync once signal is restored.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Controls & Next Steps */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Sync Trigger Panel */}
          <div
            className="panel"
            style={{
              padding: 24,
              background: isOnline ? 'rgba(26, 107, 60, 0.04)' : '#fafafa',
              border: isOnline ? '1px solid rgba(26, 107, 60, 0.2)' : '1px solid #eeeeee',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 className="font-meta font-semibold text-xs text-on-surface tracking-tight mb-2">
                Synchronization
              </h4>
              <p className="text-[11px] text-on-surface-muted font-medium leading-relaxed mb-4">
                {isOnline
                  ? 'Your device is online. Trigger synchronization to permanently upload this compatriot to HQ.'
                  : 'You are currently offline. Check your network or data settings. Manual retry triggers upload.'}
              </p>
            </div>

            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
              className="btn btn-primary"
              style={{
                width: 'full',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                cursor: isOnline && !isSyncing ? 'pointer' : 'not-allowed',
                background: isOnline ? '#1a6b3c' : '#a3a3a3',
                opacity: isOnline ? 1 : 0.6,
                border: 'none',
                color: '#ffffff',
                fontWeight: 'var(--font-weight-medium, 500)',
                boxShadow: isOnline ? '0 4px 10px rgba(26, 107, 60, 0.2)' : 'none',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 16,
                  animation: isSyncing ? 'spin 1.5s infinite linear' : 'none',
                }}
              >
                {isSyncing ? 'sync' : 'publish'}
              </span>
              {isSyncing
                ? 'Syncing profile...'
                : syncInitiated
                  ? 'Synchronized!'
                  : 'Sync to HQ Now'}
            </button>
          </div>

          {/* Register Another Panel */}
          <div
            className="panel"
            style={{
              padding: 24,
              background: '#ffffff',
              border: '1px solid #eeeeee',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 className="font-meta font-semibold text-xs text-on-surface tracking-tight mb-2">
                Register Next Compatriot
              </h4>
              <p className="text-[11px] text-on-surface-muted font-medium leading-relaxed mb-4">
                Working in a low-signal area? You can proceed to register another Ghanaian citizen
                offline. Their drafts will queue up locally.
              </p>
            </div>

            <button
              onClick={onRegisterAnother}
              className="btn btn-outline"
              style={{
                width: 'full',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 12,
                cursor: 'pointer',
                borderColor: '#e5e5e5',
                color: 'var(--on-surface)',
                background: '#ffffff',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                person_add
              </span>
              Register Another Offline
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
