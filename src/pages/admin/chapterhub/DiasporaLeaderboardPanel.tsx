interface CountryGrowth {
  country: string
  newMembers: number
  flagUrl?: string
}

interface DiasporaLeaderboardPanelProps {
  leaderboard: CountryGrowth[]
  totalNewMembers: number
}

export function DiasporaLeaderboardPanel({
  leaderboard,
  totalNewMembers,
}: DiasporaLeaderboardPanelProps) {
  const topScore = leaderboard[0]?.newMembers || 1

  return (
    <div
      className="panel"
      style={{ height: '100%', maxHeight: 660, display: 'flex', flexDirection: 'column' }}
    >
      <div className="ph">
        <h3>Mobilization leaderboard</h3>
        <span className="meta">{totalNewMembers} new members · last 30 days</span>
      </div>
      <div style={{ padding: '6px 0', flex: 1, overflowY: 'auto' }}>
        {leaderboard.length === 0 ? (
          <p
            style={{
              padding: '24px 18px',
              textAlign: 'center',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No new sign-ups in the last 30 days.
          </p>
        ) : (
          leaderboard.map((row, i) => {
            const pct = Math.round((row.newMembers / topScore) * 100)
            return (
              <div
                key={row.country}
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                    background: 'hsl(var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans'",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {row.flagUrl ? (
                    <img
                      src={row.flagUrl}
                      alt={row.country}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    row.country.slice(0, 2).toUpperCase()
                  )}
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
                    {row.country}
                  </b>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans'",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    New members
                  </span>
                  <div
                    style={{
                      marginTop: 5,
                      height: 4,
                      background: 'var(--container-low)',
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
                    fontWeight: 'var(--font-weight-medium, 500)',
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
                    {row.newMembers}
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
                    joined
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
