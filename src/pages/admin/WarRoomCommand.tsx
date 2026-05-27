import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import { usePerformance } from '@/context/PerformanceContext'
import type {
  RapidResponseDirective,
  CrisisIncident,
  MediaCounterNarrative,
  RegionalStat,
  MovementPulse,
  GrowthTrend,
  Broadcast,
} from '@/types/admin'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular page-specific subcomponents (chunks)
import { WarRoomMap } from './warroom/WarRoomMap'
import { RegionalPaceTable } from './warroom/RegionalPaceTable'
import { ActivityStreamPanel } from './warroom/ActivityStreamPanel'
import { TrendChartsPanel } from './warroom/TrendChartsPanel'
import { CrisisIncidentsPanel } from './warroom/CrisisIncidentsPanel'
import { DigitalDirectivesPanel } from './warroom/DigitalDirectivesPanel'
import { ComplianceReportModal } from './warroom/ComplianceReportModal'

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(time)
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || ''

  const display = `${getPart('day')} ${getPart('month')} · ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`

  return (
    <span
      style={{
        fontWeight: 'var(--font-weight-medium, 500)',
        fontSize: 13,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '.04em',
        color: 'hsl(var(--accent))',
      }}
    >
      {display} GMT
    </span>
  )
}

export default function WarRoomCommand() {
  const [directives, setDirectives] = useState<RapidResponseDirective[]>([])
  const [incidents, setIncidents] = useState<CrisisIncident[]>([])
  const [narratives, setNarratives] = useState<MediaCounterNarrative[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [donationStats, setDonationStats] = useState<{
    approvedAmount: number
    totalContributions: number
  } | null>(null)
  const [growthTrends, setGrowthTrends] = useState<GrowthTrend[]>([])
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [chapterCount, setChapterCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<string | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const { lowBandwidthMode } = usePerformance()

  useEffect(() => {
    fetchWarRoomIntelligence()

    if (lowBandwidthMode) {
      // In Low-Bandwidth mode, only poll every 2 minutes and no real-time subscription
      const intervalId = setInterval(() => {
        fetchWarRoomIntelligence(true)
      }, 120000)
      return () => clearInterval(intervalId)
    }

    // Establish live connection for realtime War Room updates
    const channel = supabase
      .channel('war-room-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crisis_incidents' }, () => {
        fetchWarRoomIntelligence(true)
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rapid_response_directives' },
        () => {
          fetchWarRoomIntelligence(true)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media_counter_narratives' },
        () => {
          fetchWarRoomIntelligence(true)
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, () => {
        fetchWarRoomIntelligence(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'regions' }, () => {
        fetchWarRoomIntelligence(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, () => {
        fetchWarRoomIntelligence(true)
      })
      .subscribe()

    // Also poll every 30 seconds as a fallback
    const intervalId = setInterval(() => {
      fetchWarRoomIntelligence(true)
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(intervalId)
    }
  }, [lowBandwidthMode])

  const handleUpdateIncidentStatus = async (
    id: string,
    currentStatus: CrisisIncident['status']
  ) => {
    const nextStatus: CrisisIncident['status'] =
      currentStatus === 'INVESTIGATING' ? 'CONTAINED' : 'RESOLVED'
    const success = await adminService.updateCrisisIncident(id, nextStatus)
    if (success) {
      toast.success(`Incident ${id} transitioned to ${nextStatus}`)
      fetchWarRoomIntelligence(true)
    }
  }

  const handleDispatchNarrative = async (
    id: string,
    currentStatus: MediaCounterNarrative['dispatch_status']
  ) => {
    const nextStatus: MediaCounterNarrative['dispatch_status'] =
      currentStatus === 'PENDING' ? 'DEPLOYED' : 'PENDING'
    const success = await adminService.updateMediaCounterNarrative(id, nextStatus)
    if (success) {
      toast.success(
        nextStatus === 'DEPLOYED'
          ? 'Digital strike narrative deployed'
          : 'Narrative recalled to pending'
      )
      fetchWarRoomIntelligence(true)
    }
  }

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      const report = await adminService.generateComplianceReport()
      setReportData(report)
    } catch (err) {
      console.error('[SYSTEM] Report generation failed:', err)
      toast.error('Failed to generate compliance report')
    } finally {
      setReportLoading(false)
    }
  }

  const fetchWarRoomIntelligence = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const [dirData, incData, narData, regData, pulseData, donData, trendData, broadcastData] =
        await Promise.all([
          adminService.getRapidResponseDirectives(),
          adminService.getCrisisIncidents(),
          adminService.getMediaCounterNarratives(),
          adminService.getRegionalStats(),
          adminService.getMovementPulse(),
          donationService.getDonationStats(),
          adminService.getGrowthTrends(),
          adminService.getBroadcasts(),
        ])
      setDirectives(dirData)
      setIncidents(incData)
      setNarratives(narData)
      setRegionalStats(regData)
      setPulse(pulseData)
      setDonationStats(donData)
      const [mCount, cCount] = await Promise.all([
        adminService.getTotalMemberCount(),
        supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true })
          .then((res) => res.count || 0),
      ])
      setMemberCount(mCount)
      setChapterCount(cCount)
      setGrowthTrends(trendData)
      setBroadcasts(broadcastData || [])
    } catch (error) {
      console.error('[WAR_ROOM] Failed to fetch intelligence:', error)
      if (!isBackground) toast.error('Failed to synchronize with War Room servers.')
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="war-room-page"
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 40,
              color: 'hsl(var(--destructive))',
              animation: 'spin 1.5s linear infinite',
            }}
          >
            sync
          </span>
          <p
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--destructive))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Initializing war room protocols…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="war-room-page" style={{ paddingBottom: 96, minHeight: 'calc(100vh - 3.5rem)' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <AdminPageHeader
          title="War Room — live mobilization"
          icon="sensors"
          description="Real-time strategic oversight, crisis management, and rapid response coordination across all regional sectors."
          actions={
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {/* Status group: pill + clock always stay together */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 99,
                    border: '1px solid rgba(206,17,38,.3)',
                    color: 'hsl(var(--destructive))',
                    background: 'rgba(206,17,38,.12)',
                  }}
                >
                  <span
                    className="animate-pulse"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'hsl(var(--destructive))',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  Live · updating
                </span>
                <LiveClock />
              </div>

              {/* Action buttons group: always stay on same line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-outline"
                  style={{ height: 32, fontSize: 11, padding: '0 12px' }}
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    analytics
                  </span>
                  {reportLoading ? 'Generating...' : 'Compliance Report'}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ height: 32, fontSize: 11, padding: '0 12px' }}
                  onClick={() => (window.location.href = '/admin/broadcasts/new')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    send
                  </span>
                  Broadcast
                </button>
              </div>
            </div>
          }
        />

        <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <TacticalKPI
            label="Sign-ups · today"
            value={pulse ? pulse.nationalGrowth.toLocaleString() : '...'}
            description="National growth"
            variant="green"
            trend={
              pulse?.nationalGrowth
                ? { direction: 'up', value: 'Active' }
                : { direction: 'neutral', value: 'Live' }
            }
          />
          <TacticalKPI
            label="MoMo donations"
            value={donationStats ? `₵${(donationStats.approvedAmount / 1000).toFixed(1)}K` : '...'}
            description={`${donationStats?.totalContributions || 0} contributions`}
            variant="gold"
            trend={{ direction: 'up', value: 'Elite' }}
          />
          <TacticalKPI
            label="Field sectors"
            value={directives.length}
            description={`${directives.filter((d) => d.priority === 'CRITICAL').length} critical`}
            variant="black"
            trend={{ direction: 'neutral', value: 'Sync' }}
          />
          <TacticalKPI
            label="Verified patriots"
            value={memberCount.toLocaleString()}
            description={`${chapterCount} active chapters`}
            variant="green"
            trend={{ direction: 'up', value: 'Optimal' }}
          />
          <TacticalKPI
            label="Active incidents"
            value={incidents.length}
            description={incidents.length > 0 ? 'Rapid response' : 'Sectors clear'}
            variant={incidents.length > 0 ? 'red' : 'green'}
            trend={
              incidents.length > 0
                ? { direction: 'down', value: 'Alert' }
                : { direction: 'up', value: 'Elite' }
            }
          />
        </div>

        {/* ── 3-column grid: Map · Table · Feed ── */}
        <div className="war-room-main-grid" style={{ marginBottom: 12 }}>
          {/* Map panel */}
          <WarRoomMap regionalStats={regionalStats} />

          {/* Regional table */}
          <RegionalPaceTable regionalStats={regionalStats} />

          {/* Activity stream */}
          <ActivityStreamPanel
            directives={directives}
            broadcasts={broadcasts}
            incidents={incidents}
            narratives={narratives}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onDispatchNarrative={handleDispatchNarrative}
          />
        </div>

        {/* ── Trend Charts ── */}
        <TrendChartsPanel growthTrends={growthTrends} />

        {/* ── Lower row: Incidents detail + Narratives ── */}
        <div className="war-room-lower">
          {/* Active crisis incidents */}
          <CrisisIncidentsPanel
            incidents={incidents}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
          />

          {/* Media counter-narratives / Digital strike directives */}
          <DigitalDirectivesPanel
            narratives={narratives}
            onDispatchNarrative={handleDispatchNarrative}
          />
        </div>
      </div>

      {/* ── Compliance Report Modal ── */}
      <ComplianceReportModal reportData={reportData} onClose={() => setReportData(null)} />
    </div>
  )
}
