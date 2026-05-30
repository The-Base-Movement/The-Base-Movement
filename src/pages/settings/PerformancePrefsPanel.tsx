interface Props {
  lowBandwidthMode: boolean
  onToggle: () => void
}

export function PerformancePrefsPanel({ lowBandwidthMode, onToggle }: Props) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Performance preferences</h3>
        <span className="meta">App experience</span>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10.5,
                color: 'hsl(var(--on-surface-muted))',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Low-bandwidth mode
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                maxWidth: 380,
                lineHeight: 1.55,
              }}
            >
              Reduces data usage by hiding heavy background images and optimizing assets.
              Recommended for slow connections.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: lowBandwidthMode ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0 3px',
              justifyContent: lowBandwidthMode ? 'flex-end' : 'flex-start',
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
      </div>
    </div>
  )
}
