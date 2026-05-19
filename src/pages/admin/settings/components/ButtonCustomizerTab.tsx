import React from 'react'

interface ButtonCustomizerTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: Record<string, unknown>) => void
  isSaving: boolean
  handleSave: () => void
}

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 800,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

const sectionSt: React.CSSProperties = {
  borderTop: '1px solid hsl(var(--border))',
  paddingTop: 16,
}

const ToggleRow = ({
  label,
  desc,
  checked,
  onToggle,
}: {
  label: string
  desc: string
  checked: boolean
  onToggle: () => void
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 4,
      border: '1px solid hsl(var(--border))',
      background: 'hsl(var(--container-low))',
    }}
  >
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 800,
          fontSize: 12,
          color: 'hsl(var(--on-surface))',
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 700,
          fontSize: 11,
          color: 'hsl(var(--on-surface-muted))',
          margin: '2px 0 0',
        }}
      >
        {desc}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked ? 'true' : 'false'}
      aria-label={`Toggle ${label}`}
      onClick={onToggle}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 3px',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          background: '#fff',
          borderRadius: '50%',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  </div>
)

const OptionGrid = ({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: unknown
  onChange: (v: string) => void
}) => (
  <div className="btn-option-grid">
    {options.map((o) => (
      <button
        key={o.value}
        className={value === o.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        style={{
          justifyContent: 'center',
          whiteSpace: 'normal',
          textAlign: 'center',
          lineHeight: 1.3,
          minHeight: 36,
        }}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
)

export function ButtonCustomizerTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  handleSave,
}: ButtonCustomizerTabProps) {
  const set = (key: string, value: unknown) => setSiteSettings({ ...siteSettings, [key]: value })

  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span>Button Architecture</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Configure the movement's global interactive element parameters.
        </span>
      </div>
      <div style={{ padding: '20px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Border radius */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label style={{ ...labelSt, marginBottom: 0 }}>Global border radius</label>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--primary))',
                }}
              >
                {(siteSettings.button_border_radius as string) || '0.125rem'}
              </span>
            </div>
            <div
              className="thin-scroll"
              style={{
                overflowX: 'auto',
                paddingBottom: 6,
                paddingLeft: 2,
                paddingRight: 2,
                margin: '0 -2px',
              }}
            >
              <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
                {[
                  { label: 'Square', value: '0px' },
                  { label: 'XS', value: '0.125rem' },
                  { label: 'SM', value: '0.25rem' },
                  { label: 'MD', value: '0.5rem' },
                  { label: 'Full', value: '9999px' },
                ].map((r) => (
                  <button
                    key={r.value}
                    className={
                      siteSettings.button_border_radius === r.value
                        ? 'btn btn-primary btn-sm'
                        : 'btn btn-outline btn-sm'
                    }
                    style={{ justifyContent: 'center', minWidth: 72, borderRadius: r.value }}
                    onClick={() => set('button_border_radius', r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Neon glow */}
          <div style={sectionSt}>
            <label style={labelSt}>Visual Feedback</label>
            <ToggleRow
              label="Neon Glow Effects"
              desc="Toggle administrative glow signatures on hover."
              checked={!!siteSettings.button_neon_enabled}
              onToggle={() => set('button_neon_enabled', !siteSettings.button_neon_enabled)}
            />
          </div>

          {/* Font weight */}
          <div style={sectionSt}>
            <label style={labelSt}>Typography Weight</label>
            <OptionGrid
              options={[
                { label: 'Normal', value: '400' },
                { label: 'Bold', value: '700' },
                { label: 'Black', value: '900' },
              ]}
              value={siteSettings.button_font_weight}
              onChange={(v) => set('button_font_weight', v)}
            />
          </div>

          {/* Primary text */}
          <div style={sectionSt}>
            <label style={labelSt}>Primary Button Text</label>
            <OptionGrid
              options={[
                { label: 'Light Text', value: '0 0% 100%' },
                { label: 'Dark Text', value: '220 15% 15%' },
              ]}
              value={siteSettings.button_primary_text_color}
              onChange={(v) => set('button_primary_text_color', v)}
            />
          </div>

          {/* Gold text */}
          <div style={sectionSt}>
            <label style={labelSt}>Gold Button Text</label>
            <OptionGrid
              options={[
                { label: 'Light Text', value: '0 0% 100%' },
                { label: 'Dark Text', value: '220 15% 15%' },
              ]}
              value={siteSettings.button_gold_text_color}
              onChange={(v) => set('button_gold_text_color', v)}
            />
          </div>

          {/* Destructive text */}
          <div style={sectionSt}>
            <label style={labelSt}>Destructive Button Text</label>
            <OptionGrid
              options={[
                { label: 'Light Text (Recommended)', value: '0 0% 100%' },
                { label: 'Dark Text', value: '220 15% 15%' },
              ]}
              value={siteSettings.button_destructive_text_color}
              onChange={(v) => set('button_destructive_text_color', v)}
            />
          </div>

          {/* Active tab bg */}
          <div style={sectionSt}>
            <label htmlFor="input-15144a" style={labelSt}>
              Active Tab Background
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  flexShrink: 0,
                  background: siteSettings.button_active_tab_bg_color
                    ? `hsl(${siteSettings.button_active_tab_bg_color as string})`
                    : 'hsl(var(--primary))',
                }}
              />
              <input
                name="name-15144a"
                id="input-15144a"
                style={inputSt}
                value={(siteSettings.button_active_tab_bg_color as string) || ''}
                onChange={(e) => set('button_active_tab_bg_color', e.target.value)}
                placeholder="0 0% 0%"
              />
            </div>
          </div>

          {/* Active tab text note */}
          <div style={sectionSt}>
            <label style={labelSt}>Active Tab Text</label>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Always white — ensures readable contrast on any active tab background color.
            </p>
          </div>

          {/* Inactive tab bg */}
          <div style={sectionSt}>
            <label htmlFor="input-aa8b63" style={labelSt}>
              Inactive Tab Background
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  flexShrink: 0,
                  background: siteSettings.button_inactive_tab_bg_color
                    ? `hsl(${siteSettings.button_inactive_tab_bg_color as string})`
                    : '#fff',
                }}
              />
              <input
                name="name-aa8b63"
                id="input-aa8b63"
                style={inputSt}
                value={(siteSettings.button_inactive_tab_bg_color as string) || ''}
                onChange={(e) => set('button_inactive_tab_bg_color', e.target.value)}
                placeholder="0 0% 100%"
              />
            </div>
          </div>

          {/* Inactive tab text */}
          <div style={sectionSt}>
            <label style={labelSt}>Inactive Tab Text</label>
            <OptionGrid
              options={[
                { label: 'Light Text', value: '0 0% 100%' },
                { label: 'Dark Text', value: '156 100% 21%' },
              ]}
              value={siteSettings.button_inactive_tab_text_color}
              onChange={(v) => set('button_inactive_tab_text_color', v)}
            />
          </div>

          {/* Preview */}
          <div
            style={{
              ...sectionSt,
              background: 'hsl(var(--container-low))',
              padding: 16,
              borderRadius: 4,
              border: '1px solid hsl(var(--border))',
            }}
          >
            <style>{`
              .preview-gallery-container {
                --button-radius: ${siteSettings.button_border_radius || '0.125rem'};
                --button-font-weight: ${siteSettings.button_font_weight || '700'};
                --primary-foreground: ${siteSettings.button_primary_text_color || '0 0% 100%'};
                --accent-foreground: ${siteSettings.button_gold_text_color || '0 0% 100%'};
                --destructive-foreground: ${siteSettings.button_destructive_text_color || '0 0% 100%'};
                --active-tab-bg: ${siteSettings.button_active_tab_bg_color || siteSettings.primary_color};
                --inactive-tab-bg: ${siteSettings.button_inactive_tab_bg_color || '0 0% 100%'};
                --inactive-tab-text: ${siteSettings.button_inactive_tab_text_color || '156 100% 21%'};
              }
              .preview-gallery-container button {
                border-radius: var(--button-radius) !important;
                font-weight: var(--button-font-weight) !important;
              }
            `}</style>
            <div
              className="preview-gallery-container"
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  margin: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
                >
                  ads_click
                </span>
                Live Preview (Unsaved)
              </p>
              {[
                {
                  label: 'Primary / Action',
                  btns: [
                    { variant: 'primary', label: 'Join Movement' },
                    { variant: 'primary', label: 'Action', size: 'sm' },
                  ],
                },
                {
                  label: 'Accent / Gold',
                  btns: [
                    { variant: 'gold', label: 'Official Vision' },
                    { variant: 'gold', label: 'Vision', size: 'sm' },
                  ],
                },
                {
                  label: 'Active / Inactive Tabs',
                  btns: [
                    { variant: 'active-tab', label: 'Active Tab' },
                    { variant: 'default', label: 'Inactive Tab' },
                  ],
                },
                {
                  label: 'Outline / Ghost',
                  btns: [
                    { variant: 'outline', label: 'Outline' },
                    { variant: 'ghost', label: 'Ghost' },
                  ],
                },
                {
                  label: 'Destructive',
                  btns: [
                    { variant: 'destructive', label: 'Solid Alert' },
                    { variant: 'outline-destructive', label: 'Outline Alert' },
                  ],
                },
              ].map((group) => (
                <div key={group.label}>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 6,
                      marginTop: 0,
                    }}
                  >
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.btns.map((btn) => (
                      <button
                        key={btn.label}
                        className={`btn ${btn.variant === 'primary' ? 'btn-primary' : btn.variant === 'gold' ? 'btn-accent' : btn.variant === 'destructive' ? 'btn-dest' : btn.variant === 'outline' ? 'btn-outline' : btn.variant === 'ghost' ? 'btn-ghost' : btn.variant === 'active-tab' ? 'btn-active-tab' : btn.variant === 'default' ? 'btn-inactive-tab' : btn.variant === 'outline-destructive' ? 'btn-outline-dest' : ''} ${btn.size === 'sm' ? 'btn-sm' : ''}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-save-row">
          <button
            className="btn btn-primary"
            style={{ minWidth: 140, justifyContent: 'center' }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Syncing…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
