import type { MediaCounterNarrative } from '@/types/admin'

interface DigitalDirectivesPanelProps {
  narratives: MediaCounterNarrative[]
  onDispatchNarrative: (
    id: string,
    currentStatus: MediaCounterNarrative['dispatch_status']
  ) => Promise<void>
}

export function DigitalDirectivesPanel({
  narratives,
  onDispatchNarrative,
}: DigitalDirectivesPanelProps) {
  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
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
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 12.5,
            color: 'hsl(var(--on-surface))',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#60a5fa' }}>
            chat
          </span>{' '}
          Digital strike directives
        </h3>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
        >
          campaign
        </span>
      </div>
      <div>
        {narratives.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No active media campaigns.
            </p>
          </div>
        ) : (
          narratives.map((nar) => (
            <div
              key={nar.id}
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
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: '#60a5fa',
                  }}
                >
                  {nar.target_platform}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    padding: '2px 8px',
                    borderRadius: 99,
                    background:
                      nar.dispatch_status === 'DEPLOYED'
                        ? 'rgba(16,185,129,.15)'
                        : 'rgba(249,115,22,.15)',
                    color: nar.dispatch_status === 'DEPLOYED' ? '#059669' : '#ea580c',
                  }}
                >
                  {nar.dispatch_status.toLowerCase()}
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                "{nar.approved_messaging}"
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 4,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface-muted))',
                    margin: 0,
                  }}
                >
                  {nar.hashtags}
                </p>
                {nar.dispatch_status === 'PENDING' && (
                  <button
                    onClick={() => onDispatchNarrative(nar.id, nar.dispatch_status)}
                    className="btn btn-primary"
                    style={{ height: 32, fontSize: 10, padding: '0 16px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      send
                    </span>{' '}
                    Dispatch
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
