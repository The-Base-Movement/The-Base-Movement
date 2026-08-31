import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import { defaultSettings } from '@/types/branding'

/**
 * IT/Settings control for the homepage welcome popup shown to logged-out
 * visitors. Writes `welcome_popup_enabled` / `welcome_popup_message` site
 * settings, then broadcasts so BrandingContext picks it up live. The popup
 * itself triggers once per homepage visit at 20% scroll, so there is no
 * dismissal state to reset here.
 */
// datetime-local wants "YYYY-MM-DDTHH:mm", not a full ISO string with seconds/zone
function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function WelcomePopupControl() {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const s = await adminService.getSiteSettings()
        setEnabled(s.welcome_popup_enabled === true || s.welcome_popup_enabled === 'true')
        setMessage(
          typeof s.welcome_popup_message === 'string'
            ? s.welcome_popup_message
            : String(defaultSettings.welcome_popup_message)
        )
        setStartAt(
          typeof s.welcome_popup_start_at === 'string'
            ? toDatetimeLocal(s.welcome_popup_start_at)
            : ''
        )
        setEndAt(
          typeof s.welcome_popup_end_at === 'string' ? toDatetimeLocal(s.welcome_popup_end_at) : ''
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function persist(next: {
    enabled: boolean
    message: string
    startAt: string
    endAt: string
  }) {
    setSaving(true)
    try {
      const results = await Promise.all([
        adminService.updateSiteSetting('welcome_popup_enabled', next.enabled),
        adminService.updateSiteSetting('welcome_popup_message', next.message.trim()),
        adminService.updateSiteSetting(
          'welcome_popup_start_at',
          next.startAt ? new Date(next.startAt).toISOString() : ''
        ),
        adminService.updateSiteSetting(
          'welcome_popup_end_at',
          next.endAt ? new Date(next.endAt).toISOString() : ''
        ),
      ])
      if (results.some((ok) => !ok)) throw new Error('save failed')
      window.dispatchEvent(new Event('site_settings_updated'))
      toast.success(next.enabled ? 'Welcome popup is ON' : 'Welcome popup is OFF')
    } catch {
      toast.error('Failed to update welcome popup')
      const s = await adminService.getSiteSettings()
      setEnabled(s.welcome_popup_enabled === true || s.welcome_popup_enabled === 'true')
    } finally {
      setSaving(false)
    }
  }

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    persist({ enabled: next, message, startAt, endAt })
  }

  function handleSaveMessage() {
    persist({ enabled, message, startAt, endAt })
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
            color: enabled ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
          }}
        >
          campaign
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
            Homepage Welcome Popup
          </h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.5,
            }}
          >
            Shows a dismissible one-time announcement to logged-out visitors on the homepage, with
            Log In / Create Account / FAQ buttons.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle welcome popup"
          disabled={loading || saving}
          onClick={handleToggle}
          style={{
            width: 44,
            height: 24,
            background: enabled ? 'hsl(var(--primary))' : 'hsl(var(--border))',
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

      <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
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
            rows={8}
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
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            The Log In Now, Create Account, and FAQ buttons are always shown below this message, no
            need to include links for them.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
              Active window (optional)
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
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
              End window (optional)
            </label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--card))',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <p
            style={{
              gridColumn: '1 / -1',
              margin: 0,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Leave either blank to not restrict that side. The toggle above is a master switch, it
            still has to be ON for the popup to show even inside this window.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={loading || saving}
            onClick={handleSaveMessage}
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
