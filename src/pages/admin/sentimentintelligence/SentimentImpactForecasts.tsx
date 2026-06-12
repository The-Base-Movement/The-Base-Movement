import type { ImpactProjection } from '@/types/admin'

interface SentimentImpactForecastsProps {
  projections: ImpactProjection[]
}

export function SentimentImpactForecasts({ projections }: SentimentImpactForecastsProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        className="ph"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 11,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Impact forecasts
          </span>
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 9,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            30-day mobilization projections
          </p>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
        >
          target
        </span>
      </div>
      <div
        style={{
          padding: '24px 32px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px 48px',
        }}
      >
        {projections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.2,
                marginBottom: 12,
              }}
            >
              bar_chart
            </span>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No projection data available.
            </p>
          </div>
        ) : (
          projections.map((proj) => (
            <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {proj.region}
                </h4>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Projected reach
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 16,
                      color: 'hsl(var(--destructive))',
                    }}
                  >
                    {proj.projected_reach_30d.toLocaleString()}
                  </p>
                </div>
              </div>
              <div
                style={{
                  height: 8,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'hsl(var(--primary))',
                    width: `${(proj.current_reach / proj.projected_reach_30d) * 100}%`,
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    height: '100%',
                    background: 'rgba(206, 17, 38, 0.5)',
                    width: `${((proj.projected_reach_30d - proj.current_reach) / proj.projected_reach_30d) * 100}%`,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    bolt
                  </span>
                  +{proj.mobilization_velocity}/day
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Confidence: {(proj.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
