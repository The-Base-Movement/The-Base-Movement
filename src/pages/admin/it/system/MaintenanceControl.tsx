import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'

const DEFAULT_TITLE = 'Back shortly.'
const DEFAULT_MESSAGE =
  'We are carrying out scheduled maintenance. This usually takes less than 15 minutes. Thank you for your patience, patriot.'

/**
 * IT control for the public/member-facing maintenance splash. Writes the
 * `maintenance_mode`, `maintenance_title` and `maintenance_message` site
 * settings, then broadcasts so the BrandingContext (and the gate) react live.
 * The admin panel itself is never gated, so this page stays reachable.
 */
export function MaintenanceControl() {
  const [enabled, setEnabled] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const s = await adminService.getSiteSettings()
        setEnabled(s.maintenance_mode === true || s.maintenance_mode === 'true')
        setTitle(typeof s.maintenance_title === 'string' ? s.maintenance_title : '')
        setMessage(typeof s.maintenance_message === 'string' ? s.maintenance_message : '')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function persist(next: { enabled: boolean; title: string; message: string }) {
    setSaving(true)
    try {
      const results = await Promise.all([
        adminService.updateSiteSetting('maintenance_mode', next.enabled),
        adminService.updateSiteSetting('maintenance_title', next.title.trim()),
        adminService.updateSiteSetting('maintenance_message', next.message.trim()),
      ])
      if (results.some((ok) => !ok)) throw new Error('save failed')
      // Refresh BrandingContext so the gate flips without a reload.
      window.dispatchEvent(new Event('site_settings_updated'))
      toast.success(
        next.enabled
          ? 'Maintenance mode is ON — the site is now offline'
          : 'Maintenance mode is OFF — the site is live'
      )
    } catch {
      toast.error('Failed to update maintenance mode')
      // Re-sync the toggle from the server on failure.
      const s = await adminService.getSiteSettings()
      setEnabled(s.maintenance_mode === true || s.maintenance_mode === 'true')
    } finally {
      setSaving(false)
    }
  }

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    persist({ enabled: next, title, message })
  }

  return (
    <div className="panel" style={{ padding: 20, marginBottom: 28 }}>
      <div
        className="ph"
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: enabled ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
          }}
        >
          {enabled ? 'cloud_off' : 'public'}
        </span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Maintenance Mode
          </h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.5,
            }}
          >
            Take the public site and member portal offline with a maintenance splash. The admin
            panel stays accessible so you can switch it back on.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle maintenance mode"
          disabled={loading || saving}
          onClick={handleToggle}
          style={{
            width: 44,
            height: 24,
            background: enabled ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: enabled ? 'flex-end' : 'flex-start',
            padding: '0 3px',
            cursor: loading || saving ? 'not-allowed' : 'pointer',
            border: 'none',
            outline: 'none',
            flexShrink: 0,
            opacity: loading || saving ? 0.6 : 1,
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

      {enabled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            marginBottom: 16,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--destructive) / 0.08)',
            border: '1px solid hsl(var(--destructive) / 0.25)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
          >
            warning
          </span>
          <span style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}>
            The public site is currently offline to visitors and members.
          </span>
        </div>
      )}

      {/* Editable copy shown on the splash */}
      <div style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 6,
            }}
          >
            Headline
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={DEFAULT_TITLE}
            disabled={loading}
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--card))',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 6,
            }}
          >
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={DEFAULT_MESSAGE}
            rows={3}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--card))',
              boxSizing: 'border-box',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={loading || saving}
            onClick={() => persist({ enabled, title, message })}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              save
            </span>
            Save message
          </button>
        </div>
      </div>
    </div>
  )
}
