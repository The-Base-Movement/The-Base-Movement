import { type MemberSession } from '@/services/adminService'

interface SessionsTabProps {
  sessions: MemberSession[]
}

export function SessionsTab({ sessions }: SessionsTabProps) {
  return (
    <div>
      <div className="panel">
        <div className="ph2">
          <h3>Login sessions</h3>
          <span className="meta">{sessions.length} sessions</span>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: 'hsl(var(--border))',
                display: 'block',
                marginBottom: 8,
              }}
            >
              devices
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
              }}
            >
              No session records yet.
            </p>
          </div>
        ) : (
          <div>
            {sessions.map((s, i, arr) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 24px',
                  borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: s.current ? 'rgba(0,107,63,.1)' : 'rgba(206,17,38,.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 15,
                      color: s.current ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                    }}
                  >
                    login
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 12.5,
                    }}
                  >
                    {s.device}
                  </p>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {s.date} · {s.location} · {s.ip}
                  </span>
                </div>
                {s.current && (
                  <span
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(0,107,63,.1)',
                      border: '1px solid rgba(0,107,63,.25)',
                      borderRadius: 99,
                      fontSize: 10,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
