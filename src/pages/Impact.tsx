import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { donationService } from '@/services/donationService'
import { memberService } from '@/services/memberService'
import { chapterService } from '@/services/chapterService'
import type { DonationDetail } from '@/types/admin'
import { ImpactActivityModal } from './impact/ImpactActivityModal'
import { DashboardKpiTiles } from './impact/DashboardKpiTiles'
import { DashboardMainColumn } from './impact/DashboardMainColumn'
import { DashboardActivityFeed } from './impact/DashboardActivityFeed'
import { PublicImpactView } from './impact/PublicImpactView'

export default function Impact() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  const [activeFilter, setActiveFilter] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>(
    'day'
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [showFullActivity, setShowFullActivity] = useState(false)
  const [stats, setStats] = useState({
    totalDonations: '₵0',
    activeChapters: '0',
    totalMembers: '355,482',
    countriesReached: '1',
    raised: 0,
    goal: 500000,
    avgDonation: '₵0',
    totalContributors: 0,
  })
  const [contributions, setContributions] = useState<{ [key: string]: DonationDetail[] }>({
    day: [],
    week: [],
    month: [],
    year: [],
    custom: [],
  })
  const [regions, setRegions] = useState<{ name: string; engagement: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [
          donationStats,
          allDonations,
          members,
          activeChapterCount,
          leaderboard,
          totalRegistered,
        ] = await Promise.all([
          donationService.getDonationStats(),
          donationService.getDonations(),
          memberService.getMembers(),
          chapterService.getActiveChapterCount(),
          chapterService.getRegionalLeaderboard(),
          memberService.getTotalRegisteredCount(),
        ])

        const uniqueCountries = new Set(members.map((m) => m.country || 'Ghana')).size
        setStats({
          totalDonations:
            donationStats.approvedAmount > 0
              ? `₵${donationStats.approvedAmount.toLocaleString()}`
              : '₵0',
          activeChapters: activeChapterCount.toString(),
          totalMembers: totalRegistered.toLocaleString(),
          countriesReached: uniqueCountries.toString(),
          raised: donationStats.approvedAmount,
          goal: 500000,
          avgDonation:
            donationStats.approvedAmount > 0
              ? `₵${(donationStats.approvedAmount / (donationStats.totalContributions || 1)).toFixed(2)}`
              : '₵0',
          totalContributors: donationStats.totalContributions,
        })

        const GHANA_REGIONS = [
          'Greater Accra',
          'Ashanti',
          'Central',
          'Eastern',
          'Western',
          'Northern',
          'Upper East',
          'Upper West',
          'Volta',
          'North East',
          'Savannah',
          'Bono',
          'Bono East',
          'Ahafo',
          'Oti',
          'Western North',
        ]
        setRegions(
          GHANA_REGIONS.map((name) => {
            const live = leaderboard.find((l) => l.region.toLowerCase() === name.toLowerCase())
            return {
              name,
              engagement: live
                ? Math.min(
                    100,
                    Math.max(5, Math.floor((live.total_patriots / (totalRegistered || 1)) * 100))
                  )
                : 0,
            }
          })
        )

        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        setContributions({
          day: allDonations.filter((d) => new Date(d.date) > dayAgo),
          week: allDonations.filter((d) => new Date(d.date) > weekAgo),
          month: allDonations.filter((d) => new Date(d.date) > monthAgo),
          year: allDonations.filter((d) => new Date(d.date) > yearAgo),
          custom: [],
        })
      } catch (err) {
        console.error('[IMPACT] Data sync failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const allActivity = Object.values(contributions).flat()
  const filteredActivity = activeFilter === 'custom' ? [] : contributions[activeFilter] || []

  const kpiValueSize = (v: string | number) => {
    const len = String(v).length
    if (len <= 4) return 26
    if (len <= 7) return 22
    if (len <= 10) return 17
    return 14
  }

  if (isDashboard) {
    const progressPct = Math.min(100, Math.round((stats.raised / stats.goal) * 100))

    const dashboardKpis = [
      {
        label: 'Donations received',
        value: isLoading ? '—' : stats.totalDonations,
        sub: 'Total approved',
        bar: 'hsl(var(--primary))',
        icon: 'volunteer_activism',
      },
      {
        label: 'Active chapters',
        value: isLoading ? '—' : stats.activeChapters,
        sub: 'Operational units',
        bar: 'hsl(var(--accent))',
        icon: 'account_balance',
      },
      {
        label: 'Registered members',
        value: isLoading ? '—' : stats.totalMembers,
        sub: 'National scale',
        bar: 'hsl(var(--on-surface))',
        icon: 'groups',
      },
      {
        label: 'Countries reached',
        value: isLoading ? '—' : stats.countriesReached,
        sub: 'Global diaspora',
        bar: 'hsl(var(--destructive))',
        icon: 'public',
      },
    ]

    return (
      <div className="main">
        {showFullActivity && (
          <ImpactActivityModal
            allActivity={allActivity}
            onClose={() => setShowFullActivity(false)}
          />
        )}

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                display: 'inline-block',
                animation: 'pulse 1.4s infinite',
              }}
            />
            Movement metrics
          </div>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Impact &amp; Analytics
          </h2>
        </div>

        <DashboardKpiTiles kpis={dashboardKpis} kpiValueSize={kpiValueSize} />

        <div className="main-sidebar" style={{ alignItems: 'start' }}>
          <DashboardMainColumn stats={stats} progressPct={progressPct} regions={regions} />
          <DashboardActivityFeed
            activeFilter={activeFilter}
            showDatePicker={showDatePicker}
            dateRange={dateRange}
            filteredActivity={filteredActivity}
            onFilterChange={(t) => {
              setActiveFilter(t)
              setShowDatePicker(false)
            }}
            onToggleDatePicker={() => setShowDatePicker(!showDatePicker)}
            onDateRangeChange={(key, value) => setDateRange((prev) => ({ ...prev, [key]: value }))}
            onApplyCustomFilter={() => {
              setActiveFilter('custom')
              setShowDatePicker(false)
            }}
            onViewFullLog={() => setShowFullActivity(true)}
          />
        </div>
      </div>
    )
  }

  return (
    <PublicImpactView
      stats={stats}
      isLoading={isLoading}
      regions={regions}
      activeFilter={activeFilter}
      filteredActivity={filteredActivity}
      allActivity={allActivity}
      showFullActivity={showFullActivity}
      onFilterChange={(t) => {
        setActiveFilter(t)
        setShowDatePicker(false)
      }}
      onViewFullLog={() => setShowFullActivity(true)}
      onCloseFullLog={() => setShowFullActivity(false)}
    />
  )
}
