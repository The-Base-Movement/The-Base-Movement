import { useEffect, useRef, useState } from 'react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
  mlService,
  type MLHealthStatus,
  type PropensityResponse,
  type ForecastResponse,
  type SentimentResponse,
  type DonorScore,
  type RegionForecast,
  type RegionSentiment,
} from '@/services/mlService'

type Tab = 'donor' | 'forecast' | 'sentiment'

const tierColor = {
  High: { bg: 'rgba(34,197,94,0.1)', color: 'hsl(var(--primary))', border: 'rgba(34,197,94,0.25)' },
  Medium: {
    bg: 'rgba(245,158,11,0.1)',
    color: 'hsl(var(--accent))',
    border: 'rgba(245,158,11,0.25)',
  },
  Low: {
    bg: 'rgba(148,163,184,0.1)',
    color: 'hsl(var(--on-surface-muted))',
    border: 'hsl(var(--border))',
  },
}

const sentimentColor = {
  Strong: 'hsl(var(--primary))',
  Positive: '#3b82f6',
  Neutral: 'hsl(var(--on-surface-muted))',
  Concerning: 'hsl(var(--destructive))',
}

const trendIcon = { Rising: 'trending_up', Stable: 'trending_flat', Falling: 'trending_down' }
const trendColor = {
  Rising: 'hsl(var(--primary))',
  Stable: 'hsl(var(--on-surface-muted))',
  Falling: 'hsl(var(--destructive))',
}
const confColor = {
  High: 'hsl(var(--primary))',
  Medium: 'hsl(var(--accent))',
  Low: 'hsl(var(--on-surface-muted))',
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.65
      ? 'hsl(var(--primary))'
      : score >= 0.35
        ? 'hsl(var(--accent))'
        : 'hsl(var(--on-surface-muted))'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'hsl(var(--border))',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          minWidth: 28,
        }}
      >
        {pct}%
      </span>
    </div>
  )
}

function StatusDot({ status }: { status: MLHealthStatus | null }) {
  if (!status)
    return (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'hsl(var(--on-surface-muted))',
          display: 'inline-block',
        }}
      />
    )
  const ok = status.status === 'ok' && status.database === 'connected'
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: ok ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
        display: 'inline-block',
      }}
    />
  )
}

export default function MLIntelligence() {
  const [tab, setTab] = useState<Tab>('donor')
  const [health, setHealth] = useState<MLHealthStatus | null>(null)
  const [healthError, setHealthError] = useState(false)

  const [propensity, setPropensity] = useState<PropensityResponse | null>(null)
  const [propensityError, setPropensityError] = useState('')

  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [forecastError, setForecastError] = useState('')

  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null)
  const [sentimentError, setSentimentError] = useState('')

  // Track which tabs have had a fetch started — prevents re-fetching on re-render
  // and avoids synchronous setState in effect bodies (all setState below is in async callbacks)
  const startedRef = useRef<Set<Tab>>(new Set())

  const [donorSearch, setDonorSearch] = useState('')
  const [donorTierFilter, setDonorTierFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All')
  const [donorPage, setDonorPage] = useState(1)
  const PAGE_SIZE = 15

  // Health check on mount
  useEffect(() => {
    mlService
      .health()
      .then(setHealth)
      .catch(() => setHealthError(true))
  }, [])

  // Load data when tab changes — all setState calls are inside async callbacks only
  useEffect(() => {
    if (tab === 'donor' && !startedRef.current.has('donor')) {
      startedRef.current.add('donor')
      mlService
        .getDonorPropensity()
        .then(setPropensity)
        .catch((e: Error) => setPropensityError(e.message))
    }
    if (tab === 'forecast' && !startedRef.current.has('forecast')) {
      startedRef.current.add('forecast')
      mlService
        .getMobilizationForecast()
        .then(setForecast)
        .catch((e: Error) => setForecastError(e.message))
    }
    if (tab === 'sentiment' && !startedRef.current.has('sentiment')) {
      startedRef.current.add('sentiment')
      mlService
        .getMobilizationSentiment()
        .then(setSentiment)
        .catch((e: Error) => setSentimentError(e.message))
    }
  }, [tab])

  // Filtered + paginated donor list
  const filteredDonors: DonorScore[] = (propensity?.members ?? []).filter((m) => {
    const matchesTier = donorTierFilter === 'All' || m.tier === donorTierFilter
    const q = donorSearch.toLowerCase()
    const matchesSearch =
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      m.reg_no.toLowerCase().includes(q) ||
      (m.region ?? '').toLowerCase().includes(q)
    return matchesTier && matchesSearch
  })
  const totalDonorPages = Math.ceil(filteredDonors.length / PAGE_SIZE)
  const pagedDonors = filteredDonors.slice((donorPage - 1) * PAGE_SIZE, donorPage * PAGE_SIZE)

  const serviceOffline = healthError || (health && health.status !== 'ok')

  return (
    <div className="main">
      <AdminPageHeader
        title="ML Intelligence"
        subtitle="Predictive analytics powered by the FastAPI microservice"
        icon="auto_awesome"
      />

      {/* Service status bar */}
      <div
        className="panel"
        style={{
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <StatusDot status={health} />
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          ML Service
        </span>
        {health && (
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            v{health.version} · DB {health.database}
          </span>
        )}
        {serviceOffline && (
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--destructive))',
            }}
          >
            Service offline — start the FastAPI server locally or on your VPS (see
            docs/audits/ml-microservice-audit-2026-05-31.md)
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {import.meta.env.VITE_ML_SERVICE_URL ?? 'http://localhost:8000'}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['donor', 'forecast', 'sentiment'] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => setTab(t)}
            style={{ fontSize: 12 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {t === 'donor'
                ? 'volunteer_activism'
                : t === 'forecast'
                  ? 'show_chart'
                  : 'sentiment_satisfied'}
            </span>
            {t === 'donor'
              ? 'Donor Propensity'
              : t === 'forecast'
                ? 'Regional Forecast'
                : 'Sentiment Index'}
          </button>
        ))}
      </div>

      {/* ── Donor Propensity ─────────────────────────────────────────────── */}
      {tab === 'donor' && (
        <>
          {!propensity && !propensityError && <LoadingPanel label="Scoring members…" />}
          {propensityError && <ErrorPanel message={propensityError} />}
          {propensity && (
            <>
              {/* KPI strip */}
              <div className="kpis" style={{ marginBottom: 20 }}>
                {[
                  {
                    label: 'Total Scored',
                    value: propensity.total_scored.toLocaleString(),
                    bar: 'hsl(var(--on-surface))',
                  },
                  {
                    label: 'High Propensity',
                    value: propensity.high_propensity.toLocaleString(),
                    bar: 'hsl(var(--primary))',
                  },
                  {
                    label: 'Medium Propensity',
                    value: propensity.medium_propensity.toLocaleString(),
                    bar: 'hsl(var(--accent))',
                  },
                  {
                    label: 'Low Propensity',
                    value: propensity.low_propensity.toLocaleString(),
                    bar: 'hsl(var(--on-surface-muted))',
                  },
                ].map((k) => (
                  <div
                    key={k.label}
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
                        letterSpacing: '0.05em',
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

              {/* Filters */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <input
                  className="input"
                  placeholder="Search by name, ID, region…"
                  value={donorSearch}
                  onChange={(e) => {
                    setDonorSearch(e.target.value)
                    setDonorPage(1)
                  }}
                  style={{ flex: 1, minWidth: 200 }}
                />
                {(['All', 'High', 'Medium', 'Low'] as const).map((t) => (
                  <button
                    key={t}
                    className={
                      donorTierFilter === t ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
                    }
                    onClick={() => {
                      setDonorTierFilter(t)
                      setDonorPage(1)
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="desktop-only" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Region</th>
                        <th style={{ textAlign: 'center' }}>Tier</th>
                        <th>Score</th>
                        <th style={{ textAlign: 'center' }}>Donations</th>
                        <th style={{ textAlign: 'center' }}>Activity (30d)</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedDonors.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: 'center',
                              padding: '48px 24px',
                              color: 'hsl(var(--on-surface-muted))',
                              fontSize: 12,
                            }}
                          >
                            No members match filter.
                          </td>
                        </tr>
                      ) : (
                        pagedDonors.map((m) => {
                          const tc = tierColor[m.tier]
                          return (
                            <tr key={m.member_id}>
                              <td>
                                <div
                                  style={{
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 13,
                                    color: 'hsl(var(--on-surface))',
                                  }}
                                >
                                  {m.full_name}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontSize: 10,
                                    color: 'hsl(var(--on-surface-muted))',
                                  }}
                                >
                                  {m.reg_no}
                                </div>
                              </td>
                              <td
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 12,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {m.region ?? '—'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 10px',
                                    borderRadius: 'var(--radius-pill)',
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    background: tc.bg,
                                    color: tc.color,
                                    border: `1px solid ${tc.border}`,
                                  }}
                                >
                                  {m.tier}
                                </span>
                              </td>
                              <td style={{ minWidth: 120 }}>
                                <ScoreBar score={m.score} />
                              </td>
                              <td
                                style={{
                                  textAlign: 'center',
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 12,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {m.donation_count}
                              </td>
                              <td
                                style={{
                                  textAlign: 'center',
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 12,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {m.activity_events_30d}
                              </td>
                              <td
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                  maxWidth: 200,
                                }}
                              >
                                {m.recommended_action}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="mobile-only">
                  {pagedDonors.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 16px',
                        textAlign: 'center',
                        color: 'hsl(var(--on-surface-muted))',
                        fontSize: 12,
                      }}
                    >
                      No members match filter.
                    </div>
                  ) : (
                    pagedDonors.map((m) => {
                      const tc = tierColor[m.tier]
                      return (
                        <div
                          key={m.member_id}
                          style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid hsl(var(--border))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 13,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {m.full_name}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontSize: 10,
                                  color: 'hsl(var(--on-surface-muted))',
                                }}
                              >
                                {m.reg_no} · {m.region ?? '—'}
                              </div>
                            </div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-pill)',
                                fontFamily: "'Public Sans', sans-serif",
                                fontSize: 10,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                background: tc.bg,
                                color: tc.color,
                                border: `1px solid ${tc.border}`,
                              }}
                            >
                              {m.tier}
                            </span>
                          </div>
                          <ScoreBar score={m.score} />
                          <div
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 11,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {m.recommended_action}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {totalDonorPages > 1 && (
                  <div
                    style={{
                      padding: '10px 16px',
                      borderTop: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {(donorPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(donorPage * PAGE_SIZE, filteredDonors.length)} of{' '}
                      {filteredDonors.length}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ height: 28, padding: '0 8px' }}
                      disabled={donorPage === 1}
                      onClick={() => setDonorPage((p) => p - 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        chevron_left
                      </span>
                    </button>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {donorPage} / {totalDonorPages}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ height: 28, padding: '0 8px' }}
                      disabled={donorPage === totalDonorPages}
                      onClick={() => setDonorPage((p) => p + 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        chevron_right
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Generated {new Date(propensity.generated_at).toLocaleString()} · Scores refresh on
                page load
              </div>
            </>
          )}
        </>
      )}

      {/* ── Regional Forecast ────────────────────────────────────────────── */}
      {tab === 'forecast' && (
        <>
          {!forecast && !forecastError && <LoadingPanel label="Computing forecasts…" />}
          {forecastError && <ErrorPanel message={forecastError} />}
          {forecast && (
            <>
              <div className="kpis" style={{ marginBottom: 20 }}>
                {[
                  {
                    label: 'National Members',
                    value: forecast.national_total.toLocaleString(),
                    bar: 'hsl(var(--on-surface))',
                  },
                  {
                    label: 'Active Members',
                    value: forecast.national_active.toLocaleString(),
                    bar: 'hsl(var(--primary))',
                  },
                  {
                    label: 'Regions Tracked',
                    value: forecast.total_regions.toString(),
                    bar: 'hsl(var(--accent))',
                  },
                  {
                    label: 'Fastest Growing',
                    value: forecast.fastest_growing_region,
                    bar: 'hsl(var(--primary))',
                  },
                ].map((k) => (
                  <div
                    key={k.label}
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
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '0 0 6px',
                      }}
                    >
                      {k.label}
                    </p>
                    <p
                      style={{
                        fontSize: k.label === 'Fastest Growing' ? 13 : 'var(--kpi-num-size)',
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

              <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    30 / 60 / 90-Day Membership Projections
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 2,
                    }}
                  >
                    Linear extrapolation from current 30-day cohort velocity
                  </div>
                </div>
                <div className="desktop-only" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Region</th>
                        <th style={{ textAlign: 'right' }}>Current</th>
                        <th style={{ textAlign: 'right' }}>New (30d)</th>
                        <th style={{ textAlign: 'right' }}>Growth %</th>
                        <th style={{ textAlign: 'right' }}>+30d</th>
                        <th style={{ textAlign: 'right' }}>+60d</th>
                        <th style={{ textAlign: 'right' }}>+90d</th>
                        <th style={{ textAlign: 'center' }}>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.regions.map((r: RegionForecast) => (
                        <tr key={r.region}>
                          <td
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 13,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {r.region}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {r.current_members.toLocaleString()}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color: 'hsl(var(--primary))',
                            }}
                          >
                            +{r.new_members_30d}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color:
                                r.growth_rate_pct > 0
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {r.growth_rate_pct}%
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {r.forecast_30d.toLocaleString()}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {r.forecast_60d.toLocaleString()}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: "'Public Sans', sans-serif",
                              fontSize: 12,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {r.forecast_90d.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontSize: 11,
                                color: confColor[r.confidence],
                              }}
                            >
                              {r.confidence}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="mobile-only">
                  {forecast.regions.map((r: RegionForecast) => (
                    <div
                      key={r.region}
                      style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
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
                          {r.region}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11,
                            color: confColor[r.confidence],
                          }}
                        >
                          {r.confidence} confidence
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {[
                          { label: '+30d', val: r.forecast_30d },
                          { label: '+60d', val: r.forecast_60d },
                          { label: '+90d', val: r.forecast_90d },
                        ].map((p) => (
                          <div key={p.label} style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontSize: 10,
                                color: 'hsl(var(--on-surface-muted))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {p.label}
                            </div>
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 14,
                                color: 'hsl(var(--on-surface))',
                              }}
                            >
                              {p.val.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Generated {new Date(forecast.generated_at).toLocaleString()}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Sentiment Index ───────────────────────────────────────────────── */}
      {tab === 'sentiment' && (
        <>
          {!sentiment && !sentimentError && <LoadingPanel label="Analysing sentiment…" />}
          {sentimentError && <ErrorPanel message={sentimentError} />}
          {sentiment && (
            <>
              <div className="kpis" style={{ marginBottom: 20 }}>
                {[
                  {
                    label: 'National Sentiment',
                    value: `${Math.round(sentiment.national_sentiment * 100)}%`,
                    bar: 'hsl(var(--primary))',
                  },
                  {
                    label: 'Most Positive',
                    value: sentiment.most_positive_region,
                    bar: 'hsl(var(--primary))',
                  },
                  {
                    label: 'Most Concerning',
                    value: sentiment.most_negative_region,
                    bar: 'hsl(var(--destructive))',
                  },
                  {
                    label: 'Regions',
                    value: sentiment.regions.length.toString(),
                    bar: 'hsl(var(--on-surface))',
                  },
                ].map((k) => (
                  <div
                    key={k.label}
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
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '0 0 6px',
                      }}
                    >
                      {k.label}
                    </p>
                    <p
                      style={{
                        fontSize: ['Most Positive', 'Most Concerning'].includes(k.label)
                          ? 13
                          : 'var(--kpi-num-size)',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sentiment.regions.map((r: RegionSentiment) => {
                  const pct = Math.round(r.sentiment_score * 100)
                  const color = sentimentColor[r.sentiment_label]
                  const ti = trendIcon[r.trend]
                  const tc = trendColor[r.trend]
                  return (
                    <div key={r.region} className="panel" style={{ padding: '14px 18px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            flex: 1,
                          }}
                        >
                          {r.region}
                        </span>
                        <span
                          style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color }}
                        >
                          {r.sentiment_label}
                        </span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: tc }}
                        >
                          {ti}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {r.trend}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color,
                            minWidth: 36,
                            textAlign: 'right',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: 'hsl(var(--border))',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 999,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Members', val: r.total_members.toLocaleString() },
                          { label: 'Active ratio', val: `${Math.round(r.active_ratio * 100)}%` },
                          {
                            label: 'Donor rate',
                            val: `${Math.round(r.donation_participation_rate * 100)}%`,
                          },
                        ].map((s) => (
                          <div key={s.label}>
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontSize: 9,
                                color: 'hsl(var(--on-surface-muted))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              {s.label}
                            </div>
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 13,
                                color: 'hsl(var(--on-surface))',
                              }}
                            >
                              {s.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Generated {new Date(sentiment.generated_at).toLocaleString()}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: 'hsl(var(--on-surface-muted))',
            animation: 'spin 1s linear infinite',
          }}
        >
          refresh
        </span>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      className="panel"
      style={{
        padding: '24px',
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--destructive))', flexShrink: 0 }}
        >
          error
        </span>
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--destructive))',
              marginBottom: 4,
            }}
          >
            ML Service Unavailable
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {message}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
            }}
          >
            Start the service:{' '}
            <code
              style={{
                background: 'hsl(var(--container-low))',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                fontFamily: 'monospace',
              }}
            >
              cd ml-service && uvicorn main:app --reload
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
