interface LeaderboardPanelProps {
  leaderboard: [string, number][]
  canvassersOnline: number
  memberNameMap: Record<string, string>
  topScore: number
}

export function LeaderboardPanel({
  leaderboard,
  canvassersOnline,
  memberNameMap,
  topScore,
}: LeaderboardPanelProps) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Today's leaderboard</h3>
        <span className="meta">sign-ups · {canvassersOnline} field agents</span>
      </div>
      <div style={{ padding: '6px 0' }}>
        {leaderboard.length === 0 ? (
          <p
            style={{
              padding: '24px 18px',
              textAlign: 'center',
              fontFamily: "'Public Sans'",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No field logs recorded today.
          </p>
        ) : (
          leaderboard.map(([name, score], i) => {
            const pct = Math.round((score / topScore) * 100)
            const label = memberNameMap[name as string] || 'Unknown agent'
            return (
              <div
                key={String(name) + i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderBottom:
                    i < leaderboard.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 800,
                    fontSize: 18,
                    color: i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                    width: 24,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans'",
                    fontWeight: 800,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {label
                    .split(' ')
                    .map((n: string) => n[0])
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
                    {label}
                  </b>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans'",
                      fontWeight: 700,
                    }}
                  >
                    Field agent
                  </span>
                  <div
                    style={{
                      marginTop: 5,
                      height: 4,
                      background: '#f1f5ee',
                      borderRadius: 99,
                      overflow: 'hidden',
                      maxWidth: 200,
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background:
                          'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                  }}
                >
                  <b
                    style={{
                      fontSize: 18,
                      letterSpacing: '-.015em',
                      lineHeight: 1,
                      display: 'block',
                    }}
                  >
                    {score}
                  </b>
                  <span
                    style={{
                      fontSize: 9.5,
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      display: 'block',
                    }}
                  >
                    signups
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
