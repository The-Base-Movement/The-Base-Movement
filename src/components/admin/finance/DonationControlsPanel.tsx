import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/context/AuthContext'

/**
 * Finance-dashboard controls for what the public donate page accepts.
 * Each flag is a site_setting; the public /donate page reads them and blocks
 * the matching submission path when a flag is off (master switch pauses all).
 * Editable by finance-owning roles; view-only for everyone else.
 */
type FlagKey =
  | 'donations_enabled'
  | 'donations_guest_enabled'
  | 'donations_individual_enabled'
  | 'donations_group_enabled'

const FLAGS: { key: FlagKey; label: string; desc: string; master?: boolean }[] = [
  {
    key: 'donations_enabled',
    label: 'All donations',
    desc: 'Master switch — when off, the public donate page is paused entirely.',
    master: true,
  },
  {
    key: 'donations_guest_enabled',
    label: 'Guest donations',
    desc: 'Allow visitors who are not logged in to donate.',
  },
  {
    key: 'donations_individual_enabled',
    label: 'Individual donations',
    desc: 'Allow a logged-in member to donate for themselves.',
  },
  {
    key: 'donations_group_enabled',
    label: 'Group donations',
    desc: 'Allow the “Donate as a group” option.',
  },
]

const EDIT_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'FINANCE_OFFICER'])

// Flags default ON when the setting row doesn't exist yet.
function readBool(v: unknown): boolean {
  return v === undefined || v === null ? true : v === true || v === 'true'
}

export function DonationControlsPanel() {
  const { user } = useAuth()
  const canEdit = EDIT_ROLES.has((user?.role ?? '').toUpperCase())

  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    donations_enabled: true,
    donations_guest_enabled: true,
    donations_individual_enabled: true,
    donations_group_enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<FlagKey | null>(null)

  useEffect(() => {
    adminService
      .getSiteSettings()
      .then((s) => {
        setFlags({
          donations_enabled: readBool(s.donations_enabled),
          donations_guest_enabled: readBool(s.donations_guest_enabled),
          donations_individual_enabled: readBool(s.donations_individual_enabled),
          donations_group_enabled: readBool(s.donations_group_enabled),
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function toggle(key: FlagKey) {
    if (!canEdit || savingKey) return
    const next = !flags[key]
    setFlags((f) => ({ ...f, [key]: next }))
    setSavingKey(key)
    const ok = await adminService.updateSiteSetting(key, next)
    setSavingKey(null)
    if (ok) {
      window.dispatchEvent(new Event('site_settings_updated'))
      const label = FLAGS.find((f) => f.key === key)?.label ?? 'Setting'
      toast.success(`${label} ${next ? 'enabled' : 'disabled'}`)
    } else {
      setFlags((f) => ({ ...f, [key]: !next })) // revert on failure
      toast.error('Failed to update setting')
    }
  }

  const masterOff = !flags.donations_enabled

  return (
    <div className="panel" style={{ overflow: 'hidden', marginBottom: 20 }}>
      {/* Colored section header */}
      <div
        style={{
          background: 'hsl(var(--panel-header))',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>
          tune
        </span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#fff',
            }}
          >
            Donation controls
          </h3>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
            {canEdit
              ? 'Control what the public donate page accepts'
              : 'View only — you cannot change these'}
          </p>
        </div>
      </div>

      <div style={{ padding: '8px 18px 14px' }}>
        {masterOff && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              margin: '10px 0',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--destructive) / 0.08)',
              border: '1px solid hsl(var(--destructive) / 0.25)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
            >
              pause_circle
            </span>
            <span style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}>
              Donations are paused — the public donate page is closed to all contributions.
            </span>
          </div>
        )}

        {FLAGS.map((f) => {
          const on = flags[f.key]
          // Sub-toggles are moot while the master switch is off — dim them.
          const dimmed = !f.master && masterOff
          const disabled = loading || !canEdit || savingKey === f.key
          return (
            <div
              key={f.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderTop: f.master ? 'none' : '1px solid hsl(var(--border))',
                opacity: dimmed ? 0.5 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {f.label}
                  {f.master && (
                    <span
                      className="pill pill-mute"
                      style={{ marginLeft: 8, fontSize: 9, verticalAlign: 'middle' }}
                    >
                      MASTER
                    </span>
                  )}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11.5,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {f.desc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Toggle ${f.label}`}
                disabled={disabled}
                onClick={() => toggle(f.key)}
                style={{
                  width: 44,
                  height: 24,
                  background: on ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: on ? 'flex-end' : 'flex-start',
                  padding: '0 3px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: 'none',
                  outline: 'none',
                  flexShrink: 0,
                  opacity: disabled ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    background: 'hsl(var(--card))',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                  }}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
