import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

// Modular imports
import { MetricsFilters } from './mobilizationmetrics/MetricsFilters'
import { LeaderboardTable } from './mobilizationmetrics/LeaderboardTable'
import { MetricsSidebar } from './mobilizationmetrics/MetricsSidebar'

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
        <MetricsFilters
          regions={regions}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
        />
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
        <LeaderboardTable filteredLeaderboard={filteredLeaderboard} />

        {/* Right sidebar */}
        <MetricsSidebar
          achievements={achievements}
          pulse={pulse}
          leaderboardLength={leaderboard.length}
        />
      </div>
    </div>
  )
}
