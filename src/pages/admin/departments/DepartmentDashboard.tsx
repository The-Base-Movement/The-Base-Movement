import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { Helpdesk } from '@/components/admin/Helpdesk'
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

// Department-specific tooling — every link is an existing admin route
const QUICK_LINKS: Record<string, QuickLink[]> = {
  membership: [
    { to: '/admin/members', icon: 'group', label: 'Member Directory', color: GREEN },
    { to: '/admin/verification', icon: 'verified_user', label: 'KYC Queue', color: GOLD },
    { to: '/admin/leadership', icon: 'shield', label: 'Leadership Hub', color: INK },
    { to: '/admin/messages', icon: 'chat', label: 'Messages', color: GREEN },
  ],
  constituency: [
    { to: '/admin/constituencies', icon: 'location_city', label: 'Constituencies', color: GREEN },
    { to: '/admin/regions', icon: 'map', label: 'Regions', color: GOLD },
    { to: '/admin/chapter-ops', icon: 'hub', label: 'Chapter Operations', color: INK },
    { to: '/admin/ground-game', icon: 'directions_walk', label: 'Ground Game', color: RED },
  ],
  chapter: [
    { to: '/admin/chapters', icon: 'groups', label: 'Chapters', color: GREEN },
    { to: '/admin/leadership', icon: 'shield', label: 'Leadership Hub', color: GOLD },
    { to: '/admin/messages', icon: 'chat', label: 'Messages', color: INK },
  ],
  finance: [
    { to: '/admin/finance-dashboard', icon: 'analytics', label: 'Finance Dashboard', color: GREEN },
    { to: '/admin/donations', icon: 'volunteer_activism', label: 'Donations', color: GOLD },
    { to: '/admin/spending-ledger', icon: 'receipt_long', label: 'Spending Ledger', color: INK },
    { to: '/admin/finance-requests', icon: 'request_quote', label: 'Finance Requests', color: RED },
  ],
  media: [
    { to: '/admin/blogs', icon: 'article', label: 'Blog Posts', color: GREEN },
    { to: '/admin/broadcasts', icon: 'campaign', label: 'Broadcasts', color: GOLD },
    { to: '/admin/newsletter', icon: 'mail', label: 'Newsletter', color: INK },
    { to: '/admin/media', icon: 'photo_library', label: 'Media Library', color: GREEN },
    { to: '/admin/authors', icon: 'history_edu', label: 'Authors', color: GOLD },
  ],
  store: [
    { to: '/admin/store', icon: 'storefront', label: 'Store', color: GREEN },
    { to: '/admin/orders', icon: 'shopping_bag', label: 'Orders', color: GOLD },
    {
      to: '/admin/logistics-intelligence',
      icon: 'inventory_2',
      label: 'Logistics Intelligence',
      color: INK,
    },
  ],
  youth: [
    { to: '/admin/members', icon: 'group', label: 'Member Directory', color: GREEN },
    { to: '/admin/polls', icon: 'how_to_vote', label: 'Polls', color: GOLD },
    { to: '/admin/broadcasts', icon: 'campaign', label: 'Broadcasts', color: INK },
    { to: '/admin/jobs', icon: 'work', label: 'Jobs Board', color: GREEN },
  ],
  executive: [
    { to: '/admin/executive', icon: 'corporate_fare', label: 'Executive Dashboard', color: GREEN },
    { to: '/admin/war-room', icon: 'radio', label: 'War Room', color: RED },
    { to: '/admin/directives', icon: 'gavel', label: 'Directives', color: GOLD },
    { to: '/admin/priorities', icon: 'flag', label: 'Priorities', color: INK },
    { to: '/admin/analytics', icon: 'bar_chart', label: 'Analytics', color: GREEN },
  ],
  movement_leader: [
    { to: '/admin/executive', icon: 'corporate_fare', label: 'Executive Dashboard', color: GREEN },
    { to: '/admin/war-room', icon: 'radio', label: 'War Room', color: RED },
    { to: '/admin/directives', icon: 'gavel', label: 'Directives', color: GOLD },
  ],
  it: [
    { to: '/admin/it-department', icon: 'computer', label: 'IT Department', color: GREEN },
    {
      to: '/admin/it-department/helpdesk',
      icon: 'support_agent',
      label: 'IT Helpdesk',
      color: GOLD,
    },
    { to: '/admin/it-department/assets', icon: 'inventory_2', label: 'IT Assets', color: INK },
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
    if (!deptId) return
    let cancelled = false
    async function load() {
      const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
      const base = () =>
        supabase
          .from('helpdesk_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', deptId as string)

      const [{ data: deptRow }, open, inProgress, urgentOpen, unassigned, resolved30d, total] =
        await Promise.all([
          supabase.from('helpdesk_departments').select('*').eq('id', deptId).maybeSingle(),
          base().eq('status', 'open'),
          base().eq('status', 'in-progress'),
          base().in('status', ['open', 'in-progress']).in('priority', ['urgent', 'high']),
          base().in('status', ['open', 'in-progress']).is('assigned_to', null),
          base().eq('status', 'resolved').gte('updated_at', since30d),
          base(),
        ])
      if (cancelled) return
      const deptData = (deptRow as HelpdeskDepartment) ?? null
      setDept(deptData)
      if (deptData?.lead_id) {
        const { data: leadRow } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', deptData.lead_id)
          .maybeSingle()
        if (!cancelled) setLead((leadRow as LeadProfile) ?? null)
      } else {
        setLead(null)
      }
      if (cancelled) return
      setStats({
        open: open.count ?? 0,
        inProgress: inProgress.count ?? 0,
        urgentOpen: urgentOpen.count ?? 0,
        unassigned: unassigned.count ?? 0,
        resolved30d: resolved30d.count ?? 0,
        total: total.count ?? 0,
      })
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [deptId])

  async function openAppoint() {
    setSelectedLead(dept?.lead_id ?? '')
    setAppointOpen(true)
    if (adminOptions.length === 0) {
      const { data } = await supabase.from('admins').select('id, role, users(full_name)')
      const rows = (data ?? []) as unknown as {
        id: string
        role: string
        users: { full_name: string | null } | null
      }[]
      setAdminOptions(
        rows
          .map((r) => ({ id: r.id, role: r.role, full_name: r.users?.full_name ?? 'Unknown' }))
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
      )
    }
  }

  async function saveLead() {
    if (!deptId) return
    setSavingLead(true)
    const newLeadId = selectedLead || null
    const { error } = await supabase
      .from('helpdesk_departments')
      .update({ lead_id: newLeadId })
      .eq('id', deptId)
    if (error) {
      toast.error('Failed to update department lead')
    } else {
      toast.success(newLeadId ? 'Department lead appointed' : 'Department lead removed')
      setDept((prev) => (prev ? { ...prev, lead_id: newLeadId } : prev))
      if (newLeadId) {
        const opt = adminOptions.find((a) => a.id === newLeadId)
        setLead(opt ? { id: opt.id, full_name: opt.full_name, avatar_url: null } : null)
      } else {
        setLead(null)
      }
      setAppointOpen(false)
    }
    setSavingLead(false)
  }

  if (!deptId) return null

  if (!loading && !dept) {
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

  const quickLinks = QUICK_LINKS[deptId] ?? []

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
