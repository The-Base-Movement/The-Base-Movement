import React from 'react'

interface ButtonCustomizerTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: Record<string, unknown>) => void
  isSaving: boolean
  handleSave: () => void
}

const inputSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700, fontSize: 12, borderRadius: 4,
  color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6,
}

const sectionSt: React.CSSProperties = {
  borderTop: '1px solid hsl(var(--border))', paddingTop: 16,
}

export function ButtonCustomizerTab({ siteSettings, setSiteSettings, isSaving, handleSave }: ButtonCustomizerTabProps) {
  return (
    <div className="panel">
      <div className="ph">
        <span>Button Architecture</span>
        <span style={{ fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Configure the movement's global interactive element parameters.</span>
      </div>
      <div style={{ padding: 24 }}>
        <div className="settings-form-grid" style={{ alignItems: 'start' }}>

          {/* Left: controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Border radius */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={labelSt}>Global border radius</label>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'hsl(var(--primary))' }}>{(siteSettings.button_border_radius as string) || '0.125rem'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[{ label: 'Square', value: '0px' }, { label: 'XS', value: '0.125rem' }, { label: 'SM', value: '0.25rem' }, { label: 'MD', value: '0.5rem' }, { label: 'Full', value: '9999px' }].map(r => (
                  <button key={r.value} className={siteSettings.button_border_radius === r.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center' }} onClick={() => setSiteSettings({ ...siteSettings, button_border_radius: r.value })}>{r.label}</button>
                ))}
              </div>
            </div>

            {/* Neon glow */}
            <div style={sectionSt}>
              <label style={labelSt}>Visual Feedback Systems</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 4, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
                <div>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', margin: 0 }}>Neon Glow Effects</p>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>Toggle administrative glow signatures on hover.</p>
                </div>
                <button onClick={() => setSiteSettings({ ...siteSettings, button_neon_enabled: !siteSettings.button_neon_enabled })} style={{ width: 36, height: 20, borderRadius: 10, background: siteSettings.button_neon_enabled ? 'hsl(var(--primary))' : 'hsl(var(--border))', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 3px', justifyContent: siteSettings.button_neon_enabled ? 'flex-end' : 'flex-start', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            </div>

            {/* Font weight */}
            <div style={sectionSt}>
              <label style={labelSt}>Typography Weight</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {[{ label: 'Normal', value: '400' }, { label: 'Bold', value: '700' }, { label: 'Black', value: '900' }].map(w => (
                  <button key={w.value} className={siteSettings.button_font_weight === w.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center' }} onClick={() => setSiteSettings({ ...siteSettings, button_font_weight: w.value })}>{w.label}</button>
                ))}
              </div>
            </div>

            {/* Primary text */}
            <div style={sectionSt}>
              <label style={labelSt}>Primary Button Text</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ label: 'Light Text', value: '0 0% 100%' }, { label: 'Dark Text', value: '220 15% 15%' }].map(o => (
                  <button key={o.value} className={siteSettings.button_primary_text_color === o.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center' }} onClick={() => setSiteSettings({ ...siteSettings, button_primary_text_color: o.value })}>{o.label}</button>
                ))}
              </div>
            </div>

            {/* Gold text */}
            <div style={sectionSt}>
              <label style={labelSt}>Gold Button Text</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ label: 'Light Text', value: '0 0% 100%' }, { label: 'Dark Text', value: '220 15% 15%' }].map(o => (
                  <button key={o.value} className={siteSettings.button_gold_text_color === o.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center' }} onClick={() => setSiteSettings({ ...siteSettings, button_gold_text_color: o.value })}>{o.label}</button>
                ))}
              </div>
            </div>

            {/* Destructive text */}
            <div style={sectionSt}>
              <label style={labelSt}>Destructive Button Text</label>
              <button className={siteSettings.button_destructive_text_color === '0 0% 100%' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center', width: '100%' }} onClick={() => setSiteSettings({ ...siteSettings, button_destructive_text_color: '0 0% 100%' })}>Light Text (Recommended)</button>
            </div>

            {/* Active tab bg */}
            <div style={sectionSt}>
              <label style={labelSt}>Active Tab Background</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid hsl(var(--border))', flexShrink: 0, background: siteSettings.button_active_tab_bg_color ? `hsl(${siteSettings.button_active_tab_bg_color as string})` : 'hsl(var(--primary))' }} />
                <input style={inputSt} value={(siteSettings.button_active_tab_bg_color as string) || ''} onChange={e => setSiteSettings({ ...siteSettings, button_active_tab_bg_color: e.target.value })} placeholder="0 0% 0%" />
              </div>
            </div>

            {/* Active tab text note */}
            <div style={sectionSt}>
              <label style={labelSt}>Active Tab Text</label>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, margin: 0 }}>Always white — ensures readable contrast on any active tab background color.</p>
            </div>

            {/* Inactive tab bg */}
            <div style={sectionSt}>
              <label style={labelSt}>Inactive Tab Background</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid hsl(var(--border))', flexShrink: 0, background: siteSettings.button_inactive_tab_bg_color ? `hsl(${siteSettings.button_inactive_tab_bg_color as string})` : '#fff' }} />
                <input style={inputSt} value={(siteSettings.button_inactive_tab_bg_color as string) || ''} onChange={e => setSiteSettings({ ...siteSettings, button_inactive_tab_bg_color: e.target.value })} placeholder="0 0% 100%" />
              </div>
            </div>

            {/* Inactive tab text */}
            <div style={sectionSt}>
              <label style={labelSt}>Inactive Tab Text</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[{ label: 'Light Text', value: '0 0% 100%' }, { label: 'Dark Text', value: '156 100% 21%' }].map(o => (
                  <button key={o.value} className={siteSettings.button_inactive_tab_text_color === o.value ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center' }} onClick={() => setSiteSettings({ ...siteSettings, button_inactive_tab_text_color: o.value })}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: preview */}
          <div style={{ background: 'hsl(var(--container-low))', padding: 24, borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
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
            <div className="preview-gallery-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h4 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>ads_click</span>
                Component Preview Gallery (Unsaved)
              </h4>
              {[
                { label: 'Primary / Action', btns: [{ variant: 'primary', label: 'Join Movement' }, { variant: 'primary', label: 'Action', size: 'sm' }] },
                { label: 'Accent / Gold', btns: [{ variant: 'gold', label: 'Official Vision' }, { variant: 'gold', label: 'Vision', size: 'sm' }] },
                { label: 'Active Tabs / Navigation', btns: [{ variant: 'active-tab', label: 'Active Tab' }, { variant: 'default', label: 'Inactive Tab' }] },
                { label: 'Outline / Ghost', btns: [{ variant: 'outline', label: 'Standard Outline' }, { variant: 'ghost', label: 'Ghost Action' }] },
                { label: 'Destructive / Alert', btns: [{ variant: 'destructive', label: 'Solid Alert' }, { variant: 'outline-destructive', label: 'Outline Alert' }] },
              ].map(group => (
                <div key={group.label}>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginBottom: 8, marginTop: 0 }}>{group.label}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {group.btns.map(btn => (
                      <button 
                        key={btn.label} 
                        className={`btn ${btn.variant === 'primary' ? 'btn-primary' : btn.variant === 'gold' ? 'btn-accent' : btn.variant === 'destructive' ? 'btn-dest' : btn.variant === 'outline' ? 'btn-outline' : btn.variant === 'ghost' ? 'btn-ghost' : ''} ${btn.size === 'sm' ? 'btn-sm' : ''}`}
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

        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20, marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" style={{ minWidth: 140, justifyContent: 'center' }} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Syncing…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
