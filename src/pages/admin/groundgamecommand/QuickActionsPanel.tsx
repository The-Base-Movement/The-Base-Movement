import type { GOTVTransportRequest } from '@/types/admin'

interface QuickActionsPanelProps {
  onNavigateDeploy: () => void
  onBroadcast: () => void
  onAppointFieldAgent: () => void
  onExportRouteSheet: () => void
  pendingTransportRequests: GOTVTransportRequest[]
  onDispatchTransport: (id: string) => Promise<void>
}

export function QuickActionsPanel({
  onNavigateDeploy,
  onBroadcast,
  onAppointFieldAgent,
  onExportRouteSheet,
  pendingTransportRequests,
  onDispatchTransport,
}: QuickActionsPanelProps) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Quick actions</h3>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" onClick={onNavigateDeploy}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add_location_alt
          </span>
          Assign new turf
        </button>
        <button
          onClick={onBroadcast}
          className="btn"
          style={{
            background: 'hsl(var(--accent))',
            color: '#000',
            fontWeight: 'var(--font-weight-semibold, 600)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            campaign
          </span>
          Broadcast to field agents
        </button>
        <button className="btn btn-outline" onClick={onAppointFieldAgent}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            badge
          </span>
          Appoint field agent
        </button>
        <button className="btn btn-outline" onClick={onExportRouteSheet}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            download
          </span>
          Export route sheet
        </button>
      </div>
      {pendingTransportRequests.length > 0 && (
        <div style={{ padding: '0 18px 18px' }}>
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'hsl(var(--on-surface-muted))',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              marginBottom: 10,
              fontFamily: "'Public Sans'",
            }}
          >
            Alerts
          </div>
          {pendingTransportRequests.slice(0, 2).map((req) => (
            <div
              key={req.id}
              style={{
                background: 'rgba(206,17,38,.04)',
                border: '1px solid rgba(206,17,38,.18)',
                borderRadius: 4,
                padding: '10px 12px',
                marginBottom: 8,
              }}
            >
              <b
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 11.5,
                  color: 'hsl(var(--destructive))',
                  display: 'block',
                }}
              >
                Transport pending
              </b>
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {req.pickup_address} · {req.passengers} pax
              </span>
              <button
                className="btn btn-sm btn-primary"
                style={{ marginTop: 8 }}
                onClick={() => onDispatchTransport(req.id)}
              >
                Dispatch asset
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
