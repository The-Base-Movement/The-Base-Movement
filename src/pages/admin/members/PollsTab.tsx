import { type MemberPollVote } from '@/services/adminService'

interface PollsTabProps {
  votes: MemberPollVote[]
}

export function PollsTab({ votes }: PollsTabProps) {
  return (
    <div>
      <div className="panel">
        <div className="ph2">
          <h3>Poll participation</h3>
          <span className="meta">{votes.length} votes cast</span>
        </div>
        {votes.length === 0 ? (
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
              how_to_vote
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              No poll votes on record.
            </p>
          </div>
        ) : (
          <div>
            {votes.map((v, i, arr) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '18px 24px',
                  borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#f1f5ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                  >
                    how_to_vote
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 12.5,
                    }}
                  >
                    {v.pollNumber ? `Poll #${v.pollNumber} — ` : ''}
                    {v.pollTitle}
                  </p>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    {v.date}
                  </span>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    padding: '3px 10px',
                    background: 'rgba(0,107,63,.08)',
                    border: '1px solid rgba(0,107,63,.2)',
                    borderRadius: 99,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    fontSize: 11,
                    color: 'hsl(var(--primary))',
                  }}
                >
                  {v.choice}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
