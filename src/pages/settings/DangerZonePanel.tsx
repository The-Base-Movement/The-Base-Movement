import { useState } from 'react'
import { toast } from 'sonner'
import { authService } from '@/services/authService'

export function DangerZonePanel({ fullName }: { fullName: string }) {
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const confirmed = confirmation.trim() === fullName.trim() && fullName.trim().length > 0

  const deactivate = async () => {
    if (!confirmed) return
    setLoading(true)
    try {
      await authService.deactivateAccount(confirmation)
      window.location.assign('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate account')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: '20px 22px',
        border: '2px dashed hsl(var(--destructive) / 25%)',
        borderRadius: 'var(--radius-sm)',
        background: 'hsl(var(--destructive) / 3%)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'hsl(var(--destructive))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              marginBottom: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              warning
            </span>
            Danger zone
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              maxWidth: 520,
              lineHeight: 1.55,
            }}
          >
            Deactivating your membership blocks sign-in and removes your profile from active member
            lists. An administrator can restore it later.
          </p>
        </div>

        <label style={{ fontSize: 12, color: 'hsl(var(--on-surface))', maxWidth: 420 }}>
          Type <strong>{fullName}</strong> to confirm
          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={loading}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 6 }}
          />
        </label>

        <button
          type="button"
          className="btn btn-dest btn-sm"
          disabled={!confirmed || loading}
          onClick={deactivate}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Deactivating…' : 'Deactivate membership'}
        </button>
      </div>
    </div>
  )
}
