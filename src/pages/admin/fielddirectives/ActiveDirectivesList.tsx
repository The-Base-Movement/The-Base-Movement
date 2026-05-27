import type { FieldDirective } from '@/types/admin'

const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
}

const priorityStyle = (p: string): React.CSSProperties => {
  if (p === 'Urgent')
    return {
      background: 'rgba(239,68,68,0.1)',
      color: 'hsl(var(--destructive))',
      border: '1px solid rgba(239,68,68,0.2)',
    }
  if (p === 'High')
    return {
      background: 'rgba(245,158,11,0.1)',
      color: 'hsl(var(--accent))',
      border: '1px solid rgba(245,158,11,0.2)',
    }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}

interface ActiveDirectivesListProps {
  directives: FieldDirective[]
  onOpenCreate: () => void
}

export function ActiveDirectivesList({ directives, onOpenCreate }: ActiveDirectivesListProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Active directives
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            Operational field objectives
          </div>
        </div>
        <button
          className="btn btn-sm"
          style={{
            width: 32,
            height: 32,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onOpenCreate}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
        </button>
      </div>
      {directives.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            gap: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'hsl(var(--border))' }}
          >
            flag
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            No directives deployed
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: 800, overflowY: 'auto' }}>
          {directives.map((d) => (
            <div
              key={d.id}
              style={{ padding: '20px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ ...pillBase, ...priorityStyle(d.priority) }}>{d.priority}</span>
                  <span
                    style={{
                      ...pillBase,
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface-muted))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    {d.target_type}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--accent))',
                  }}
                >
                  +{d.points_awarded} pts
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 6,
                }}
              >
                {d.title}
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {d.description}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  schedule
                </span>
                {d.deadline ? new Date(d.deadline).toLocaleDateString() : 'Indefinite'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
