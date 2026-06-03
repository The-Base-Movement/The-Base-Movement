import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AdminUser } from '@/types/admin'
import { ITLayoutContext } from './ITLayoutContext'
import type React from 'react'

const IT_ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER']

const IT_NAV: { to: string; icon: string; label: string }[] = [
  { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
  { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
  { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
  { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
  { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
  { to: '/admin/it-department/security-protocols', icon: 'security', label: 'Security Protocols' },
  { to: '/admin/it-department/system', icon: 'shield', label: 'System' },
  { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
]

interface ITHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

export default function ITDepartmentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [user, setUser] = useState<AdminUser | null>(() => adminService.getCurrentUser())
  const [checking, setChecking] = useState(() => !adminService.getCurrentUser())
  const [header, setHeader] = useState<ITHeader>({
    title: 'IT Department',
    icon: 'computer',
    description: '',
  })

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
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            The IT Department is only accessible to IT Managers and Super Admins.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/dashboard')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <ITLayoutContext.Provider value={{ header, setHeader }}>
      <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
        {/* Full-width page header */}
        <AdminPageHeader
          title={header.title}
          icon={header.icon}
          description={header.description}
          actions={header.actions}
          style={isMobile ? { padding: '0 14px 16px' } : undefined}
        />

        {isMobile ? (
          /* ── Mobile: horizontal tab strip + full-width content ── */
          <div style={{ padding: '0 14px 40px' }}>
            <nav
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 12,
                marginBottom: 20,
                scrollbarWidth: 'none',
              }}
            >
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
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: active ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                      color: active ? '#fff' : 'hsl(var(--on-surface-muted))',
                      textDecoration: 'none',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      border: active ? 'none' : '1px solid hsl(var(--border))',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <Outlet />
          </div>
        ) : (
          /* ── Desktop: sidebar + content ── */
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <aside
              style={{
                width: 196,
                flexShrink: 0,
                position: 'sticky',
                top: 24,
              }}
            >
              {/* Sidebar header */}
              <div style={{ padding: '14px 16px 12px', marginBottom: 4 }}>
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
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15, color: '#fff' }}
                    >
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
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, flexShrink: 0 }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              {/* Role badge */}
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
        )}
      </div>
    </ITLayoutContext.Provider>
  )
}
