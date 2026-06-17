import { adminService } from '@/services/adminService'
import type { toast as ToastFn } from 'sonner'
import { BankDetailsEditor } from '@/components/admin/BankDetailsEditor'

interface MovementInfoTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: Record<string, unknown>) => void
  isSaving: boolean
  setIsSaving: (val: boolean) => void
  toast: typeof ToastFn
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

const hintSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  fontStyle: 'italic',
  marginTop: 4,
}

export function MovementInfoTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  setIsSaving,
  toast,
}: MovementInfoTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="panel">
        <div className="ph">
          <span>Authoritative Communications</span>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Contact Information */}
          <div
            className="settings-form-grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
          >
            <div>
              <label htmlFor="input-e727d9" style={labelSt}>
                Primary contact email
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  mail
                </span>
                <input
                  name="name-e727d9"
                  id="input-e727d9"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  value={(siteSettings.primary_email as string) || ''}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, primary_email: e.target.value })
                  }
                />
              </div>
              <p style={hintSt}>Used for contact forms and general inquiries.</p>
            </div>
            <div>
              <label htmlFor="input-phone123" style={labelSt}>
                Primary contact phone
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  call
                </span>
                <input
                  name="name-phone123"
                  id="input-phone123"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  value={(siteSettings.primary_phone as string) || ''}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, primary_phone: e.target.value })
                  }
                  placeholder="+233 55 123 4567, +233 24 987 6543"
                />
              </div>
              <p style={hintSt}>Separate multiple numbers with commas.</p>
            </div>
            <div>
              <label htmlFor="input-ce9df3" style={labelSt}>
                Newsletter dispatch email
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  campaign
                </span>
                <input
                  name="name-ce9df3"
                  id="input-ce9df3"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  value={(siteSettings.newsletter_email as string) || ''}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, newsletter_email: e.target.value })
                  }
                />
              </div>
              <p style={hintSt}>Authoritative sender for all movement broadcasts.</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="input-address" style={labelSt}>
                Primary physical address
              </label>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  location_on
                </span>
                <input
                  name="name-address"
                  id="input-address"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  value={(siteSettings.primary_address as string) || ''}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, primary_address: e.target.value })
                  }
                  placeholder="123 Independence Ave, Accra, Ghana"
                />
              </div>
              <label htmlFor="input-address-url" style={labelSt}>
                Address Google Maps URL
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  link
                </span>
                <input
                  name="name-address-url"
                  id="input-address-url"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  value={(siteSettings.primary_address_url as string) || ''}
                  onChange={(e) =>
                    setSiteSettings({ ...siteSettings, primary_address_url: e.target.value })
                  }
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
              <p style={hintSt}>Location displayed on contact pages.</p>
            </div>
          </div>

          {/* Palette */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                margin: '0 0 16px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
              >
                palette
              </span>
              Movement Palette Control
            </h3>
            <div className="settings-form-grid-3">
              {(
                [
                  {
                    key: 'primary_color',
                    label: 'Primary Brand (Green)',
                    desc: 'HSL value for the dominant identity color.',
                  },
                  {
                    key: 'accent_color',
                    label: 'Accent Highlight (Gold)',
                    desc: 'HSL value for secondary emphasis.',
                  },
                  {
                    key: 'destructive_color',
                    label: 'Destructive/Alert (Red)',
                    desc: 'HSL value for high-urgency elements.',
                  },
                  {
                    key: 'muted_foreground_color',
                    label: 'Muted Text (General)',
                    desc: 'HSL value for secondary labels/hints.',
                  },
                  {
                    key: 'on_surface_muted_color',
                    label: 'Muted Text (Dark)',
                    desc: 'HSL value for text on dark backgrounds.',
                  },
                ] as const
              ).map((color) => (
                <div key={color.key}>
                  <label htmlFor={`input-${color.key}`} style={labelSt}>
                    {color.label}
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        border: '1px solid hsl(var(--border))',
                        flexShrink: 0,
                        background: siteSettings[color.key]
                          ? `hsl(${siteSettings[color.key] as string})`
                          : 'transparent',
                      }}
                    />
                    <input
                      name={`name-${color.key}`}
                      id={`input-${color.key}`}
                      style={{ ...inputSt, fontFamily: 'monospace' }}
                      value={(siteSettings[color.key] as string) || ''}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, [color.key]: e.target.value })
                      }
                      placeholder="0 0% 0%"
                    />
                  </div>
                  <p style={{ ...hintSt, lineHeight: 1.5 }}>{color.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                margin: '0 0 16px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
              >
                text_fields
              </span>
              Tactical Typography Orchestration
            </h3>
            <div className="settings-form-grid">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label htmlFor="input-c7b696" style={{ ...labelSt, marginBottom: 0 }}>
                    Global font scale
                  </label>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {((siteSettings.font_scale_global as number) || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  name="name-c7b696"
                  id="input-c7b696"
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={(siteSettings.font_scale_global as number) || 1.0}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      font_scale_global: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
                />
                <p style={hintSt}>Adjusts the base font size for all paragraphs and body text.</p>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label htmlFor="input-375d88" style={{ ...labelSt, marginBottom: 0 }}>
                    Heading emphasis scale
                  </label>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {((siteSettings.font_scale_headings as number) || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  name="name-375d88"
                  id="input-375d88"
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.05"
                  value={(siteSettings.font_scale_headings as number) || 1.0}
                  onChange={(e) =>
                    setSiteSettings({
                      ...siteSettings,
                      font_scale_headings: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: '100%', accentColor: 'hsl(var(--primary))' }}
                />
                <p style={hintSt}>Specifically scales H1-H6 headings for high-impact visibility.</p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div
            style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 20,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              className="btn btn-primary"
              style={{ minWidth: 220, justifyContent: 'center' }}
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                const toastId = toast.loading('Syncing movement configurations…')
                try {
                  const settingsToUpdate = [
                    { key: 'primary_email', value: siteSettings.primary_email },
                    { key: 'primary_phone', value: siteSettings.primary_phone },
                    { key: 'primary_address', value: siteSettings.primary_address },
                    { key: 'primary_address_url', value: siteSettings.primary_address_url },
                    { key: 'newsletter_email', value: siteSettings.newsletter_email },
                    { key: 'primary_color', value: siteSettings.primary_color },
                    { key: 'accent_color', value: siteSettings.accent_color },
                    { key: 'destructive_color', value: siteSettings.destructive_color },
                    {
                      key: 'registration_form_ghana_url',
                      value: siteSettings.registration_form_ghana_url,
                    },
                    {
                      key: 'registration_form_diaspora_url',
                      value: siteSettings.registration_form_diaspora_url,
                    },
                    { key: 'font_scale_global', value: siteSettings.font_scale_global },
                    { key: 'font_scale_headings', value: siteSettings.font_scale_headings },
                    { key: 'muted_foreground_color', value: siteSettings.muted_foreground_color },
                    { key: 'on_surface_muted_color', value: siteSettings.on_surface_muted_color },
                  ]
                  await Promise.all(
                    settingsToUpdate
                      .filter((s) => s.value !== undefined)
                      .map((s) => adminService.updateSiteSetting(s.key, s.value))
                  )
                  window.dispatchEvent(new CustomEvent('site_settings_updated'))
                  toast.success('Movement configurations synchronized', { id: toastId })
                } catch (err: unknown) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to update movement telemetry',
                    { id: toastId }
                  )
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {isSaving ? 'Updating…' : 'Update Configurations'}
            </button>
          </div>
        </div>
      </div>

      <BankDetailsEditor />
    </div>
  )
}
