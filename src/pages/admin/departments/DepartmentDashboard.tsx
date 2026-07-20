import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { messagingService } from '@/services/messagingService'
import { adminService } from '@/services/adminService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { Helpdesk } from '@/components/admin/Helpdesk'
import {
  DEPARTMENT_SUB_COMMITTEES,
  getDepartmentCatalogEntry,
  type DepartmentId,
} from '@/lib/departmentCatalog'
import type { HelpdeskDepartment } from '@/components/admin/Helpdesk/types'

interface LeadProfile {
  id: string
  full_name: string
  avatar_url: string | null
}

interface AdminOption {
  id: string
  role: string
  full_name: string
}

interface QuickLink {
  to: string
  icon: string
  label: string
  color: string
}

const GREEN = 'hsl(var(--primary))'
const GOLD = 'hsl(var(--accent))'
const RED = 'hsl(var(--destructive))'
const INK = 'hsl(var(--on-surface))'

// Department-specific tooling — every link is an existing admin route.
// The finance dashboard is intentionally not linked here; department finance is its own lane.
const QUICK_LINKS: Record<DepartmentId, QuickLink[]> = {
  'board-governance': [
    { to: '/admin/executive', icon: 'corporate_fare', label: 'Executive Dashboard', color: GREEN },
    { to: '/admin/analytics', icon: 'bar_chart', label: 'Movement Analytics', color: GREEN },
    { to: '/admin/roadmap', icon: 'route', label: 'Mission Roadmap', color: GOLD },
    { to: '/admin/party-officials', icon: 'badge', label: 'Party Officials', color: INK },
    { to: '/admin/administrators', icon: 'shield', label: 'Accountability & Access', color: GREEN },
  ],
  ncc: [
    { to: '/admin/it-department', icon: 'computer', label: 'National ICT', color: GREEN },
    { to: '/admin/war-room', icon: 'radio', label: 'Security / Intel', color: RED },
    { to: '/admin/members', icon: 'hub', label: 'Operations & Organising', color: GREEN },
    { to: '/admin/media-hub', icon: 'campaign', label: 'Media & Communications', color: GOLD },
    {
      to: '/admin/finance-requests',
      icon: 'account_balance',
      label: 'Finance & Fundraising',
      color: INK,
    },
    { to: '/admin/priorities', icon: 'query_stats', label: 'Research & Policy', color: RED },
    {
      to: '/admin/leadership',
      icon: 'groups_2',
      label: 'Appointment, Discipline & Welfare',
      color: GOLD,
    },
  ],
  'movement-management': [
    { to: '/admin/donations', icon: 'volunteer_activism', label: 'Donations', color: GOLD },
    { to: '/admin/spending-ledger', icon: 'account_balance', label: 'Spending Ledger', color: INK },
  ],
  'diaspora-affairs': [
    { to: '/admin/diaspora-affairs', icon: 'dashboard', label: 'Diaspora Dashboard', color: GREEN },
    { to: '/admin/chapters', icon: 'public', label: 'Diaspora', color: GREEN },
    { to: '/admin/chapter-ops', icon: 'groups', label: 'Diaspora Operations', color: GREEN },
    { to: '/admin/members', icon: 'group', label: 'Diaspora Members', color: GOLD },
    { to: '/admin/broadcasts', icon: 'campaign', label: 'Diaspora Communications', color: GOLD },
    { to: '/admin/polls', icon: 'query_stats', label: 'Diaspora Research', color: RED },
    { to: '/admin/leadership', icon: 'groups_2', label: 'Diaspora Leads', color: INK },
  ],
  rcc: [
    { to: '/admin/regions', icon: 'travel_explore', label: 'Regional Command', color: GREEN },
    {
      to: '/admin/mobilization-metrics',
      icon: 'hub',
      label: 'Operations & Organising',
      color: GREEN,
    },
    { to: '/admin/broadcasts', icon: 'campaign', label: 'Media & Communications', color: GOLD },
    {
      to: '/admin/finance-requests',
      icon: 'account_balance',
      label: 'Finance & Fundraising',
      color: INK,
    },
    { to: '/admin/analytics', icon: 'query_stats', label: 'Research & Policy', color: RED },
    {
      to: '/admin/leadership',
      icon: 'groups_2',
      label: 'Appointment, Discipline & Welfare',
      color: GOLD,
    },
  ],
  ccc: [
    { to: '/admin/constituencies', icon: 'groups', label: 'Constituency Command', color: GREEN },
    { to: '/admin/ground-game', icon: 'hub', label: 'Operations & Organising', color: GREEN },
    { to: '/admin/broadcasts', icon: 'campaign', label: 'Media & Communications', color: GOLD },
    {
      to: '/admin/finance-requests',
      icon: 'account_balance',
      label: 'Finance & Fundraising',
      color: INK,
    },
    { to: '/admin/polls', icon: 'query_stats', label: 'Research & Policy', color: RED },
    {
      to: '/admin/leadership',
      icon: 'groups_2',
      label: 'Appointment, Discipline & Welfare',
      color: GOLD,
    },
  ],
  'polling-stations': [
    {
      to: '/admin/polling-stations',
      icon: 'ballot',
      label: 'Polling Station Registry',
      color: GREEN,
    },
    { to: '/admin/ground-game', icon: 'how_to_vote', label: 'Grassroots Operations', color: RED },
    { to: '/admin/members', icon: 'group', label: 'Assigned Agents', color: GOLD },
  ],
}

interface DeptStats {
  open: number
  inProgress: number
  urgentOpen: number
  unassigned: number
  resolved30d: number
  total: number
}

export default function DepartmentDashboard() {
  const { deptId } = useParams<{ deptId: string }>()
  const { setCurrentLabel } = usePageLabel()
  const catalogDept = getDepartmentCatalogEntry(deptId)

  const [dept, setDept] = useState<HelpdeskDepartment | null>(null)
  const [stats, setStats] = useState<DeptStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<LeadProfile | null>(null)
  const [appointOpen, setAppointOpen] = useState(false)
  const [adminOptions, setAdminOptions] = useState<AdminOption[]>([])
  const [selectedLead, setSelectedLead] = useState('')
  const [savingLead, setSavingLead] = useState(false)

  const currentRole = adminService.getCurrentUser()?.role
  const isSuper = currentRole === 'SUPER_ADMIN' || currentRole === 'FOUNDER'

  useEffect(() => {
    if (dept) setCurrentLabel(dept.name)
  }, [dept, setCurrentLabel])

  useEffect(() => {
    if (!deptId || !catalogDept) return
    let cancelled = false
    async function load() {
      const { dept: deptRow, stats: deptStats } = await messagingService.getDepartmentDashboard(
        deptId as string
      )
      if (cancelled) return
      const deptData = (deptRow as unknown as HelpdeskDepartment) ?? null
      setDept(deptData)
      if (deptData?.lead_id) {
        const leadRow = await messagingService.getUserProfile(deptData.lead_id)
        if (!cancelled) setLead((leadRow as LeadProfile) ?? null)
      } else {
        setLead(null)
      }
      if (cancelled) return
      setStats(deptStats)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [catalogDept, deptId])

  async function openAppoint() {
    setSelectedLead(dept?.lead_id ?? '')
    setAppointOpen(true)
    if (adminOptions.length === 0) {
      const options = await messagingService.getAdminOptions()
      setAdminOptions(options)
    }
  }

  async function saveLead() {
    if (!deptId || !catalogDept) return
    setSavingLead(true)
    const newLeadId = selectedLead || null
    try {
      await messagingService.updateDepartmentLead(deptId, newLeadId)
      toast.success(newLeadId ? 'Department lead appointed' : 'Department lead removed')
      setDept((prev) => (prev ? { ...prev, lead_id: newLeadId } : prev))
      if (newLeadId) {
        const opt = adminOptions.find((a) => a.id === newLeadId)
        setLead(opt ? { id: opt.id, full_name: opt.full_name, avatar_url: null } : null)
      } else {
        setLead(null)
      }
      setAppointOpen(false)
    } catch {
      toast.error('Failed to update department lead')
    }
    setSavingLead(false)
  }

  if (!deptId) return null

  if (!catalogDept || (!loading && !dept)) {
    return (
      <div className="main">
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
            Department not found.
          </p>
          <Link
            to="/admin/departments"
            className="btn btn-outline btn-sm"
            style={{ marginTop: 12 }}
          >
            Back to Departments
          </Link>
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Open Tickets', value: stats?.open, bar: RED, sub: 'Awaiting first response' },
    { label: 'In Progress', value: stats?.inProgress, bar: GOLD, sub: 'Being worked on' },
    {
      label: 'Urgent / High',
      value: stats?.urgentOpen,
      bar: RED,
      sub: 'High-priority still open',
    },
    { label: 'Unassigned', value: stats?.unassigned, bar: INK, sub: 'Open with no handler' },
    {
      label: 'Resolved (30d)',
      value: stats?.resolved30d,
      bar: GREEN,
      sub: 'Closed out this month',
    },
    { label: 'All Time', value: stats?.total, bar: GREEN, sub: 'Total tickets received' },
  ]

  const quickLinks = catalogDept ? QUICK_LINKS[catalogDept.id] : []
  const showSubCommittees = catalogDept
    ? ['ncc', 'diaspora-affairs', 'rcc', 'ccc'].includes(catalogDept.id)
    : false

  return (
    <div className="main">
      {/* Department header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 'var(--radius-md)',
            background: 'hsl(var(--primary) / 0.1)',
            border: '1px solid hsl(var(--primary) / 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 24, color: 'hsl(var(--primary))' }}
          >
            {dept?.icon ?? 'apartment'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {dept?.name ?? 'Department'}
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>
            {lead ? (
              <>
                Lead: <span style={{ color: 'hsl(var(--on-surface))' }}>{lead.full_name}</span>
              </>
            ) : (
              'No lead appointed'
            )}
          </p>
        </div>
        {isSuper && (
          <button
            className="btn btn-outline btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => void openAppoint()}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              person_add
            </span>
            {lead ? 'Change Lead' : 'Appoint Lead'}
          </button>
        )}
        <Link to="/admin/departments" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            apps
          </span>
          All Departments
        </Link>
      </div>

      {/* KPI tiles */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
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
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 4px',
              }}
            >
              {loading ? '—' : (kpi.value ?? 0)}
            </p>
            <p
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Department tools */}
      {quickLinks.length > 0 && (
        <div className="panel" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '13px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Department tools
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 1,
              background: 'hsl(var(--border))',
            }}
          >
            {quickLinks.map((link) => (
              <Link
                key={link.to + link.label}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 18px',
                  background: 'hsl(var(--card))',
                  textDecoration: 'none',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--card))')}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, color: link.color }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {showSubCommittees && (
        <div className="panel" style={{ marginBottom: 24, padding: 20 }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 12,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Sub-committees in this level
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 10,
            }}
          >
            {DEPARTMENT_SUB_COMMITTEES.map((committee) => (
              <div
                key={committee.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, color: 'hsl(var(--primary))' }}
                >
                  {committee.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {committee.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Ticket queue — permission-gated by handler_roles inside Helpdesk */}
      <div className="ph" style={{ marginBottom: 8 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Ticket queue
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Tickets submitted to {dept?.name ?? 'this department'}
          </p>
        </div>
      </div>
      <Helpdesk departmentId={deptId} />

      {/* Appoint lead modal */}
      {appointOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setAppointOpen(false)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 400,
              width: '100%',
              padding: 24,
              borderRadius: 'var(--radius-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {dept?.lead_id ? 'Change' : 'Appoint'} {dept?.name} Lead
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Pick from provisioned administrators. The lead is the accountable owner of this
              department.
            </p>
            <select
              value={selectedLead}
              onChange={(e) => setSelectedLead(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 10px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                boxSizing: 'border-box',
                marginBottom: 18,
              }}
            >
              <option value="">— No lead —</option>
              {adminOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} ({a.role})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setAppointOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={savingLead}
                onClick={() => void saveLead()}
              >
                {savingLead ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
