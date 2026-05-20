import { useNavigate } from 'react-router-dom'

export function BroadcastHeader() {
  const navigate = useNavigate()
  return (
    <div className="ph" style={{ marginBottom: 32 }}>
      <div>
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            color: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            campaign
          </span>
          Communication hub
        </h1>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 4,
          }}
        >
          Platform-wide transmission and regional mobilization protocols.
        </p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/broadcasts/new')}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          add
        </span>
        New broadcast
      </button>
    </div>
  )
}
