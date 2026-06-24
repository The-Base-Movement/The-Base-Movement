/**
 * Media Hub Layout Component
 * -------------------------------------------------------------
 * Layout component for the Media & Communications Hub section.
 * Enforces role authorization checking (editors, correspondents,
 * communications officers, founders, super admins) and exposes
 * layout context for title/icon headers.
 */

import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AdminUser } from '@/types/admin'
import { MediaHubContext } from './MediaHubContext'
import type React from 'react'

const MEDIA_ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'FOUNDER',
  'CHIEF_EDITOR',
  'SENIOR_EDITOR',
  'EDITOR',
  'JUNIOR_EDITOR',
  'REGIONAL_CORRESPONDENT',
  'COMMUNICATIONS_OFFICER',
]

interface MediaHubHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

// Layout component managing Media Hub section authorization gate and sub-routing outlets
export default function MediaHubLayout() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [user, setUser] = useState<AdminUser | null>(() => adminService.getCurrentUser())
  const [checking, setChecking] = useState(() => !adminService.getCurrentUser())
  const [header, setHeader] = useState<MediaHubHeader>({
    title: 'Media Hub',
    icon: 'newsmode',
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

  if (!user || !MEDIA_ALLOWED_ROLES.includes(user.role)) {
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
            The Media Hub is only accessible to media and communications team members.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/dashboard')}>
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <MediaHubContext.Provider value={{ header, setHeader }}>
      <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
        {/* Full-width page header with brand icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 4,
            padding: isMobile ? '0 14px' : undefined,
          }}
        >
          <img
            src="/media-hub-icon.png"
            alt="Media Hub"
            style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <AdminPageHeader
              title={header.title}
              icon={header.icon}
              description={header.description}
              actions={header.actions}
            />
          </div>
        </div>

        {/* Page content */}
        <div style={isMobile ? { padding: '0 14px 40px' } : undefined}>
          <Outlet />
        </div>
      </div>
    </MediaHubContext.Provider>
  )
}
