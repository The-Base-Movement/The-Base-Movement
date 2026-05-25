import type { DonationCampaign } from '@/types/admin'
import { Button } from '@/components/buttons/ui/neon-button'
import { usePerformance } from '@/context/PerformanceContext'

interface StrategicPrioritiesProps {
  loading: boolean
  campaigns: DonationCampaign[]
  onSelectCampaign: (id: string) => void
}

export function StrategicPriorities({
  loading,
  campaigns,
  onSelectCampaign,
}: StrategicPrioritiesProps) {
  const { lowBandwidthMode } = usePerformance()
  return (
    <section style={{ marginTop: 80 }}>
      <div style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 'clamp(26px, 5vw, 44px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            fontFamily: "'Public Sans', sans-serif",
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Strategic priorities
        </h2>
        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 8,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Deploy capital to critical movement units.
        </p>
      </div>

      <div className="campaign-grid">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '4/5',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  animation: 'pulse 2s infinite',
                }}
              />
            ))
          : campaigns.map((c) => (
              <div
                key={c.id}
                style={{
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    aspectRatio: '16/10',
                    background: 'hsl(var(--container-low))',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {c.imageUrl && !lowBandwidthMode ? (
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      decoding="async"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 48, color: 'hsl(var(--border))' }}
                      >
                        vital_signs
                      </span>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    <span
                      style={{
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        padding: '6px 12px',
                        letterSpacing: '0.02em',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Live Mobilization
                    </span>
                  </div>
                </div>

                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      marginBottom: 12,
                      fontFamily: "'Public Sans', sans-serif",
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {c.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      lineHeight: 1.6,
                      marginBottom: 32,
                      fontWeight: 400,
                      fontFamily: "'Public Sans', sans-serif",
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ marginBottom: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'hsl(var(--on-surface-muted))',
                            letterSpacing: '0.02em',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          strength at {Math.round((c.raisedAmount / c.targetAmount) * 100)}%
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          ₵ {c.raisedAmount.toLocaleString()}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          width: '100%',
                          background: 'hsl(var(--container-low))',
                          borderRadius: 99,
                          overflow: 'hidden',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'hsl(var(--primary))',
                            transition: 'all 1s ease-out',
                            width: `${Math.min(100, (c.raisedAmount / c.targetAmount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => onSelectCampaign(c.id)}
                      variant="primary"
                      style={{ width: '100%' }}
                    >
                      Direct capital{' '}
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_forward
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </section>
  )
}
