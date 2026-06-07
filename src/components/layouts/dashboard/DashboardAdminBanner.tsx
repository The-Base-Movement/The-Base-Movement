import { Link } from 'react-router-dom'

interface Props {
  isAdmin: boolean
}

export default function DashboardAdminBanner({ isAdmin }: Props) {
  if (!isAdmin) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: '#181d19',
        borderBottom: '2px solid hsl(var(--accent))',
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontFamily: "'Public Sans', sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: '0.01em',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--accent))', flexShrink: 0 }}
        >
          admin_panel_settings
        </span>
        <span
          className="hidden sm:inline"
          style={{
            color: 'rgba(255,255,255,0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Viewing member dashboard as admin
        </span>
        <span className="sm:hidden" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Admin view
        </span>
      </div>
      <Link
        to="/admin/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          color: 'hsl(var(--accent))',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: 12,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
          arrow_back
        </span>
        <span className="hidden sm:inline">Back to </span>Admin
      </Link>
    </div>
  )
}
