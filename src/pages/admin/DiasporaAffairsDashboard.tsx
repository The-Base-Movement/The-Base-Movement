import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Helpdesk } from '@/components/admin/Helpdesk'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { adminService } from '@/services/adminService'

interface DiasporaChapter {
  id: string
  name: string
  country: string
}

const QUICK_LINKS = [
  { to: '/admin/chapters', icon: 'public', label: 'Manage diaspora chapters' },
  { to: '/admin/chapter-ops', icon: 'hub', label: 'Diaspora operations' },
  { to: '/admin/members', icon: 'group', label: 'Diaspora members' },
  { to: '/admin/broadcasts', icon: 'campaign', label: 'Diaspora communications' },
  { to: '/admin/leadership', icon: 'groups_2', label: 'Diaspora leads' },
]

export default function DiasporaAffairsDashboard() {
  const { setCurrentLabel } = usePageLabel()
  const [chapters, setChapters] = useState<DiasporaChapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrentLabel('Diaspora Affairs')
  }, [setCurrentLabel])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const diasporaChapters = await adminService.getDiasporaChapters()
      if (!cancelled) {
        setChapters(diasporaChapters)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const countryCount = useMemo(() => {
    const set = new Set(chapters.map((c) => c.country || 'Unassigned'))
    return set.size
  }, [chapters])

  return (
    <div className="main">
      <AdminPageHeader
        title="Diaspora Affairs"
        icon="public"
        description="Command dashboard for diaspora chapters, chapter leads, communications, and support requests."
        actions={
          <Link to="/admin/departments/diaspora-affairs" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              apartment
            </span>
            Department queue
          </Link>
        }
      />

      <div className="kpis" style={{ marginBottom: 24 }}>
        <TacticalKPI
          label="Diaspora Communities"
          value={loading ? '...' : chapters.length.toLocaleString()}
          variant="green"
          description="Non-Ghana chapter hubs"
        />
        <TacticalKPI
          label="Countries"
          value={loading ? '...' : countryCount.toLocaleString()}
          variant="gold"
          description="Countries with active hubs"
        />
        <TacticalKPI
          label="Reporting Line"
          value="NCC"
          variant="black"
          description="Diaspora affairs reports to national command"
        />
      </div>

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
            Diaspora operations
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
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
                background: 'hsl(var(--card))',
                color: 'hsl(var(--on-surface))',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 17, color: 'hsl(var(--primary))' }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

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
            Diaspora affairs helpdesk
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Requests from diaspora chapter leads and operators. For coverage and mobilization data
            by country, see{' '}
            <Link to="/admin/chapter-ops" style={{ color: 'hsl(var(--primary))' }}>
              Diaspora operations
            </Link>
            .
          </p>
        </div>
      </div>
      <Helpdesk departmentId="diaspora-affairs" />
    </div>
  )
}
