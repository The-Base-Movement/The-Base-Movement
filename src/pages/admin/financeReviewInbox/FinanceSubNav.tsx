import { Link, useLocation } from 'react-router-dom'

export default function FinanceSubNav({ pendingCount }: { pendingCount: number }) {
  const location = useLocation()
  const tabs = [
    { to: '/admin/finance-requests', label: 'Finance Requests', icon: 'request_quote' },
    {
      to: '/admin/finance-requests/review-inbox',
      label: 'Review Inbox',
      icon: 'inbox',
      badge: pendingCount,
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.to
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={active ? 'btn-active-tab' : 'btn-inactive-tab'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              marginBottom: -1,
              textDecoration: 'none',
              fontSize: 12,
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {tab.icon}
            </span>
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                style={{
                  background: 'hsl(var(--accent))',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-pill)',
                  lineHeight: 1.4,
                }}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
