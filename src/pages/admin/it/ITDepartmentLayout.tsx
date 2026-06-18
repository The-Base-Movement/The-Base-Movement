import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AdminUser } from '@/types/admin'
import { ITLayoutContext } from './ITLayoutContext'
import type React from 'react'

const IT_ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']

interface ITHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

export default function ITDepartmentLayout() {
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
    if (checking && !user) {
      adminService.initialize().then((u) => {
        setUser(u)
        setChecking(false)
      })
    } else if (!checking || user) {
      setChecking(false)
    }
  }, [])

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

        {/* Page content */}
        <div style={isMobile ? { padding: '0 14px 40px' } : undefined}>
          <Outlet />
        </div>
      </div>
    </ITLayoutContext.Provider>
  )
}
