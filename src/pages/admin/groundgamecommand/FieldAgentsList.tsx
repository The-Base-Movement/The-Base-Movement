interface FieldAgent {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  constituency: string
  region: string | null
  status: 'active' | 'inactive'
  notes: string | null
  created_at: string
}

interface FieldAgentsListProps {
  fieldAgents: FieldAgent[]
  onAppointFieldAgent: () => void
  onRemoveFieldAgent: (id: string, name: string) => Promise<void>
}

export function FieldAgentsList({
  fieldAgents,
  onAppointFieldAgent,
  onRemoveFieldAgent,
}: FieldAgentsListProps) {
  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3>Field agents</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              marginTop: 2,
            }}
          >
            Members deployed to mobilize specific constituencies.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAppointFieldAgent}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            add
          </span>
          Appoint
        </button>
      </div>
      {fieldAgents.length === 0 ? (
        <p
          style={{
            padding: '24px 18px',
            textAlign: 'center',
            fontFamily: "'Public Sans'",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No field agents appointed yet.
        </p>
      ) : (
        <div style={{ padding: '6px 0' }}>
          {fieldAgents.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                borderBottom: i < fieldAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
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
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  flexShrink: 0,
                  color: 'hsl(var(--primary))',
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-normal, 400)',
                  }}
                >
                  {a.constituency}
                  {a.region ? ` · ${a.region}` : ''}
                </span>
              </div>
              <span className="pill pill-ok" style={{ fontSize: 9.5 }}>
                Active
              </span>
              <button
                onClick={() => onRemoveFieldAgent(a.id, a.member_name)}
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
