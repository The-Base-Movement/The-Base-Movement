import { adminService } from '@/services/adminService'
import type { toast as ToastFn } from 'sonner'

interface AboutPageTabProps {
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

const textareaSt: React.CSSProperties = {
  ...inputSt,
  height: 'auto',
  padding: '10px 12px',
  resize: 'vertical',
  lineHeight: 1.6,
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

const sectionHeadSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  color: 'hsl(var(--on-surface))',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  margin: '0 0 16px',
}

const PILLARS = [
  { key: 'about_pillar_mission', label: 'Our Mission', hint: 'Left column — pillar 1' },
  { key: 'about_pillar_vision', label: 'Our Vision', hint: 'Left column — pillar 2' },
  { key: 'about_pillar_values', label: 'Our Values', hint: 'Left column — pillar 3' },
  { key: 'about_pillar_leadership', label: 'Leadership', hint: 'Right column — pillar 1' },
  { key: 'about_pillar_ghana_network', label: 'Ghana Network', hint: 'Right column — pillar 2' },
  { key: 'about_pillar_diaspora', label: 'Diaspora Network', hint: 'Right column — pillar 3' },
]

export function AboutPageTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  setIsSaving,
  toast,
}: AboutPageTabProps) {
  return (
    <div className="panel">
      <div className="ph">
        <span>About Page Content</span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Hero */}
        <div>
          <h3 style={sectionHeadSt}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
            >
              title
            </span>
            Hero section
          </h3>
          <label htmlFor="about-tagline" style={labelSt}>
            Tagline paragraph
          </label>
          <textarea
            id="about-tagline"
            rows={3}
            style={textareaSt}
            value={(siteSettings.about_hero_tagline as string) || ''}
            onChange={(e) =>
              setSiteSettings({ ...siteSettings, about_hero_tagline: e.target.value })
            }
            placeholder="We are a political movement dedicated to the transformation of Ghana…"
          />
          <p style={hintSt}>The paragraph below the About The Base heading.</p>
        </div>

        {/* Pillars */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>
          <h3 style={sectionHeadSt}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
            >
              grid_view
            </span>
            Pillar descriptions
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {PILLARS.map((p) => (
              <div key={p.key}>
                <label htmlFor={`about-${p.key}`} style={labelSt}>
                  {p.label}
                </label>
                <textarea
                  id={`about-${p.key}`}
                  rows={3}
                  style={textareaSt}
                  value={(siteSettings[p.key] as string) || ''}
                  onChange={(e) => setSiteSettings({ ...siteSettings, [p.key]: e.target.value })}
                />
                <p style={hintSt}>{p.hint}</p>
              </div>
            ))}
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
            className="btn btn-primary btn-sm"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true)
              const toastId = toast.loading('Saving about page…')
              try {
                const keys = ['about_hero_tagline', ...PILLARS.map((p) => p.key)]
                await Promise.all(
                  keys
                    .filter((k) => siteSettings[k] !== undefined)
                    .map((k) => adminService.updateSiteSetting(k, siteSettings[k]))
                )
                window.dispatchEvent(new CustomEvent('site_settings_updated'))
                toast.success('About page updated', { id: toastId })
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to save', { id: toastId })
              } finally {
                setIsSaving(false)
              }
            }}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
