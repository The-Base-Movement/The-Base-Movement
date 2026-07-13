import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { WingDivider } from '@/components/ui/WingDivider'
import { TrustSignals, SIGNUP_TRUST } from '@/components/ui/TrustSignals'
import type { DonationDetail } from '@/types/admin'
import { ImpactActivityModal } from './ImpactActivityModal'
import { Skeleton } from '@/components/states'

interface PublicImpactViewProps {
  stats: {
    totalDonations: string
    activeChapters: string
    totalMembers: string
    countriesReached: string
    raised: number
    goal: number
    avgDonation: string
    totalContributors: number
  }
  isLoading: boolean
  regions: { name: string; engagement: number }[]
  activeFilter: 'day' | 'week' | 'month' | 'year' | 'custom'
  filteredActivity: DonationDetail[]
  allActivity: DonationDetail[]
  showFullActivity: boolean
  onFilterChange: (filter: 'day' | 'week' | 'month' | 'year' | 'custom') => void
  onViewFullLog: () => void
  onCloseFullLog: () => void
}

export function PublicImpactView({
  stats,
  isLoading,
  regions,
  activeFilter,
  filteredActivity,
  allActivity,
  showFullActivity,
  onFilterChange,
  onViewFullLog,
  onCloseFullLog,
}: PublicImpactViewProps) {
  const heroStats = [
    {
      v: isLoading ? '—' : stats.totalMembers,
      l: 'Members registered',
      color: 'hsl(var(--brand-red))',
    },
    {
      v: isLoading ? '₵—' : stats.totalDonations,
      l: 'Donations raised',
      color: 'hsl(var(--brand-gold))',
    },
    {
      v: isLoading ? '—' : stats.activeChapters,
      l: 'Active branches',
      color: 'hsl(var(--brand-green))',
    },
    { v: isLoading ? '—' : `${stats.countriesReached}`, l: 'Countries reached', color: '#fff' },
  ]

  const progressPct = Math.min(100, Math.round((stats.raised / stats.goal) * 100))
  const sortedRegions = [...regions].sort((a, b) => b.engagement - a.engagement)

  return (
    <main style={{ background: 'hsl(var(--background))', minHeight: '100vh', paddingBottom: 0 }}>
      {showFullActivity && (
        <ImpactActivityModal allActivity={allActivity} onClose={onCloseFullLog} />
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: '#181d19',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '5px solid',
          borderImage:
            'linear-gradient(to right, hsl(var(--brand-red)), hsl(var(--brand-gold)), hsl(var(--brand-green))) 1',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 100% at 90% 50%, rgba(0,107,63,.2), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'clamp(48px,6vw,80px) clamp(20px,4vw,48px) clamp(40px,5vw,64px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Breadcrumbs variant="dark" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(32px,5vw,64px)',
              alignItems: 'center',
              marginTop: 24,
            }}
          >
            {/* Left: copy */}
            <div>
              <BrandLine />
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10,
                  color: 'hsl(var(--accent))',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  margin: '20px 0 14px',
                }}
              >
                Movement impact · 2026
              </p>
              <h1
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 'clamp(2.25rem,4vw,3.75rem)',
                  letterSpacing: '-.03em',
                  lineHeight: 1,
                  margin: '0 0 18px',
                }}
              >
                Numbers
                <br />
                that <span style={{ color: 'hsl(var(--accent))' }}>matter.</span>
              </h1>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: 17,
                  color: 'rgba(255,255,255,.8)',
                  lineHeight: 1.65,
                  margin: '0 0 28px',
                  maxWidth: 440,
                }}
              >
                Every membership, donation, and branch meeting counted. This is what the movement
                has achieved so far.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/donate" className="btn btn-accent">
                  Contribute now
                </Link>
                <Link
                  to="/register"
                  className="btn btn-ghost"
                  style={{ color: 'rgba(255,255,255,.7)' }}
                >
                  Join the movement →
                </Link>
              </div>
            </div>

            {/* Right: 2×2 stat boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {heroStats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 'var(--radius-md)',
                    padding: 18,
                  }}
                >
                  {isLoading ? (
                    <Skeleton variant="text-xl" width="60%" style={{ marginBottom: 8 }} />
                  ) : (
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 'clamp(1.5rem,2.5vw,2.5rem)',
                        letterSpacing: '-.03em',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        color: s.color,
                      }}
                    >
                      {s.v}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,.55)',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      marginTop: 5,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Regional breakdown ────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(20px,4vw,48px) 64px',
        }}
      >
        <div style={{ padding: '64px 0 32px' }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              color: 'hsl(var(--primary))',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 10,
            }}
          >
            Regional breakdown
          </span>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'clamp(1.75rem,3vw,2.375rem)',
              letterSpacing: '-.025em',
              margin: '0 0 8px',
            }}
          >
            Every region. Every district.
          </h2>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 15,
              maxWidth: 520,
              margin: 0,
            }}
          >
            Branch activity and member engagement across all 16 administrative regions of Ghana.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 48,
          }}
        >
          {isLoading
            ? Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="panel" style={{ overflow: 'hidden' }}>
                    <Skeleton variant="img" height={90} style={{ borderRadius: 0 }} />
                  </div>
                ))
            : sortedRegions.map((r) => {
                const level = r.engagement > 50 ? 'hi' : r.engagement > 20 ? 'mid' : 'lo'
                const badge = {
                  hi: {
                    label: 'High activity',
                    bg: 'rgba(0,107,63,.1)',
                    color: 'hsl(var(--primary))',
                  },
                  mid: { label: 'Growing', bg: 'rgba(218,165,32,.1)', color: '#7d5d12' },
                  lo: {
                    label: 'Mobilizing',
                    bg: 'rgba(206,17,38,.08)',
                    color: 'hsl(var(--destructive))',
                  },
                }[level]
                const barColor = {
                  hi: 'hsl(var(--brand-green))',
                  mid: 'hsl(var(--brand-gold))',
                  lo: 'hsl(var(--brand-red))',
                }[level]
                return (
                  <div key={r.name} className="panel" style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        padding: '12px 14px 10px',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                        }}
                      >
                        {r.name}
                      </h4>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-pill)',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 9,
                          letterSpacing: '.04em',
                          textTransform: 'uppercase',
                          background: badge.bg,
                          color: badge.color,
                          flexShrink: 0,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            letterSpacing: '.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Engagement
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 14,
                            fontVariantNumeric: 'tabular-nums',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {r.engagement}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'hsl(var(--container-low))',
                          borderRadius: 'var(--radius-pill)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${r.engagement}%`,
                            borderRadius: 'var(--radius-pill)',
                            background: barColor,
                            transition: 'width 1s ease-out',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>

        <WingDivider />

        {/* ── Activity + Progress ──────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginTop: 48,
            marginBottom: 64,
          }}
        >
          {/* Activity panel */}
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div className="ph">
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13.5,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                Recent contributions
              </h3>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'hsl(var(--destructive))',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid hsl(var(--border))',
                padding: '0 14px',
              }}
            >
              {(['day', 'week', 'month', 'year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onFilterChange(t)}
                  style={{
                    padding: '10px 14px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color:
                      activeFilter === t
                        ? 'hsl(var(--on-surface))'
                        : 'hsl(var(--on-surface-muted))',
                    borderBottom: `2px solid ${activeFilter === t ? 'hsl(var(--primary))' : 'transparent'}`,
                    background: 'transparent',
                    border: 'none',
                    borderBottomWidth: 2,
                    borderBottomStyle: 'solid' as const,
                    borderBottomColor: activeFilter === t ? 'hsl(var(--primary))' : 'transparent',
                    cursor: 'pointer',
                    textTransform: 'capitalize' as const,
                    letterSpacing: '.04em',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {filteredActivity.slice(0, 10).length > 0 ? (
                filteredActivity.slice(0, 10).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt=""
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                        decoding="async"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(0,107,63,.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {(item.fullName || 'A')[0]}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                          color: 'hsl(var(--on-surface))',
                          margin: '0 0 2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.fullName || 'Anonymous Compatriot'}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          letterSpacing: '.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.country || 'Ghana'} · {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 14,
                        color: 'hsl(var(--primary))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ₵{item.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                  }}
                >
                  No activity in this period
                </div>
              )}
            </div>

            <div style={{ padding: '10px 14px', borderTop: '1px solid hsl(var(--border))' }}>
              <button
                onClick={onViewFullLog}
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
              >
                View full activity log
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  open_in_new
                </span>
              </button>
            </div>
          </div>

          {/* Progress + KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel" style={{ padding: 20 }}>
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 4px',
                }}
              >
                Mobilization fund goal
              </h3>
              <p
                style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: '0 0 16px' }}
              >
                National fundraising target for 2026
              </p>
              <div
                style={{
                  height: 10,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background:
                      'linear-gradient(to right, hsl(var(--brand-red)), hsl(var(--brand-gold)), hsl(var(--brand-green)))',
                    borderRadius: 'var(--radius-pill)',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                }}
              >
                <span style={{ color: 'hsl(var(--primary))' }}>{stats.totalDonations} raised</span>
                <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                  Goal: ₵{(stats.goal / 1000).toFixed(0)}K
                </span>
              </div>
              {!isLoading && stats.raised === 0 && (
                <p
                  style={{
                    fontSize: 11.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    margin: '12px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  This year's fund is just getting started —{' '}
                  <Link
                    to="/donate"
                    style={{
                      color: 'hsl(var(--primary))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textDecoration: 'none',
                    }}
                  >
                    be the first to contribute
                  </Link>
                  .
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                {
                  label: 'Avg donation',
                  value: isLoading ? '—' : stats.avgDonation,
                  bar: 'hsl(var(--primary))',
                },
                {
                  label: 'Contributors',
                  value: isLoading ? '—' : stats.totalContributors.toLocaleString(),
                  bar: 'hsl(var(--accent))',
                },
              ].map((k, i) => (
                <div
                  key={i}
                  className="panel"
                  style={{
                    padding: '16px 18px 16px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: k.bar,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 6px',
                    }}
                  >
                    {k.label}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--kpi-num-size)',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#181d19',
          color: '#fff',
          padding: 'clamp(48px,6vw,64px) clamp(20px,4vw,48px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            height: 4,
            display: 'flex',
            width: 80,
            margin: '0 auto 40px',
          }}
        >
          <div style={{ flex: 1, background: 'hsl(var(--brand-red))' }} />
          <div style={{ flex: 1, background: 'hsl(var(--brand-gold))' }} />
          <div style={{ flex: 1, background: 'hsl(var(--brand-green))' }} />
        </div>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(1.75rem,3vw,2.25rem)',
            letterSpacing: '-.025em',
            margin: '0 0 8px',
          }}
        >
          Become part of the number.
        </h2>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, margin: '0 0 28px' }}>
          Join hundreds of thousands building Ghana's future.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary">
            Join the movement →
          </Link>
          <Link to="/donate" className="btn btn-accent">
            Contribute
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <TrustSignals items={SIGNUP_TRUST} tone="dark" />
        </div>
      </div>
    </main>
  )
}
