import type { CanvassingCampaign, CanvasserLog } from '@/types/admin'

interface RoutesPanelProps {
  campaigns: CanvassingCampaign[]
  activeCampaigns: CanvassingCampaign[]
  fieldLogs: CanvasserLog[]
}

export function RoutesPanel({ campaigns, activeCampaigns, fieldLogs }: RoutesPanelProps) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Routes today</h3>
        <span className="meta">
          {campaigns.length} routes · {activeCampaigns.length} active
        </span>
      </div>
      <div style={{ padding: '6px 0' }}>
        {campaigns.map((c, i) => {
          const knocked = fieldLogs.filter((l) =>
            l.canvasser_id.includes(c.id?.substring(0, 4) ?? '')
          ).length
          const pct =
            c.goal_contacts > 0 ? Math.min(95, Math.round((knocked / c.goal_contacts) * 100)) : 0
          const status = pct > 60 ? 'ok' : pct > 30 ? 'warn' : 'bad'
          return (
            <div
              key={c.id}
              style={{
                padding: '12px 18px',
                borderBottom: i < campaigns.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <b
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                  }}
                >
                  {c.title}
                </b>
                <span
                  className={
                    status === 'ok'
                      ? 'pill pill-ok'
                      : status === 'warn'
                        ? 'pill pill-warn'
                        : 'pill pill-err'
                  }
                  style={{ fontSize: 9.5, padding: '2px 8px' }}
                >
                  {status === 'ok' ? 'On track' : status === 'warn' ? 'Behind pace' : 'Stalled'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans'",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  letterSpacing: '.03em',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <b
                    style={{
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {c.target_constituency}
                  </b>{' '}
                  · lead
                </span>
                <span>
                  <b
                    style={{
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {knocked}
                  </b>{' '}
                  / {c.goal_contacts} doors
                </span>
                <span>{c.status.toLowerCase()}</span>
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 5,
                  background: '#f1f5ee',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background:
                      status === 'ok'
                        ? 'hsl(var(--primary))'
                        : status === 'warn'
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--destructive))',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
