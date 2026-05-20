import type { CrisisIncident } from '@/types/admin'

const formatGhanaTime = (dateStr: string | Date, options: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Accra',
      ...options,
    }).format(new Date(dateStr))
  } catch {
    return '...'
  }
}

interface CrisisIncidentsPanelProps {
  incidents: CrisisIncident[]
  onUpdateIncidentStatus: (id: string, currentStatus: CrisisIncident['status']) => Promise<void>
}

export function CrisisIncidentsPanel({
  incidents,
  onUpdateIncidentStatus,
}: CrisisIncidentsPanelProps) {
  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <h3
          style={{
            fontWeight: 800,
            fontSize: 12.5,
            color: 'hsl(var(--on-surface))',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
          >
            warning
          </span>{' '}
          Crisis incidents
        </h3>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
          {incidents.filter((i) => i.status === 'INVESTIGATING').length} active
        </span>
      </div>
      <div>
        {incidents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                color: 'hsl(var(--primary))',
                display: 'block',
                margin: '0 auto 12px',
              }}
            >
              check_circle
            </span>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No active incidents. All sectors secure.
            </p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              style={{
                padding: 16,
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className={inc.severity === 'DEFCON1' ? 'animate-pulse' : ''}
                    style={{
                      padding: '2px 8px',
                      fontSize: 8,
                      fontWeight: 800,
                      borderRadius: 99,
                      background:
                        inc.severity === 'DEFCON1' || inc.severity === 'SEVERE'
                          ? 'rgba(206,17,38,.2)'
                          : 'rgba(218,165,32,.2)',
                      color:
                        inc.severity === 'DEFCON1' || inc.severity === 'SEVERE'
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--accent))',
                      border: `1px solid ${inc.severity === 'DEFCON1' || inc.severity === 'SEVERE' ? 'rgba(206,17,38,.3)' : 'rgba(218,165,32,.3)'}`,
                    }}
                  >
                    {inc.severity}
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {inc.region}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    flexShrink: 0,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {formatGhanaTime(inc.created_at, {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {inc.incident_type.replace(/_/g, ' ')}
              </p>
              <p
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                }}
              >
                {inc.description}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background:
                      inc.status === 'INVESTIGATING'
                        ? 'rgba(218,165,32,.15)'
                        : 'rgba(0,107,63,.15)',
                    color:
                      inc.status === 'INVESTIGATING' ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                  }}
                >
                  {inc.status.toLowerCase()}
                </span>
                <button
                  onClick={() => onUpdateIncidentStatus(inc.id, inc.status)}
                  className="btn btn-outline"
                  style={{ height: 32, fontSize: 10, padding: '0 16px' }}
                >
                  Update status
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
