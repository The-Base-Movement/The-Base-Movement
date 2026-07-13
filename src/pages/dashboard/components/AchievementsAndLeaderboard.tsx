import type { LeaderboardEntry, Achievement } from '@/types/admin'

interface AchievementsAndLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  achievements: Achievement[]
  region: string
}

export function AchievementsAndLeaderboard({
  leaderboard,
  achievements,
  region,
}: AchievementsAndLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Regional Leaderboard */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--primary))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              emoji_events
            </span>
            Regional compatriots — {region || 'National'}
          </h3>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Top 5 Members
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {leaderboard.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontStyle: 'italic',
              }}
            >
              No regional data available yet.
            </div>
          ) : (
            leaderboard.slice(0, 5).map((entry, index) => (
              <div
                key={entry.name}
                style={{
                  padding: '14px 18px',
                  borderBottom: index < 4 ? '1px solid hsl(var(--border))' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s',
                }}
                className="hover:bg-on-surface/5"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      background: index === 0 ? 'hsl(var(--accent))' : 'hsl(var(--container-low))',
                      color: index === 0 ? '#fff' : 'hsl(var(--on-surface-muted))',
                      border: index === 0 ? 'none' : '1px solid hsl(var(--border))',
                    }}
                  >
                    {index + 1}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {entry.name}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--primary))',
                    fontStyle: 'italic',
                  }}
                >
                  {entry.points.toLocaleString()} pts
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: 'hsl(var(--accent))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              military_tech
            </span>
            Unlocked achievements
          </h3>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {achievements.length} Unlocked
          </span>
        </div>
        <div
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {achievements.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '24px',
                textAlign: 'center',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontStyle: 'italic',
              }}
            >
              No achievements unlocked yet.
            </div>
          ) : (
            achievements.map((achievement) => (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '16px 12px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  transition: 'all 0.2s',
                }}
                className="group hover:border-accent/40"
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(245,158,11,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    transition: 'transform 0.2s',
                  }}
                  className="group-hover:scale-110"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 24, color: 'hsl(var(--accent))' }}
                  >
                    star
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {achievement.name}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
