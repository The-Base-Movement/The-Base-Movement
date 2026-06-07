import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { OrgChart } from './components/OrgChart'

interface ITStats {
  totalProjects: number
  completedProjects: number
  activeTodos: number
  pendingTickets: number
  totalAssets: number
  assignedAssets: number
  damagedAssets: number
  unresolvedAlerts: number
}

const QUICK_LINKS = [
  {
    to: '/admin/it-department/projects',
    icon: 'folder_open',
    label: 'Projects',
    color: 'hsl(var(--primary))',
  },
  {
    to: '/admin/it-department/notes',
    icon: 'sticky_note_2',
    label: 'Notes',
    color: 'hsl(var(--accent))',
  },
  {
    to: '/admin/it-department/todos',
    icon: 'checklist',
    label: 'To-Dos',
    color: 'hsl(var(--on-surface))',
  },
  {
    to: '/admin/it-department/security-protocols',
    icon: 'security',
    label: 'Security Protocols',
    color: 'hsl(var(--destructive))',
  },
  {
    to: '/admin/it-department/hierarchy',
    icon: 'account_tree',
    label: 'Team Hierarchy',
    color: 'hsl(var(--primary))',
  },
]

export default function ITDashboard() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('IT Department')
  }, [setCurrentLabel])

  useITLayout(
    'IT Department',
    'computer',
    'Internal IT operations — projects, tasks, protocols and team structure.'
  )

  const [stats, setStats] = useState<ITStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [
          { count: total },
          { count: completed },
          { count: activeTodos },
          { count: pendingTickets },
          { count: totalAssets },
          { count: assignedAssets },
          { count: damagedAssets },
          { count: unresolvedAlerts },
        ] = await Promise.all([
          supabase.from('it_projects').select('*', { count: 'exact', head: true }),
          supabase
            .from('it_projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'),
          supabase
            .from('it_todos')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'done'),
          supabase
            .from('it_tickets')
            .select('*', { count: 'exact', head: true })
            .in('status', ['open', 'in-progress']),
          supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', 'it'),
          supabase
            .from('asset_assignments')
            .select('assets!inner(department_id)', { count: 'exact', head: true })
            .eq('assets.department_id', 'it')
            .is('checked_in_at', null),
          supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', 'it')
            .eq('condition', 'damaged'),
          supabase
            .from('asset_alerts')
            .select('*', { count: 'exact', head: true })
            .eq('resolved', false),
        ])

        setStats({
          totalProjects: total ?? 0,
          completedProjects: completed ?? 0,
          activeTodos: activeTodos ?? 0,
          pendingTickets: pendingTickets ?? 0,
          totalAssets: totalAssets ?? 0,
          assignedAssets: assignedAssets ?? 0,
          damagedAssets: damagedAssets ?? 0,
          unresolvedAlerts: unresolvedAlerts ?? 0,
        })
      } catch (err) {
        console.error('[IT Dashboard] Failed to load stats:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const kpis: {
    label: string
    value: number | undefined
    icon: string
    bar: string
    sub: string
    to?: string
  }[] = [
    {
      label: 'Total Projects on Board',
      value: stats?.totalProjects,
      icon: 'folder_open',
      bar: 'hsl(var(--on-surface))',
      sub: 'All projects registered in the system',
    },
    {
      label: 'Projects Completed',
      value: stats?.completedProjects,
      icon: 'task_alt',
      bar: 'hsl(var(--primary))',
      sub: 'Delivered and marked complete',
    },
    {
      label: 'Active To-Dos',
      value: stats?.activeTodos,
      icon: 'checklist',
      bar: 'hsl(var(--accent))',
      sub: 'Tasks not yet marked as done',
    },
    {
      label: 'Pending Tickets',
      value: stats?.pendingTickets,
      icon: 'confirmation_number',
      bar: 'hsl(var(--destructive))',
      sub: 'Open and in-progress tickets',
      to: '/admin/it-department/helpdesk',
    },
    {
      label: 'Asset Alerts',
      value: stats?.unresolvedAlerts,
      icon: 'warning',
      bar: 'hsl(var(--destructive))',
      sub: 'Overdue or missing assets',
      to: '/admin/it-department/assets',
    },
    {
      label: 'Total Assets',
      value: stats?.totalAssets,
      icon: 'inventory_2',
      bar: 'hsl(var(--on-surface))',
      sub: 'All IT department assets',
      to: '/admin/it-department/assets',
    },
    {
      label: 'Assigned Assets',
      value: stats?.assignedAssets,
      icon: 'person_check',
      bar: 'hsl(var(--accent))',
      sub: 'Currently checked out',
      to: '/admin/it-department/assets',
    },
    {
      label: 'Damaged Assets',
      value: stats?.damagedAssets,
      icon: 'report',
      bar: 'hsl(var(--destructive))',
      sub: 'Condition marked as damaged',
      to: '/admin/it-department/assets',
    },
  ]

  return (
    <div>
      {/* KPI tiles */}
      <div className="kpis" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => {
          const content = (
            <div
              className="panel"
              style={{
                padding: '16px 18px 16px 22px',
                position: 'relative',
                overflow: 'hidden',
                cursor: kpi.to ? 'pointer' : undefined,
              }}
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                    margin: 0,
                  }}
                >
                  {kpi.label}
                </p>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: kpi.bar, opacity: 0.55 }}
                >
                  {kpi.icon}
                </span>
              </div>
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
          )
          return kpi.to ? (
            <Link key={kpi.label} to={kpi.to} style={{ textDecoration: 'none' }}>
              {content}
            </Link>
          ) : (
            <div key={kpi.label}>{content}</div>
          )
        })}
      </div>

      {/* Org chart */}
      <div style={{ marginBottom: 28 }}>
        <OrgChart />
      </div>

      {/* Quick access */}
      <div className="panel">
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
            Quick access
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 1,
            background: 'hsl(var(--border))',
          }}
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                background: 'hsl(var(--surface))',
                textDecoration: 'none',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--surface))')}
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
    </div>
  )
}
