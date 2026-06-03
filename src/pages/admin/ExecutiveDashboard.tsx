import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { financeService } from '@/services/financeService'

export default function ExecutiveDashboard() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('Executive Dashboard')
  }, [setCurrentLabel])

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0 })

  useEffect(() => {
    financeService
      .getRequests()
      .then((requests) => {
        setStats({
          total: requests.length,
          approved: requests.filter((r) => r.status === 'Approved').length,
          rejected: requests.filter((r) => r.status === 'Rejected').length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    {
      label: 'Requested Funds',
      value: loading ? '—' : stats.total,
      bar: 'hsl(var(--on-surface))',
      icon: 'request_quote',
      sub: 'Total fund requests submitted',
    },
    {
      label: 'Approved Funds',
      value: loading ? '—' : stats.approved,
      bar: 'hsl(var(--primary))',
      icon: 'check_circle',
      sub: 'Requests approved for release',
    },
    {
      label: 'Rejected Funds',
      value: loading ? '—' : stats.rejected,
      bar: 'hsl(var(--destructive))',
      icon: 'cancel',
      sub: 'Requests declined by finance',
    },
  ]

  const quickLinks = [
    { to: '/admin/finance-requests', icon: 'request_quote', label: 'Finance Requests' },
    { to: '/admin/finance-dashboard', icon: 'analytics', label: 'Finance Dashboard' },
    { to: '/admin/war-room', icon: 'radio', label: 'War Room' },
    { to: '/admin/mobilization-metrics', icon: 'my_location', label: 'Deployment Metrics' },
    { to: '/admin/priorities', icon: 'shield', label: 'Strategic Focus' },
    { to: '/admin/roadmap', icon: 'route', label: 'Mission Roadmap' },
  ]

  return (
    <div className="main">
      <AdminPageHeader
        title="Executive Dashboard"
        icon="corporate_fare"
        description="Senior party oversight — fund requests, approvals and key operational access."
      />

      {/* Fund request KPIs */}
      <div className="kpis" style={{ marginBottom: 28 }}>
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
                style={{ fontSize: 16, color: kpi.bar, opacity: 0.6 }}
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
              {kpi.value}
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

      {/* Quick access links */}
      <div className="panel">
        <div
          style={{
            padding: '14px 20px',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 1,
            background: 'hsl(var(--border))',
          }}
        >
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 18px',
                background: '#fff',
                textDecoration: 'none',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
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
    </div>
  )
}
