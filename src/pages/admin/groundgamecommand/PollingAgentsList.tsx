interface PollingAgent {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  polling_station_id: string
  constituency: string | null
  region: string | null
  status: 'assigned' | 'confirmed' | 'deployed' | 'stood_down'
  notes: string | null
  created_at: string
}

interface PollingAgentsListProps {
  pollingAgents: PollingAgent[]
  onRemovePollingAgent: (id: string, name: string) => Promise<void>
}

export function PollingAgentsList({ pollingAgents, onRemovePollingAgent }: PollingAgentsListProps) {
  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3>Polling station agents</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            Members stationed at specific polling stations on election day.
          </p>
        </div>
      </div>
      {pollingAgents.length === 0 ? (
        <p
          style={{
            padding: '24px 18px',
            textAlign: 'center',
            fontFamily: "'Public Sans'",
            fontWeight: 700,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No station agents appointed. Use the Member Readiness table below to appoint.
        </p>
      ) : (
        <div style={{ padding: '6px 0' }}>
          {pollingAgents.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                borderBottom:
                  i < pollingAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Public Sans'",
                  fontWeight: 800,
                  fontSize: 11,
                  flexShrink: 0,
                  color: 'hsl(var(--accent))',
                }}
              >
                {a.member_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 800,
                    fontSize: 12.5,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {a.member_name}
                </b>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: 11,
                    background: 'hsl(var(--container-low))',
                    padding: '1px 6px',
                    borderRadius: 3,
                    letterSpacing: '.04em',
                  }}
                >
                  {a.polling_station_id}
                </span>
                {a.constituency && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans'",
                      fontWeight: 700,
                      marginLeft: 6,
                    }}
                  >
                    {a.constituency}
                  </span>
                )}
              </div>
              <span
                className={
                  a.status === 'deployed'
                    ? 'pill pill-ok'
                    : a.status === 'confirmed'
                      ? 'pill pill-warn'
                      : 'pill pill-mute'
                }
                style={{ fontSize: 9.5, textTransform: 'capitalize' }}
              >
                {a.status}
              </span>
              <button
                onClick={() => onRemovePollingAgent(a.id, a.member_name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
