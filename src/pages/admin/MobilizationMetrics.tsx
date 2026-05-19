import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/types/admin'
import { toast } from 'sonner'
import MobilizationLeaderboardCard from '@/components/admin/MobilizationLeaderboardCard'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 800,
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
}

const rankStyle = (index: number): React.CSSProperties => {
  if (index === 0) return { background: 'hsl(var(--accent))', color: '#fff' }
  if (index === 1) return { background: 'rgba(34,197,94,0.2)', color: 'hsl(var(--primary))' }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}

export default function MobilizationMetrics() {
  const [leaderboard, setLeaderboard] = useState<ChapterLeaderboard[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('All')
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [leaderboardData, achievementsData, pulseData] = await Promise.all([
          adminService.getRegionalLeaderboard(),
          adminService.getAchievements(),
          adminService.getMovementPulse(),
        ])
        setLeaderboard(leaderboardData)
        setAchievements(achievementsData)
        setPulse(pulseData)
      } catch (error) {
        console.error('[METRICS] Failed to synchronize mobilization operational metrics:', error)
        toast.error('Failed to synchronize mobilization operational metrics.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleExport = () => {
    if (!leaderboard.length) {
      toast.error('No data available to export.')
      return
    }
    const headers = ['Rank', 'Chapter', 'Region', 'Members', 'Badges', 'Impact Points']
    const csvContent = [
      headers.join(','),
      ...leaderboard.map((entry, index) =>
        [
          index + 1,
          `"${entry.chapter}"`,
          `"${entry.region}"`,
          entry.total_patriots,
          entry.achievements_unlocked,
          entry.total_mobilization_points,
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `mobilization_metrics_${new Date().toISOString().split('T')[0]}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tactical metrics exported successfully.')
  }

  const regions = [
    'All',
    ...new Set(
      leaderboard
        .map((e) => e.region?.trim())
        .filter(Boolean)
        .sort()
    ),
  ]
  const filteredLeaderboard =
    regionFilter === 'All' ? leaderboard : leaderboard.filter((e) => e.region === regionFilter)

  if (loading) {
    return (
      <div
        className="admin-page-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: 12,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 48,
            color: 'hsl(var(--border))',
            animation: 'spin 1s linear infinite',
          }}
        >
          refresh
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Synchronizing mobilization metrics…
        </p>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              emoji_events
            </span>
            Mobilization metrics
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 4,
            }}
          >
            Performance tracking and impact analytics for regional chapters.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className={isFilterVisible ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              filter_list
            </span>
            {isFilterVisible ? 'Hide filters' : 'Filter'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              download
            </span>
            Export
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {isFilterVisible && (
        <div
          className="panel"
          style={{
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
            }}
          >
            Region:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                style={{
                  ...pillBase,
                  cursor: 'pointer',
                  border: 'none',
                  ...(regionFilter === r
                    ? { background: 'hsl(var(--primary))', color: '#fff' }
                    : {
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                        border: '1px solid hsl(var(--border))',
                      }),
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI
          label="Impact Points"
          value={pulse?.totalMobilizationPoints || 0}
          description="Total performance score"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI
          label="Active Chapters"
          value={pulse?.activeChapters || 0}
          description="Verified chapters"
        />
        <TacticalKPI
          label="Top Region"
          value={pulse?.topPerformingRegion || 'N/A'}
          description="Highest performing area"
          trend={{ direction: 'neutral', value: 'Lead' }}
        />
        <TacticalKPI
          label="Growth Rate"
          value={`${pulse?.nationalGrowth || 0}%`}
          description="Quarterly increase"
          trend={{ direction: (pulse?.nationalGrowth || 0) > 0 ? 'up' : 'neutral', value: 'Pulse' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Leaderboard */}
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
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Regional power rankings
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 2,
                }}
              >
                Aggregated mobilization points
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
            >
              trending_up
            </span>
          </div>
          {/* Desktop table */}
          <div className="hidden md:block" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Chapter / Region</th>
                  <th style={{ textAlign: 'center' }}>Members</th>
                  <th style={{ textAlign: 'center' }}>Badges</th>
                  <th style={{ textAlign: 'right' }}>Impact points</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      No regional mobilization data available.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <tr key={entry.chapter}>
                      <td>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 12,
                            ...rankStyle(index),
                          }}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                            marginBottom: 2,
                          }}
                        >
                          {entry.chapter}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {entry.region}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            ...pillBase,
                            background: 'hsl(var(--container-low))',
                            color: 'hsl(var(--on-surface-muted))',
                            border: '1px solid hsl(var(--border))',
                          }}
                        >
                          {entry.total_patriots}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            ...pillBase,
                            background: 'rgba(245,158,11,0.1)',
                            color: 'hsl(var(--accent))',
                            border: '1px solid rgba(245,158,11,0.2)',
                          }}
                        >
                          {entry.achievements_unlocked}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {entry.total_mobilization_points.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            {filteredLeaderboard.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No regional data found.
              </div>
            ) : (
              filteredLeaderboard.map((entry, index) => (
                <MobilizationLeaderboardCard key={entry.chapter} entry={entry} index={index} />
              ))
            )}
          </div>
        </div>

        {/* Right sidebar */}
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
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Available milestones
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
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
                        fontWeight: 800,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {achievement.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
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
                      fontWeight: 700,
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
            style={{ background: 'hsl(var(--on-surface))', borderRadius: 6, overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
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
                        fontWeight: 700,
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {bar.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 12,
                        color: '#fff',
                      }}
                    >
                      {bar.pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'rgba(255,255,255,0.1)',
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
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.3)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  Currently tracking activity across {pulse?.activeChapters || 0} active chapters
                  and {leaderboard.length} regions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
