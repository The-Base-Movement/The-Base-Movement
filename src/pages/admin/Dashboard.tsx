import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { tacticalService } from '@/services/tacticalService'
import { toast } from 'sonner'

import type { AuditLogEntry, RegionalStat, PendingVerification, Broadcast } from '@/types/admin'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Subcomponents
import { VerificationsQueue } from './dashboard/VerificationsQueue'
import { QuickBroadcastComposer } from './dashboard/QuickBroadcastComposer'
import { AdminActivityLog } from './dashboard/AdminActivityLog'

// KPI Component matching the handoff stats.html spec
function KPI({
  label,
  value,
  delta,
  variant,
  description,
}: {
  label: string
  value: string
  delta?: string
  variant: 'r' | 'g' | 'k' | 'gr'
  description?: string
}) {
  const isDown = delta?.toLowerCase().includes('down')
  const colorMap: Record<string, 'red' | 'gold' | 'black' | 'green'> = {
    r: 'red',
    g: 'gold',
    k: 'black',
    gr: 'green',
  }

  return (
    <TacticalKPI
      label={label}
      value={value}
      delta={delta}
      isDown={isDown}
      variant={colorMap[variant]}
      description={description}
    />
  )
}

export default function AdminDashboard() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState<
    { label: string; value: string; change: string }[]
  >([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const navigate = useNavigate()
  const [isExporting, setIsExporting] = useState(false)

  // Broadcast State
  const [broadcast, setBroadcast] = useState({
    title: 'Eastern region jobs program — first cohort begins Monday',
    content:
      'Patriots — the first 600 youth begin paid apprenticeships across 14 districts of the Eastern region this Monday.',
    target_type: 'REGION' as Broadcast['target_type'],
    target_value: 'Eastern',
    priority: 'Normal' as Broadcast['priority'],
    channel: 'In-app' as Broadcast['channel'],
  })
  const [isSending, setIsSending] = useState(false)

  // Targeting Data
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<
    { id: number; name: string; region_id: number }[]
  >([])
  const [diasporaChapters, setDiasporaChapters] = useState<
    { id: string; name: string; country: string }[]
  >([])
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [stats, audit, pending, regs, consts, diaspora, regional] = await Promise.all([
          adminService.getGlobalStats(),
          adminService.getSystemAuditLogs(),
          adminService.getPendingVerifications(),
          adminService.getGhanaRegions(),
          adminService.getGhanaConstituencies(),
          adminService.getDiasporaChapters(),
          adminService.getRegionalStats(),
        ])
        setGlobalStats(stats)
        setAuditLogs(audit)
        setPendingVerifications(pending)
        setRegions(regs as unknown as { id: number; name: string }[])
        setConstituencies(consts as unknown as { id: number; name: string; region_id: number }[])
        setDiasporaChapters(diaspora as unknown as { id: string; name: string; country: string }[])
        setRegionalStats(regional)
      } catch (error) {
        console.error('[SYSTEM] Dashboard: Data fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSendBroadcast = async () => {
    if (!broadcast.title || !broadcast.content) {
      toast.error('Please provide both a headline and message content.')
      return
    }

    setIsSending(true)
    try {
      const success = await tacticalService.sendBroadcast({
        title: broadcast.title,
        content: broadcast.content,
        target_type: broadcast.target_type,
        target_value: broadcast.target_value,
        priority: broadcast.priority,
        channel: broadcast.channel,
        status: 'Sent',
      })

      if (success) {
        toast.success(`Message sent to targeted ${broadcast.target_type.toLowerCase()} audience.`)
        // Reset form or keep for next? Let's clear content but keep target for speed
        setBroadcast((prev) => ({ ...prev, content: '' }))
      } else {
        throw new Error('Service response failed')
      }
    } catch {
      toast.error('Strategic communication layer encountered an error.')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyMember = async (id: string, approve: boolean) => {
    const success = await adminService.verifyMember(id, approve)
    if (success) {
      setPendingVerifications((prev) => prev.filter((m) => m.id !== id))
      toast.success(approve ? 'Member application approved.' : 'Member application rejected.')
    } else {
      toast.error('Failed to process member verification.')
    }
  }

  const handleExport = async () => {
    if (regionalStats.length === 0) {
      toast.error('There is no regional data to export at this time.')
      return
    }

    setIsExporting(true)
    toast.info('Aggregating regional performance telemetry...')

    try {
      // Aggregate real regional data
      const headers = ['Region', 'Member Count', 'Chapters', 'Performance Status', 'Activity Level']
      const rows = regionalStats.map((r) => [
        r.region,
        r.memberCount,
        r.chapters,
        r.performance,
        r.memberCount > 1000 ? 'Peak' : r.memberCount > 100 ? 'High' : 'Normal',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      const timestamp = new Date().toISOString().split('T')[0]
      a.setAttribute('href', url)
      a.setAttribute('download', `base_regional_performance_${timestamp}.csv`)
      a.style.display = 'none'

      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)

      setIsExporting(false)
      toast.success('The regional performance report has been successfully generated.')
    } catch (error) {
      console.error('[DASHBOARD] Export failure:', error)
      setIsExporting(false)
      toast.error('A critical error occurred during data aggregation.')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Command center"
        icon="space_dashboard"
        description="Comprehensive operational overview, strategic mobilization metrics, and high-level movement oversight."
        actions={
          <>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                file_download
              </span>
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button className="btn btn-dest btn-sm" onClick={() => navigate('/admin/broadcasts')}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                notifications_active
              </span>
              Send broadcast
            </button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="kpis">
        {isLoading ? (
          <>
            <div className="card red animate-pulse h-48 bg-white" />
            <div className="card gold animate-pulse h-48 bg-white" />
            <div className="card black animate-pulse h-48 bg-white" />
            <div className="card green animate-pulse h-48 bg-white" />
          </>
        ) : (
          <>
            {globalStats.length > 0 ? (
              globalStats.map((stat, idx) => (
                <KPI
                  key={stat.label}
                  variant={idx === 0 ? 'r' : idx === 1 ? 'g' : idx === 2 ? 'k' : 'gr'}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.change}
                  description={
                    idx === 0
                      ? 'Total verified citizens registered across the national movement database.'
                      : idx === 1
                        ? 'Strategic financial inflows from contributions and official merchandise sales.'
                        : idx === 2
                          ? 'Member applications currently in the queue for administrative identity verification.'
                          : 'Administrators and field coordinators currently active in the Command Center.'
                  }
                />
              ))
            ) : (
              <>
                <KPI
                  variant="r"
                  label="Verifications pending"
                  value={pendingVerifications.length.toString()}
                  delta="Syncing..."
                  description="Member applications currently in the queue for administrative identity verification."
                />
                <KPI
                  variant="g"
                  label="Patriots"
                  value="--"
                  delta="--"
                  description="Total verified citizens registered across the national movement database."
                />
                <KPI
                  variant="k"
                  label="Logistics"
                  value="--"
                  delta="--"
                  description="Order fulfillment and logistics asset distribution status."
                />
                <KPI
                  variant="gr"
                  label="Field"
                  value="--"
                  delta="--"
                  description="Administrators and field coordinators currently active in the Command Center."
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="twocol">
        <VerificationsQueue
          pendingVerifications={pendingVerifications}
          onVerify={handleVerifyMember}
          navigate={navigate}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <QuickBroadcastComposer
            broadcast={broadcast}
            setBroadcast={setBroadcast}
            isSending={isSending}
            regions={regions}
            constituencies={constituencies}
            diasporaChapters={diasporaChapters}
            selectedRegionId={selectedRegionId}
            setSelectedRegionId={setSelectedRegionId}
            handleSendBroadcast={handleSendBroadcast}
          />

          <AdminActivityLog auditLogs={auditLogs} />
        </div>
      </div>
    </div>
  )
}
