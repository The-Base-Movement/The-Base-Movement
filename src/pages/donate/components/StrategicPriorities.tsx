import { useState } from 'react'
import type { DonationCampaign } from '@/types/admin'
import { usePerformance } from '@/context/PerformanceContext'

const PAGE_SIZE = 4

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
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE))
  const paginated = campaigns.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

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
          ? Array.from({ length: 4 }).map((_, i) => (
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
          : paginated.map((c) => (
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

                    <button
                      onClick={() => onSelectCampaign(c.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      Direct capital{' '}
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination — only shown when there's more than one page */}
      {!loading && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 40,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.4 : 1,
              color: 'hsl(var(--on-surface))',
            }}
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              chevron_left
            </span>
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 36,
                height: 36,
                border: `1px solid ${i === page ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                borderRadius: 'var(--radius-sm)',
                background: i === page ? 'hsl(var(--primary))' : '#fff',
                color: i === page ? '#fff' : 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? 'page' : undefined}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page === totalPages - 1 ? 0.4 : 1,
              color: 'hsl(var(--on-surface))',
            }}
            aria-label="Next page"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              chevron_right
            </span>
          </button>
        </div>
      )}
    </section>
  )
}
