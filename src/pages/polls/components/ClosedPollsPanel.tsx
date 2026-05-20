import type { Poll, PollOption } from '@/types/admin'

interface ClosedPollsPanelProps {
  closedPolls: Poll[]
  showResults: Record<string, boolean>
  toggleResults: (pollId: string) => void
}

export function ClosedPollsPanel({
  closedPolls,
  showResults,
  toggleResults,
}: ClosedPollsPanelProps) {
  return (
    <div className="panel">
      <div className="ph">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}
          >
            lock
          </span>
          Closed polls
        </span>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {closedPolls.length === 0 ? (
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            No closed polls yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {closedPolls.map((poll, i) => (
              <div
                key={poll.id}
                style={{
                  paddingTop: 14,
                  paddingBottom: 14,
                  borderBottom:
                    i < closedPolls.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 9,
                      color: 'hsl(var(--destructive))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {poll.category} · Closed
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 12.5,
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 8px',
                    lineHeight: 1.35,
                  }}
                >
                  {poll.question}
                </p>

                {showResults[poll.id] && (
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}
                  >
                    {(() => {
                      const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
                      return poll.options.map((option: PollOption) => {
                        const pct =
                          poll.totalVotes > 0
                            ? Math.round((option.votes / poll.totalVotes) * 100)
                            : 0
                        const rank = sorted.findIndex((o) => o.id === option.id)
                        const bg =
                          rank === 0
                            ? 'rgba(0,107,63,0.1)'
                            : rank === 1
                              ? 'rgba(212,160,23,0.1)'
                              : 'rgba(0,0,0,0.04)'
                        return (
                          <div
                            key={option.id}
                            style={{
                              position: 'relative',
                              padding: '6px 10px',
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: `${pct}%`,
                                background: bg,
                              }}
                            />
                            <div
                              style={{
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 700,
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {option.label}
                              </span>
                              <span
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 800,
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {pct}%
                              </span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}

                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {poll.totalVotes.toLocaleString()} responses
                  </span>
                  <button
                    onClick={() => toggleResults(poll.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 11,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {showResults[poll.id] ? 'Hide results' : 'Final results'}
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
