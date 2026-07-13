import { Suspense, useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import BackToTop from './BackToTop'
import { ShareModal } from './ShareModal'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { sessionStore } from '@/lib/sessionStore'
import { diasporaSlug } from '@/lib/diaspora'
import { supabase } from '@/lib/supabase'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/hooks/useStore'
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'
import { contentService } from '@/services/contentService'
import { messagingService } from '@/services/messagingService'
import Sidebar from '@/components/DashboardLayout/Sidebar'
import Topbar from '@/components/layouts/dashboard/Topbar'
import DashboardAdminBanner from '@/components/layouts/dashboard/DashboardAdminBanner'
import DashboardFooter from '@/components/layouts/dashboard/DashboardFooter'

export default function DashboardLayout() {
  const { settings } = useBranding()
  const { session, signOut } = useAuth()
  const { wishlist } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('Member')
  const [userRegNo, setUserRegNo] = useState('')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNotifications, setOpenNotifications] = useState(false)
  const [notifications, setNotifications] = useState<import('@/types/admin').Notification[]>([])
  const [myChapterLink, setMyChapterLink] = useState<{
    to: string
    icon: string
    subLinkTo?: string
  } | null>(null)
  const [myConstituencyLink, setMyConstituencyLink] = useState<{
    to: string
    icon: string
    subLinkTo?: string
  } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userPlatform, setUserPlatform] = useState<'GHANA' | 'DIASPORA' | null>(null)
  const [likedCount, setLikedCount] = useState(0)
  const [referralCount, setReferralCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme')
    const adminDarkMode = localStorage.getItem('admin_dark_mode')
    return (
      storedTheme === 'dark' ||
      adminDarkMode === 'true' ||
      document.documentElement.getAttribute('data-theme') === 'dark'
    )
  })

  // Inactivity timeout: logout after 30 minutes of inactivity
  const { isWarningVisible, dismissWarning } = useInactivityTimeout({
    inactivityMinutes: 30,
    warningMinutes: 5,
    onTimeout: async () => {
      await signOut()
      navigate('/login')
    },
  })

  const toggleTheme = async () => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const nextIsDark = currentTheme !== 'dark'
    if (nextIsDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
      localStorage.setItem('admin_dark_mode', 'true')
      setIsDarkTheme(true)
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
      localStorage.setItem('admin_dark_mode', 'false')
      setIsDarkTheme(false)
    }
    window.dispatchEvent(new Event('admin_theme_changed'))

    if (session?.user?.id) {
      try {
        const adminData =
          adminService.getCurrentUser() || (await adminService.getAdminData(session.user.id))
        if (adminData) {
          const updatedPrefs: import('@/types/admin').AdminPreferences = {
            interfaceDensity: adminData.preferences?.interfaceDensity || 'Comfortable',
            darkMode: nextIsDark,
            notifications: adminData.preferences?.notifications || {
              newRegistrations: true,
              securityAlerts: true,
              auditEvents: true,
              financeRequests: true,
            },
          }
          await adminService.updatePreferences(adminData.id, updatedPrefs)
        }
      } catch (err) {
        console.error('[DASHBOARD] Failed to update preferences in DB:', err)
      }
    }
  }

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkTheme(document.documentElement.getAttribute('data-theme') === 'dark')
    }
    window.addEventListener('admin_theme_changed', handleThemeChange)
    return () => window.removeEventListener('admin_theme_changed', handleThemeChange)
  }, [])

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDarkTheme])

  // Unread message badge — re-checked on navigation so it clears after reading
  useEffect(() => {
    if (!session?.user?.id) return
    void messagingService.getMemberUnreadTotal(session.user.id).then(setMessageCount)
  }, [session, location.pathname])

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user?.id) return
      const adminData = await adminService.getAdminData(session.user.id)
      setIsAdmin(!!adminData)

      // Apply Admin Preferences (Density & Dark Mode)
      if (adminData?.preferences) {
        const { interfaceDensity, darkMode } = adminData.preferences
        if (interfaceDensity) {
          const densityValue = interfaceDensity.toLowerCase().replace(' ', '-')
          document.documentElement.setAttribute('data-density', densityValue)
        }
        if (darkMode) {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.removeAttribute('data-theme')
        }
      }
    }
    checkAdmin()
  }, [session])

  useEffect(() => {
    const toSlug = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    const checkChapterRole = async () => {
      try {
        if (!session?.user) return

        // Fetch platform, constituency, lead chapter and member chapter in parallel
        const [userResult, leadChapter, dbChapter] = await Promise.all([
          supabase
            .from('users')
            .select('platform, constituency')
            .eq('id', session.user.id)
            .maybeSingle(),
          adminService.getLeadChapter(session.user.id),
          adminService.getUserChapter(session.user.id),
        ])

        const userRow = userResult.data
        const platform = (userRow?.platform as 'GHANA' | 'DIASPORA') || 'GHANA'
        setUserPlatform(platform)

        if (platform === 'GHANA') {
          setMyChapterLink(null)
          const constituencyName = userRow?.constituency as string | null
          if (constituencyName) {
            const slug = toSlug(constituencyName)
            // Check if user is a coordinator/leader of this constituency
            const { data: coordData } = await supabase
              .from('ghana_constituencies')
              .select('id')
              .eq('leader_id', session.user.id)
              .maybeSingle()

            if (coordData) {
              setMyConstituencyLink({
                to: `/dashboard/constituencies/${slug}`,
                icon: 'manage_accounts',
                subLinkTo: '/dashboard/constituency-hub',
              })
            } else {
              setMyConstituencyLink({
                to: `/dashboard/constituencies/${slug}`,
                icon: 'my_location',
              })
            }
          } else {
            setMyConstituencyLink(null)
          }
          return
        }

        // DIASPORA logic
        setMyConstituencyLink(null)

        // Priority 1: user leads a chapter — show manage_accounts icon + Chapter Dashboard sublink
        if (leadChapter) {
          const slug = diasporaSlug(leadChapter)
          setMyChapterLink({
            to: `/dashboard/chapters/${slug}`,
            icon: 'manage_accounts',
            subLinkTo: `/dashboard/chapter-hub/${slug}`,
          })
          return
        }

        // Priority 2: regular member assigned to a chapter
        if (dbChapter) {
          setMyChapterLink({
            to: `/dashboard/chapters/${diasporaSlug(dbChapter)}`,
            icon: 'group',
          })
        } else {
          setMyChapterLink(null)
        }
      } catch {
        /* non-critical */
      }
    }

    const readProfile = async () => {
      // 1. Try to get the specific member profile from DB first (via regNo in storage)
      const storedRegNo = sessionStore.getItem('userRegNo')
      if (storedRegNo) {
        try {
          const profile = await adminService.getMemberProfile(storedRegNo)
          if (profile) {
            setUserName(profile.name)
            setAvatarUrl(profile.avatarUrl || null)
            setUserRegNo(profile.id)
            checkChapterRole()
            return
          }
        } catch (err) {
          console.warn('[DASHBOARD] Failed to sync member profile:', err)
        }
      }

      // 2. Fallback to Auth metadata if no stored member ID or DB fetch fails
      const user = authService.getUser()
      let resolvedName = 'Member'
      if (user) {
        const profile = await adminService.getMemberProfileByAuthId(user.id)
        if (profile) {
          sessionStore.setItem('userRegNo', profile.id)
          sessionStore.setItem('userName', profile.name)
          if (profile.avatarUrl) sessionStore.setItem('userAvatar', profile.avatarUrl)
          setUserName(profile.name)
          setAvatarUrl(profile.avatarUrl || null)
          setUserRegNo(profile.id)
          checkChapterRole()
          return
        }

        resolvedName = user.user_metadata?.full_name || 'Member'
        setUserName(resolvedName)
        setAvatarUrl(user.user_metadata?.avatar_url || null)
      } else {
        // 3. Last resort: Local storage raw values
        setAvatarUrl(sessionStore.getItem('userAvatar'))
        resolvedName = sessionStore.getItem('userName') || 'Member'
        setUserName(resolvedName)
      }

      setUserRegNo(sessionStore.getItem('userRegNo') || '')
      checkChapterRole()
    }

    readProfile()

    // Fetch notifications
    const fetchUnread = async () => {
      try {
        const notes = await adminService.getNotifications()
        setNotifications(notes)
        setUnreadCount(notes.filter((n) => !n.is_read).length)
      } catch {
        console.warn('[DASHBOARD] Notification sync failed')
      }
    }
    fetchUnread()

    window.addEventListener('storage', readProfile)
    return () => window.removeEventListener('storage', readProfile)
  }, [session])

  // Sync liked posts count in sidebar on mount and route transitions
  useEffect(() => {
    const fetchLikedCount = async () => {
      try {
        const posts = await contentService.getLikedPosts()
        setLikedCount(posts.length)
      } catch (err) {
        console.warn('[DASHBOARD] Failed to sync liked posts count:', err)
      }
    }
    fetchLikedCount()
    const fetchReferralCount = async () => {
      try {
        const { referralService } = await import('@/services/referralService')
        const refs = await referralService.getMyReferrals()
        setReferralCount(refs.length)
      } catch {
        /* non-critical */
      }
    }
    fetchReferralCount()
  }, [location.pathname])

  // Close sidebar on route change
  useEffect(() => {
    const closeSidebar = () => setIsSidebarOpen(false)
    closeSidebar()
  }, [location.pathname])

  // Being on the member side revokes the admin 2FA gate: crossing back into
  // /admin/* must re-prompt for the authenticator code (anti theft-of-device)
  useEffect(() => {
    sessionStorage.removeItem('admin_gate_verified')
  }, [location.pathname])

  // Redirect to Change Password page if must_change_password is true in user metadata
  useEffect(() => {
    if (session?.user?.user_metadata?.must_change_password) {
      if (location.pathname !== '/dashboard/change-password') {
        navigate('/dashboard/change-password', { replace: true })
      }
    }
  }, [session, location.pathname, navigate])

  // Derive initials from the stored name
  const initials = (userName || 'Member')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    try {
      await signOut()
      sessionStore.clearAll()
      navigate('/login')
    } catch (error) {
      console.error('[AUTH] Sign out sequence failed:', error)
      // Fallback redirect
      navigate('/login')
    }
  }

  // helper previously used by the sidebar; kept for potential future use

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path === '/dashboard/blog') return 'Updates'
    if (path.startsWith('/dashboard/blog/')) return 'Update Article'
    if (path === '/dashboard/agenda') return 'The Plan'
    if (path === '/dashboard/impact') return 'Impact'
    if (path === '/dashboard/polls') return 'Feedback'
    if (path === '/dashboard/store') return 'Store'
    if (path === '/dashboard/donate') return 'Donations'
    if (path === '/dashboard/members') return 'Verified'
    if (path === '/dashboard/leadership') return 'Leadership'
    if (path === '/dashboard/chapters') return 'Chapters'
    if (path.startsWith('/dashboard/chapters/')) return 'Chapter Details'
    if (path === '/dashboard/constituencies') return 'Constituencies'
    if (path.startsWith('/dashboard/constituencies/')) return 'Constituency'
    if (path === '/dashboard/chapter-hub' || path.startsWith('/dashboard/chapter-hub/'))
      return 'My Chapter'
    if (path === '/dashboard/constituency-hub') return 'Constituency Hub'
    if (path.startsWith('/dashboard/constituency-hub/')) return 'Constituency Hub'
    if (path === '/dashboard/contact') return 'Support'
    if (path === '/dashboard/settings') return 'Profile'
    if (path === '/dashboard/liked') return 'Liked Posts'
    if (path === '/dashboard/referrals') return 'Referrals'
    if (path === '/dashboard/my-donations') return 'My Donations'
    if (path === '/dashboard/tickets') return 'My Tickets'
    if (path === '/dashboard/wishlist') return 'Wishlist'
    if (path === '/dashboard/cart') return 'Cart'
    if (path === '/dashboard/checkout') return 'Checkout'
    if (path === '/dashboard/summary') return 'Order Summary'
    return 'Member Portal'
  }

  const contentFallback = (
    <section className="panel" style={{ padding: 24, minHeight: 240 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 192,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
        }}
      >
        Loading page...
      </div>
    </section>
  )

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <SEO noindex />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-md focus:font-semibold focus:text-white"
        style={{ background: 'hsl(var(--primary))' }}
      >
        Skip to main content
      </a>
      <DashboardAdminBanner isAdmin={isAdmin} />

      {/* Mobile backdrop: closes the sidebar when tapping outside */}
      {isSidebarOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Invite others to join The Base"
        url={
          userRegNo
            ? `https://www.thebasemovement.org.gh/register?ref=${userRegNo}`
            : 'https://www.thebasemovement.org.gh/register'
        }
      />

      <Sidebar
        settings={settings}
        isSidebarOpen={isSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        isAdmin={isAdmin}
        userPlatform={userPlatform}
        myConstituencyLink={myConstituencyLink}
        myChapterLink={myChapterLink}
        likedCount={likedCount}
        referralCount={referralCount}
        messageCount={messageCount}
        setIsShareModalOpen={setIsShareModalOpen}
        onClose={() => setIsSidebarOpen(false)}
        toggleTheme={toggleTheme}
        isDarkTheme={isDarkTheme}
        avatarUrl={avatarUrl}
        userName={userName}
        userRegNo={userRegNo}
        initials={initials}
      />

      {/* Main Content Canvas */}
      <main
        id="main-content"
        className={`min-h-screen bg-muted/10 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-60'} ${isAdmin ? 'pt-20 md:pt-[116px]' : 'pt-20'}`}
      >
        <Topbar
          getPageTitle={getPageTitle}
          isAdmin={isAdmin}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarOpen={setIsSidebarOpen}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          toggleTheme={toggleTheme}
          isDarkTheme={isDarkTheme}
          setOpenNotifications={setOpenNotifications}
          openNotifications={openNotifications}
          unreadCount={unreadCount}
          notifications={notifications}
          adminService={adminService}
          setNotifications={setNotifications}
          setUnreadCount={setUnreadCount}
          navigate={navigate}
          openUserMenu={openUserMenu}
          setOpenUserMenu={setOpenUserMenu}
          avatarUrl={avatarUrl}
          userName={userName}
          userRegNo={userRegNo}
          initials={initials}
          wishlist={wishlist}
          handleLogout={handleLogout}
        />

        <div className="dashboard-body">
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <Suspense fallback={contentFallback}>
              <Outlet />
            </Suspense>
          </div>
        </div>

        <DashboardFooter />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 768px) {
                .dashboard-header-actions {
                  gap: 8px !important;
                }

                .dashboard-header-theme-toggle {
                  display: none !important;
                }

                .dashboard-header-donate {
                  display: flex !important;
                  width: 36px !important;
                  min-width: 36px !important;
                  padding: 0 !important;
                  border-radius: var(--radius-sm) !important;
                  box-shadow: 0 6px 16px rgba(191, 167, 106, 0.24);
                }

                .dashboard-header-donate-label {
                  display: none !important;
                }

                .dashboard-mobile-theme-toggle {
                  display: flex !important;
                }
              }
            `,
          }}
        />
      </main>
      <BackToTop />

      {/* Inactivity Warning Modal */}
      {isWarningVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'hsl(var(--card))',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 24, color: 'hsl(var(--accent))' }}
              >
                schedule
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Session Timeout
              </h2>
            </div>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.5,
              }}
            >
              You've been inactive for 25 minutes. Your session will expire in 5 minutes for
              security reasons.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
                style={{ justifyContent: 'center' }}
              >
                Sign Out
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={dismissWarning}
                style={{ justifyContent: 'center' }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
