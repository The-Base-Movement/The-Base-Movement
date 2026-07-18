/**
 * AdminLayout Component
 * -------------------------------------------------------------
 * Layout wrapper for the administrative portal pages.
 * Handles access-control validation, 15-minute inactivity timeouts,
 * interface density/theme overrides, real-time counters (unread messages,
 * verifications, donations), and sidebar toggle states.
 */

import { Suspense, useState, useEffect, useCallback } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import { messagingService } from '@/services/messagingService'
import { authService } from '@/services/authService'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { useAdminSessionTimer } from '@/hooks/useAdminSessionTimer'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageLabelProvider } from '@/contexts/PageLabelContext'
import { getAdminRouteAccessDecision } from '@/lib/adminRouteAccess'
import type { AdminUser, Notification } from '@/types/admin'
import { SubmitTicketModal } from '@/components/admin/SubmitTicketModal'
import { MfaSetupNag } from '@/components/admin/MfaSetupNag'
import { AdminSidebar } from './admin/AdminSidebar'
import { AdminTopbar } from './admin/AdminTopbar'

/**
 * AdminLayout
 * -------------------------------------------------------------
 * Main shell component wrapping children with admin layout panels.
 */
export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { settings } = useBranding()
  const { session } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  const [isAuthorizing, setIsAuthorizing] = useState(() => !adminService.getCurrentUser())
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
      setIsAuthorizing(false)
      if (!currentUser) {
        setUser(null)
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
  }, [session])

  // Close sidebar on route change on mobile/tablet screens
  useEffect(() => {
    if (windowWidth < 1024) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarOpen(false)
    }
  }, [location.pathname, windowWidth])

  const handleSessionTimeout = useCallback(async () => {
    await authService.logout()
    navigate('/command')
  }, [navigate])

  const { secondsLeft } = useAdminSessionTimer({ onTimeout: handleSessionTimeout })

  /**
   * handleMarkAsRead
   * -------------------------------------------------------------
   * Dispatches command to mark a single notification read in database,
   * updating state counts on success.
   */
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

  /**
   * handleMarkAllAsRead
   * -------------------------------------------------------------
   * Resolves and updates all unread notifications to read status.
   */
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

  /**
   * handleLogout
   * -------------------------------------------------------------
   * Asynchronously ends user session and redirects to the login screen.
   */
  const handleLogout = async () => {
    await authService.logout()
    navigate('/admin-login')
  }

  if (isAuthorizing) {
    return (
      <div
        style={{
          minHeight: '40vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
        }}
      >
        Verifying admin access...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  const accessDecision = getAdminRouteAccessDecision(user, location.pathname)
  const contentFallback = (
    <section
      className="main"
      style={{
        padding: '48px 24px',
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
        fontSize: 13,
      }}
    >
      Loading page...
    </section>
  )

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
          sessionSecondsLeft={secondsLeft}
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
              {accessDecision.allowed ? (
                <Suspense fallback={contentFallback}>{children || <Outlet />}</Suspense>
              ) : (
                <section
                  className="main"
                  style={{
                    minHeight: 'calc(100vh - 160px)',
                    padding: '48px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage:
                      "linear-gradient(hsl(var(--background) / 0.76), hsl(var(--background) / 0.86)), url('/branding/restricted-access-area-bg.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div
                    className="panel"
                    style={{
                      width: '100%',
                      maxWidth: 560,
                      padding: '32px 28px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        margin: '0 auto 16px',
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
                    <h1
                      style={{
                        margin: '0 0 8px',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 20,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Access Restricted
                    </h1>
                    <p
                      style={{
                        margin: '0 0 18px',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      This admin route is mounted, but your role does not meet the required frontend
                      access rule.
                    </p>
                    {accessDecision.reason && (
                      <p
                        style={{
                          margin: '0 0 18px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {accessDecision.reason}
                      </p>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      Back to dashboard
                    </button>
                  </div>
                </section>
              )}

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
