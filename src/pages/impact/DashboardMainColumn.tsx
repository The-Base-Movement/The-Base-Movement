interface Stats {
  raised: number
  goal: number
  avgDonation: string
  totalContributors: number
}

interface Region {
  name: string
  engagement: number
}

interface Props {
  stats: Stats
  progressPct: number
  regions: Region[]
}

export function DashboardMainColumn({ stats, progressPct, regions }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
            >
              trending_up
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Campaign progress
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            National Organizing Fund
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              ₵{stats.raised.toLocaleString()}{' '}
              <span
                style={{
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                / {stats.goal.toLocaleString()}
              </span>
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--primary))',
              }}
            >
              {progressPct >= 1 ? `${progressPct}% achieved` : 'Early momentum'}
            </span>
          </div>
          <div
            style={{
              height: 10,
              background: 'hsl(var(--container-low))',
              borderRadius: 5,
              overflow: 'hidden',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'hsl(var(--primary))',
                borderRadius: 5,
                transition: 'width 1s ease-out',
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginTop: 16 }}>
            {[
              { label: 'Avg. donation', value: stats.avgDonation },
              { label: 'Total contributors', value: stats.totalContributors.toLocaleString() },
              { label: 'Last updated', value: 'Just now' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '10px 14px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ph">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--accent))' }}
            >
              location_on
            </span>
            Regional engagement
          </span>
        </div>
        <div
          style={{
            padding: '16px 20px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {regions.map((region) => (
            <div
              key={region.name}
              style={{
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                background: 'hsl(var(--container-low))',
              }}
            >
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 6,
                }}
              >
                {region.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: 'hsl(var(--border))',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${region.engagement}%`,
                      background: 'hsl(var(--primary))',
                      borderRadius: 2,
                      transition: 'width 1s ease-out',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color:
                      region.engagement > 0
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {region.engagement}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
