import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { FieldDirective, FieldReport } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Subcomponents
import { ActiveDirectivesList } from './fielddirectives/ActiveDirectivesList'
import { SituationalAwarenessFeed } from './fielddirectives/SituationalAwarenessFeed'
import { IssueDirectiveModal } from './fielddirectives/IssueDirectiveModal'

export default function FieldDirectives() {
  const [directives, setDirectives] = useState<FieldDirective[]>([])
  const [reports, setReports] = useState<FieldReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newDirective, setNewDirective] = useState<Omit<FieldDirective, 'id' | 'status'>>({
    title: '',
    description: '',
    target_type: 'Regional',
    priority: 'Normal',
    points_awarded: 50,
    deadline: '',
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [directivesData, reportsData] = await Promise.all([
          adminService.getFieldDirectives(),
          adminService.getFieldReports(),
        ])
        setDirectives(directivesData)
        setReports(reportsData)
      } catch {
        toast.error('Tactical synchronization failed.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleIssueDirective = async () => {
    if (!newDirective.title || !newDirective.description) {
      toast.error('Title and objective description are required.')
      return
    }
    setIsSubmitting(true)
    const success = await adminService.createFieldDirective({ ...newDirective })
    if (success) {
      toast.success('Directive deployed to the field.')
      setIsCreating(false)
      setNewDirective({
        title: '',
        description: '',
        target_type: 'Regional',
        priority: 'Normal',
        points_awarded: 50,
        deadline: '',
      })
      const updated = await adminService.getFieldDirectives()
      setDirectives(updated)
    } else {
      toast.error('Failed to deploy directive.')
    }
    setIsSubmitting(false)
  }

  const handleVerify = async (reportId: string, status: 'Verified' | 'Rejected') => {
    const success = await adminService.verifyFieldReport(reportId, status)
    if (success) {
      toast.success(`Report ${status.toLowerCase()} successfully.`)
      const updated = await adminService.getFieldReports()
      setReports(updated)
    } else {
      toast.error('Failed to update report status.')
    }
  }

  const activeDirectives = directives.filter((d) => d.status === 'Active')
  const pendingReports = reports.filter((r) => r.status === 'Pending')
  const verifiedReports = reports.filter((r) => r.status === 'Verified')
  const totalPointsEarned = verifiedReports.reduce((sum, report) => {
    const directive = directives.find((d) => d.id === report.directive_id)
    return sum + (directive?.points_awarded || 0)
  }, 0)

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
          hourglass_empty
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Synchronizing tactical feed…
        </p>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      <AdminPageHeader
        title="Field directives"
        icon="flag"
        description="Platform-wide deployment of tactical objectives and field verification protocols."
        actions={
          <>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => (window.location.href = '/admin/mobilization-metrics')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                bar_chart
              </span>
              Analytics
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Issue directive
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI
          label="Field Objectives"
          value={activeDirectives.length}
          description="Active directives"
          trend={{ direction: 'neutral', value: 'Vault' }}
          variant="red"
        />
        <TacticalKPI
          label="Awaiting Review"
          value={pendingReports.length}
          description="Pending reports"
          trend={{ direction: pendingReports.length > 0 ? 'down' : 'neutral', value: 'Queue' }}
          variant="gold"
        />
        <TacticalKPI
          label="Verified Actions"
          value={verifiedReports.length}
          description="Successful missions"
          trend={{ direction: 'up', value: 'Elite' }}
          variant="black"
        />
        <TacticalKPI
          label="Tactical Influence"
          value={totalPointsEarned.toLocaleString()}
          description="Points distributed"
          trend={{ direction: 'up', value: 'Pulse' }}
          variant="green"
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <ActiveDirectivesList directives={directives} onOpenCreate={() => setIsCreating(true)} />
        </div>
        <div style={{ flex: '2 1 400px', minWidth: 0 }}>
          <SituationalAwarenessFeed reports={reports} onVerify={handleVerify} />
        </div>
      </div>

      <IssueDirectiveModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        newDirective={newDirective}
        setNewDirective={setNewDirective}
        isSubmitting={isSubmitting}
        onConfirm={handleIssueDirective}
      />
    </div>
  )
}
