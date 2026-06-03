import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { AdminUser } from '@/types/admin'

const IT_ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER']

const IT_NAV: { to: string; icon: string; label: string }[] = [
  { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
  { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
  { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
  { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
  { to: '/admin/it-department/security-protocols', icon: 'security', label: 'Security Protocols' },
  { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
]

export default function ITDepartmentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(() => adminService.getCurrentUser())
  const [checking, setChecking] = useState(() => !adminService.getCurrentUser())

  useEffect(() => {
    if (checking) {
      adminService.initialize().then((u) => {
        setUser(u)
        setChecking(false)
      })
    }
  }, [checking])

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
        }}
      >
        Verifying access…
      </div>
    )
  }

  // ── Access guard ──────────────────────────────────────────────────────────
  if (!user || !IT_ALLOWED_ROLES.includes(user.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'hsl(var(--destructive) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28, color: 'hsl(var(--destructive))' }}
          >
            lock
          </span>
        </div>
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 16,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Access Restricted
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            The IT Department is only accessible to IT Managers and Super Admins.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/dashboard')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {/* IT sidebar */}
      <aside
        style={{
          width: 196,
          flexShrink: 0,
          position: 'sticky',
          top: 24,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: '14px 16px 12px',
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#fff' }}>
                computer
              </span>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.2,
                }}
              >
                IT Department
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Command Centre
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {IT_NAV.map((item) => {
            const exact = item.to === '/admin/it-department'
            const active = exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: active ? '#fff' : 'hsl(var(--on-surface-muted))',
                  background: active ? 'hsl(var(--primary))' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'hsl(var(--container-low))'
                    e.currentTarget.style.color = 'hsl(var(--on-surface))'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15, flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Divider + role badge */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
            padding: '12px 12px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              background: 'hsl(var(--container-low))',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 13, color: 'hsl(var(--primary))' }}
            >
              verified_user
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {user.role === 'FOUNDER' ? 'Founder' : 'IT Manager'}
            </span>
          </div>
        </div>
      </aside>

      {/* Page content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}
