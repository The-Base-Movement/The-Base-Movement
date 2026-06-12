import { useState, useEffect, useRef } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import { messagingService } from '@/services/messagingService'
import { authService } from '@/services/authService'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageLabelProvider } from '@/contexts/PageLabelContext'
import type { AdminUser, Notification } from '@/types/admin'
import { SubmitTicketModal } from '@/components/admin/SubmitTicketModal'
import { MfaSetupNag } from '@/components/admin/MfaSetupNag'
import { AdminSidebar } from './admin/AdminSidebar'
import { AdminTopbar } from './admin/AdminTopbar'

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { settings } = useBranding()
  const { session } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0)
  const [pendingDonationsCount, setPendingDonationsCount] = useState<number>(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0)
  const [submitTicketOpen, setSubmitTicketOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const canSubmitTicket =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'FOUNDER' ||
    (user?.permissions ?? []).some(
      (p) => p.action === 'SUBMIT_IT_TICKET' && p.resource === 'IT_SUPPORT'
    )

  useEffect(() => {
    const applyDensity = () => {
      const density = localStorage.getItem('admin_interface_density') || 'Comfortable'
      const root = document.documentElement

      if (density === 'Compact') {
        root.style.setProperty('--admin-padding', '1.5rem')
        root.style.setProperty('--admin-gap', '1rem')
        root.style.setProperty('--admin-font-scale', '0.95')
      } else if (density === 'High Density') {
        root.style.setProperty('--admin-padding', '1rem')
        root.style.setProperty('--admin-gap', '0.75rem')
        root.style.setProperty('--admin-font-scale', '0.9')
      } else {
        root.style.setProperty('--admin-padding', '3rem')
        root.style.setProperty('--admin-gap', '2rem')
        root.style.setProperty('--admin-font-scale', '1')
      }

      // Sync dark mode preference if available
      const localDarkMode = localStorage.getItem('admin_dark_mode')
      if (localDarkMode === 'true') {
        root.setAttribute('data-theme', 'dark')
      } else if (localDarkMode === 'false') {
        root.removeAttribute('data-theme')
      } else {
        const adminData = user || JSON.parse(localStorage.getItem('admin_user_session') || '{}')
        if (adminData?.preferences?.darkMode) {
          root.setAttribute('data-theme', 'dark')
        } else {
          root.removeAttribute('data-theme')
        }
      }
    }

    applyDensity()
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('admin_density_changed', applyDensity)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('admin_density_changed', applyDensity)
      window.removeEventListener('resize', handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const init = async () => {
      const currentUser = await adminService.initialize()
      if (!currentUser) {
        navigate('/admin-login')
      } else {
        setUser(currentUser)

        // Resolve avatar from auth session (using the one from AuthContext if available)
        const sessionAvatar = session?.user?.user_metadata?.avatar_url || null
        setAvatarUrl(currentUser.avatarUrl || sessionAvatar || null)

        // Apply dark mode if preference exists
        if (currentUser.preferences?.darkMode) {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.removeAttribute('data-theme')
        }

        // Fetch unread notifications
        try {
          const [notes, pendingVer, pendingDon, unreadMsgs] = await Promise.all([
            adminService.getNotifications(),
            adminService.getPendingVerifications(),
            donationService.getPendingDonations(),
            messagingService.getLeaderUnreadTotal(currentUser.id),
          ])
          setNotifications(notes)
          setUnreadCount(notes.filter((n: Notification) => !n.is_read).length)
          setPendingVerificationsCount(pendingVer.length)
          setPendingDonationsCount(pendingDon.length)
          setUnreadMessagesCount(unreadMsgs)
        } catch (err) {
          console.error('Failed to fetch admin notifications/counts:', err)
        }
      }
    }
    init()
  }, [navigate, session])

  // 15-minute inactivity timeout — only sign out after no admin interaction.
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityAt = useRef(Date.now())
  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000
    const logoutIfIdle = async () => {
      const idleFor = Date.now() - lastActivityAt.current
      if (idleFor < TIMEOUT_MS) {
        reset()
        return
      }
      await authService.logout()
      navigate('/admin-login')
    }
    const reset = () => {
      lastActivityAt.current = Date.now()
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(() => {
        void logoutIfIdle()
      }, TIMEOUT_MS)
    }
    const events = [
      'pointermove',
      'mousemove',
      'mousedown',
      'click',
      'keydown',
      'touchstart',
      'wheel',
      'scroll',
      'focus',
    ] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [navigate])

  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await adminService.markNotificationRead(id)
      if (success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
      await Promise.all(unreadIds.map((id) => adminService.markNotificationRead(id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    navigate('/admin-login')
  }

  return (
    <div
      className="h-screen font-meta text-on-surface flex overflow-hidden admin-context"
      style={{ background: 'var(--container-low)' }}
    >
      <SEO noindex />
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden',
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
        avatarUrl={avatarUrl}
        logoUrl={settings.logo_url}
        handleLogout={handleLogout}
        pendingVerificationsCount={pendingVerificationsCount}
        pendingDonationsCount={pendingDonationsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminTopbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          user={user}
          avatarUrl={avatarUrl}
          unreadCount={unreadCount}
          notifications={notifications}
          isNotificationsOpen={isNotificationsOpen}
          setIsNotificationsOpen={setIsNotificationsOpen}
          handleMarkAsRead={handleMarkAsRead}
          handleMarkAllAsRead={handleMarkAllAsRead}
          isUserMenuOpen={isUserMenuOpen}
          setIsUserMenuOpen={setIsUserMenuOpen}
          handleLogout={handleLogout}
          canSubmitTicket={canSubmitTicket}
          setSubmitTicketOpen={setSubmitTicketOpen}
          windowWidth={windowWidth}
        />

        {/* Content Area */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out admin-content-area"
          style={{
            fontSize: `calc(1rem * var(--admin-font-scale, 1))`,
          }}
        >
          <PageLabelProvider>
            <div className="max-w-7xl mx-auto w-full">
              <Breadcrumbs />
              {children || <Outlet />}

              {/* Movement Slogan Footer */}
              <footer
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  paddingBottom: 24,
                  borderTop: '1px solid hsl(var(--border) / 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: 0.5,
                  transition: 'opacity 0.5s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
              >
                <div style={{ display: 'flex' }}>
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--destructive))' }} />
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--accent))' }} />
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--primary))' }} />
                </div>
                <div
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                      color: 'hsl(var(--on-surface))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Ghana First, Jobs for the Youth!
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    © {new Date().getFullYear()} The Base Movement · Operational Command Center
                  </p>
                </div>
              </footer>
            </div>
          </PageLabelProvider>
        </main>
      </div>
      {submitTicketOpen && user && (
        <SubmitTicketModal userId={user.id} onClose={() => setSubmitTicketOpen(false)} />
      )}
      <MfaSetupNag />
    </div>
  )
}
