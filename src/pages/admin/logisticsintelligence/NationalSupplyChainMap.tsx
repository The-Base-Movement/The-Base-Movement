interface NationalSupplyChainMapProps {
  onEnterpriseView: () => void
}

export function NationalSupplyChainMap({ onEnterpriseView }: NationalSupplyChainMapProps) {
  return (
    <div
      style={{
        marginTop: 24,
        background: 'hsl(var(--on-surface))',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '28px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 17,
              color: '#fff',
              marginBottom: 6,
            }}
          >
            National supply chain map
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            Real-time visualization of material flow across the 16 regions.
          </p>
        </div>
        <button
          className="btn btn-outline"
          style={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.2)',
            background: 'transparent',
          }}
          onClick={onEnterpriseView}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            public
          </span>
          Enterprise view
        </button>
      </div>
      <div
        style={{
          height: 180,
          background: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }}
        >
          public
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Waiting for regional hub synchronization…
        </p>
      </div>
    </div>
  )
}
