/**
 * IT Department Layout Component
 * -------------------------------------------------------------
 * Layout component for the IT Department dashboard section.
 * Enforces role authorization checking (IT managers, founders, super admins)
 * and exposes layout context for title/icon headers.
 */

import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AdminUser } from '@/types/admin'
import { ITLayoutContext } from './ITLayoutContext'
import type React from 'react'

const IT_ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'FOUNDER',
  'ICT_DIRECTOR',
  'IT_MANAGER',
  'SYSTEM_ADMINISTRATOR',
  'ADMIN',
]

interface ITHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

// Layout component managing IT section authorization gate and sub-routing outlets
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
    const currentUser = adminService.getCurrentUser()
    let timer: ReturnType<typeof setTimeout> | undefined

    if (!currentUser) {
      adminService.initialize().then((u) => {
        setUser(u)
        setChecking(false)
      })
    } else {
      timer = setTimeout(() => {
        setChecking(false)
      }, 0)
    }

    return () => {
      if (timer) clearTimeout(timer)
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

  const hasSystemAccess =
    !!user &&
    (IT_ALLOWED_ROLES.includes(user.role) || adminService.can('VIEW_AUDIT_LOGS', 'SYSTEM'))

  if (!user || !hasSystemAccess) {
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
            The IT Department is only accessible to approved IT and system administrators.
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
