import type { Achievement, MovementPulse } from '@/types/admin'

interface MetricsSidebarProps {
  achievements: Achievement[]
  pulse: MovementPulse | null
  leaderboardLength: number
}

export function MetricsSidebar({ achievements, pulse, leaderboardLength }: MetricsSidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Milestones */}
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
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Available milestones
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
              Recognition badges
            </div>
          </div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--accent))' }}
          >
            military_tech
          </span>
        </div>
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              style={{
                padding: '12px 14px 12px 18px',
                background: 'hsl(var(--container-low))',
                borderLeft: '4px solid hsl(var(--accent))',
                borderRadius: 4,
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
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {achievement.name}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 11,
                    color: 'hsl(var(--accent))',
                  }}
                >
                  +{achievement.points_awarded} pts
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Movement velocity */}
      <div
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Movement velocity
          </span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: 'hsl(var(--accent))' }}
          >
            bolt
          </span>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { label: 'Mobilization efficiency', pct: 87, color: 'hsl(var(--accent))' },
            { label: 'Recruitment conversion', pct: 62, color: 'hsl(var(--primary))' },
          ].map((bar) => (
            <div key={bar.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {bar.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {bar.pct}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'hsl(var(--border))',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: bar.color,
                    width: `${bar.pct}%`,
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              paddingTop: 14,
              borderTop: '1px solid hsl(var(--border))',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.6,
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              Currently tracking activity across {pulse?.activeChapters || 0} active chapters and{' '}
              {leaderboardLength} regions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
