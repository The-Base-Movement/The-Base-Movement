export function RallyHeader() {
  return (
    <div className="top">
      <div>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>groups</span>
          Rally command
        </h2>
        <div style={{ marginTop: 12 }}>
          <div className="bl"><div /><div /><div /></div>
        </div>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
          Real-time attendance operational metrics and geo-fenced verification for field actions.
        </p>
      </div>
      <div className="actions">
        <button className="btn btn-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
          Global Manifest
        </button>
        <button className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          Schedule Action
        </button>
      </div>
    </div>
  )
}
