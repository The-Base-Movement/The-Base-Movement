import type { AssetAlert } from './types'

interface Props {
  alerts: AssetAlert[]
  assetId: string
  assignmentId: string | null
  onResolve: (alertId: string) => Promise<boolean>
  onEscalate: (assetId: string, assignmentId: string | null) => Promise<boolean>
}

const ALERT_LABEL = { overdue: 'Overdue return', damaged: 'Damage reported', missing: 'Missing' }
const ALERT_COLOR = {
  overdue: 'hsl(var(--accent))',
  damaged: 'hsl(var(--destructive))',
  missing: 'hsl(var(--destructive))',
}

export function AlertsPanel({ alerts, assetId, assignmentId, onResolve, onEscalate }: Props) {
  const assetAlerts = alerts.filter((a) => a.asset_id === assetId && !a.resolved)

  if (!assetAlerts.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--destructive))',
        }}
      >
        Active Alerts
      </p>
      {assetAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid hsl(var(--destructive) / 0.25)`,
            background: 'hsl(var(--destructive) / 0.04)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: ALERT_COLOR[alert.alert_type] }}
            >
              warning
            </span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {ALERT_LABEL[alert.alert_type]}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {new Date(alert.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onResolve(alert.id)}>
              Resolve
            </button>
            {alert.alert_type !== 'missing' && (
              <button
                className="btn btn-outline-dest btn-sm"
                onClick={() => onEscalate(assetId, assignmentId)}
              >
                Escalate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
