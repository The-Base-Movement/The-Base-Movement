interface PanelHeaderBarProps {
  title: string
  subtitle?: string
  icon?: string
  /**
   * Use on a `.panel` that has NO padding (the default) where the bar is the
   * first child and the body has its own padding — the bar sits flush with no
   * negative margins. Omit for panels given an explicit `padding: 20`.
   */
  flush?: boolean
}

/**
 * Green full-width header bar for Finance Dashboard panels (matches the member
 * dashboard's PanelHeader). As the FIRST child of a `padding: 20` panel it uses
 * negative margins to span edge to edge; pass `flush` for a padding-0 panel.
 * Any panel action controls stay in the body below the bar.
 */
export function PanelHeaderBar({ title, subtitle, icon, flush }: PanelHeaderBarProps) {
  return (
    <div
      style={{
        background: 'hsl(var(--panel-header))',
        padding: '10px 16px',
        margin: flush ? '0' : '-20px -20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>
          {icon}
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: '#fff',
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
