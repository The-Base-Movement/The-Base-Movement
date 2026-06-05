import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import BackToTop from './BackToTop'
import { ShareModal } from './ShareModal'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { sessionStore } from '@/lib/sessionStore'
import { supabase } from '@/lib/supabase'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { useStore } from '@/hooks/useStore'
import { contentService } from '@/services/contentService'

export default function DashboardLayout() {
  const { settings } = useBranding()
  const { session } = useAuth()
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

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user?.id) return
      const adminData = await adminService.getAdminData(session.user.id)
      setIsAdmin(!!adminData)
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
          const slug = toSlug(leadChapter)
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
            to: `/dashboard/chapters/${toSlug(dbChapter)}`,
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
      await authService.logout()
      sessionStore.clearAll()
      navigate('/login')
    } catch (error) {
      console.error('[AUTH] Sign out sequence failed:', error)
      // Fallback redirect
      navigate('/login')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Overview'
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
      {/* Admin back-link banner */}
      {isAdmin && (
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
          {/* Left: icon + label */}
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

          {/* Right: back link */}
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
      )}

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity"
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
            ? `https://thebasemovement.com/register?ref=${userRegNo}`
            : 'https://thebasemovement.com/register'
        }
      />

      {/* Navigation Shell (SideNavBar) */}
      <aside
        aria-label="Dashboard Sidebar"
        className={`fixed left-0 flex flex-col bg-[#181d19] text-white border-r-[4px] border-accent z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-60'}`}
        style={{ top: isAdmin ? 36 : 0, height: isAdmin ? 'calc(100% - 36px)' : '100%' }}
      >
        {/* Fixed Header */}
        <div
          className={`py-[24px] flex items-center border-b border-white/[0.08] mb-3 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-[22px] gap-[10px]'}`}
        >
          <Link
            to="/"
            className="w-10 h-10 bg-background flex items-center justify-center rounded-sm shadow-2xl p-1.5 shrink-0"
          >
            <img
              src={settings.logo_url}
              alt="The Base Logo"
              className="w-full h-full object-contain"
              decoding="async"
            />
          </Link>
          {!isSidebarCollapsed && (
            <Link
              to="/"
              className="overflow-hidden whitespace-nowrap"
              style={{ textDecoration: 'none' }}
            >
              <h1 className="text-[16px] font-medium text-white leading-none mb-0 tracking-tight">
                The Base
              </h1>
              <p className="text-[9px] text-accent font-medium tracking-[0.04em] uppercase mt-1 mb-0">
                Member portal
              </p>
            </Link>
          )}
        </div>

        {/* Back to Site Action */}
        {!isSidebarCollapsed && (
          <div className="px-4 mb-4">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-[4px] transition-all group border border-white/5"
            >
              <span className="material-symbols-outlined text-[18px] text-accent">arrow_back</span>
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
                Back to Site
              </span>
            </Link>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {[
            {
              label: 'Movement',
              items: [
                { to: '/dashboard', icon: 'dashboard', label: 'Overview' },
                { to: '/dashboard/blog', icon: 'article', label: 'Updates' },
                { to: '/dashboard/agenda', icon: 'event_note', label: 'The Plan' },
                { to: '/dashboard/impact', icon: 'insights', label: 'Impact' },
                { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Polls' },
              ],
            },
            {
              label: 'Community',
              items: [
                { to: '/dashboard/members', icon: 'groups', label: 'Members' },
                ...(userPlatform === 'GHANA'
                  ? [
                      {
                        to: '/dashboard/constituencies',
                        icon: 'location_city',
                        label: 'Constituencies',
                      },
                      ...(myConstituencyLink
                        ? [
                            {
                              to: myConstituencyLink.to,
                              icon: myConstituencyLink.icon,
                              label: 'My Constituency',
                              subItems: myConstituencyLink.subLinkTo
                                ? [
                                    {
                                      to: myConstituencyLink.subLinkTo,
                                      icon: 'manage_accounts',
                                      label: 'Constituency Hub',
                                    },
                                  ]
                                : undefined,
                            },
                          ]
                        : []),
                    ]
                  : [
                      { to: '/dashboard/chapters', icon: 'account_balance', label: 'Chapters' },
                      ...(myChapterLink
                        ? [
                            {
                              to: myChapterLink.to,
                              icon: myChapterLink.icon,
                              label: 'My Chapter',
                              subItems: myChapterLink.subLinkTo
                                ? [
                                    {
                                      to: myChapterLink.subLinkTo,
                                      icon: 'manage_accounts',
                                      label: 'Chapter Dashboard',
                                    },
                                  ]
                                : undefined,
                            },
                          ]
                        : []),
                    ]),
                { to: '/dashboard/leadership', icon: 'groups_3', label: 'Leadership' },
              ],
            },
            {
              label: 'Get Involved',
              items: [
                { to: '/dashboard/jobs', icon: 'work', label: 'Jobs' },
                { to: '/dashboard/donate', icon: 'volunteer_activism', label: 'Donate' },
                { to: '/dashboard/store', icon: 'storefront', label: 'Store' },
              ],
            },
            {
              label: 'Personal',
              items: [
                { to: '/dashboard/liked', icon: 'favorite', label: 'Liked Posts' },
                { to: '/dashboard/referrals', icon: 'group_add', label: 'Referrals' },
                {
                  to: '/dashboard/my-donations',
                  icon: 'volunteer_activism',
                  label: 'My Donations',
                },
                { to: '/dashboard/tickets', icon: 'confirmation_number', label: 'My Tickets' },
                { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
              ],
            },
          ].map((group) => (
            <div key={group.label} className="nav-sec mt-2">
              {!isSidebarCollapsed && (
                <h6 className="text-[9px] font-medium text-white/40 tracking-[0.08em] uppercase mb-2 mt-2 px-6 font-meta">
                  {group.label}
                </h6>
              )}
              <div className="space-y-0.5 px-4">
                {group.items.map((item) => (
                  <div key={item.to}>
                    <Link
                      className={`relative flex items-center transition-all font-meta text-[12px] font-medium tracking-tight rounded-[4px] ${isSidebarCollapsed ? 'px-0 justify-center h-14' : 'px-[12px] py-[10px]'} ${isActive(item.to) || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)) ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-primary/10' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                      to={item.to}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${isSidebarCollapsed ? 'mr-0' : 'mr-[10px]'}`}
                        style={{
                          fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }}
                      >
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && (
                        <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.to === '/dashboard/liked' && likedCount > 0 && (
                            <span
                              style={{
                                background: 'hsl(var(--accent))',
                                color: '#181d19',
                                fontSize: 10,
                                fontWeight: 600,
                                minWidth: 18,
                                height: 18,
                                borderRadius: 9,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 5px',
                                marginLeft: 8,
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {likedCount}
                            </span>
                          )}
                          {item.to === '/dashboard/referrals' && referralCount > 0 && (
                            <span
                              style={{
                                background: 'hsl(var(--accent))',
                                color: '#181d19',
                                fontSize: 10,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                minWidth: 18,
                                height: 18,
                                borderRadius: 'var(--radius-pill)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 5px',
                                marginLeft: 8,
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {referralCount}
                            </span>
                          )}
                        </span>
                      )}
                      {item.to === '/dashboard/liked' && likedCount > 0 && isSidebarCollapsed && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 18,
                            background: 'hsl(var(--accent))',
                            color: '#181d19',
                            fontSize: 9,
                            fontWeight: 'bold',
                            minWidth: 14,
                            height: 14,
                            borderRadius: 7,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 3px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          {likedCount}
                        </span>
                      )}
                      {item.to === '/dashboard/referrals' &&
                        referralCount > 0 &&
                        isSidebarCollapsed && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 18,
                              background: 'hsl(var(--accent))',
                              color: '#181d19',
                              fontSize: 9,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              minWidth: 14,
                              height: 14,
                              borderRadius: 'var(--radius-pill)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 3px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            {referralCount}
                          </span>
                        )}
                    </Link>
                    {'subItems' in item &&
                      item.subItems &&
                      !isSidebarCollapsed &&
                      item.subItems.map((sub) => (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          className={`flex items-center transition-all font-meta text-[11px] font-medium tracking-tight rounded-[4px] px-[12px] py-[7px] ${
                            isActive(sub.to) || location.pathname.startsWith(sub.to)
                              ? 'bg-white/10 text-white'
                              : 'text-white/45 hover:bg-white/5 hover:text-white/80'
                          }`}
                          style={{ paddingLeft: 36 }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 14,
                              marginRight: 7,
                              fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                            }}
                          >
                            {sub.icon}
                          </span>
                          {sub.label}
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
            className={`mt-8 mb-8 px-4 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}
          >
            <button
              onClick={() => setIsShareModalOpen(true)}
              style={{
                width: isSidebarCollapsed ? 44 : '100%',
                height: 44,
                borderRadius: isSidebarCollapsed ? '50%' : 4,
                background: 'hsl(var(--primary))',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                letterSpacing: '0.02em',
                boxShadow: '0 4px 16px rgba(0,107,63,0.25)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                share
              </span>
              {!isSidebarCollapsed && 'Invite & Share'}
            </button>
          </div>
        </div>

        {/* User identification footer */}
        {!isSidebarCollapsed && (
          <div className="mt-auto px-[22px] py-6 border-t border-white/[0.08] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[1.5px] border-accent overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-[10px] font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <b className="block text-[12px] text-white font-medium leading-none mb-1 truncate capitalize">
                {userName?.toLowerCase()}
              </b>
              <span className="block text-[10px] text-white/50 truncate">
                Patriot ID: {userRegNo?.slice(0, 8)}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Canvas */}
      <main
        id="main-content"
        className={`min-h-screen bg-muted/10 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-60'}`}
        style={{ paddingTop: isAdmin ? 116 : 80 }}
      >
        {/* ── Topbar ── fixed, clears the sidebar */}
        <div
          className={`fixed left-0 right-0 z-40 bg-white border-b border-border shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-60'}`}
          style={{ top: isAdmin ? 36 : 0 }}
        >
          <div className="flex items-center justify-between px-6 md:px-10 h-20">
            {/* Left: Hamburger (Mobile) + Current Page Title */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(true)
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                }}
                className="p-2 -ml-2 rounded-sm hover:bg-muted/10 text-on-surface/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">menu</span>
              </button>

              <h1 className="hidden md:block text-[20px] md:text-[24px] font-medium tracking-tight text-on-surface m-0 font-meta">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right: Actions + Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Search — desktop only */}
              <div className="hidden lg:block" style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    opacity: 0.4,
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  aria-label="Search the movement…"
                  name="name-bd4fad"
                  id="input-bd4fad"
                  type="text"
                  placeholder="Search the movement…"
                  style={{
                    width: 240,
                    height: 36,
                    paddingLeft: 34,
                    paddingRight: 14,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Donate shortcut */}
              <Link
                to="/dashboard/donate"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 14px',
                  height: 36,
                  background: 'hsl(var(--accent))',
                  color: 'hsl(var(--on-surface))',
                  borderRadius: 4,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  textDecoration: 'none',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                className="hidden md:flex"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  volunteer_activism
                </span>
                Donate ₵
              </Link>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setOpenNotifications((v) => !v)
                    setOpenUserMenu(false)
                    if (!openNotifications && unreadCount > 0) {
                      const unread = notifications.filter((n) => !n.is_read)
                      unread.forEach((n) => adminService.markNotificationRead(n.id).catch(() => {}))
                      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                      setUnreadCount(0)
                    }
                  }}
                  aria-label={
                    unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'
                  }
                  aria-expanded={openNotifications}
                  aria-haspopup="true"
                  style={{
                    position: 'relative',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: openNotifications ? 'hsl(var(--container-low))' : 'none',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    cursor: 'pointer',
                    color: 'hsl(var(--on-surface-muted))',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20 }}
                    aria-hidden="true"
                  >
                    notifications
                  </span>
                  <span className="sr-only">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                      : 'Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 7,
                        height: 7,
                        background: 'hsl(var(--destructive))',
                        borderRadius: '50%',
                        border: '1.5px solid #fff',
                      }}
                    />
                  )}
                </button>

                {openNotifications && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setOpenNotifications(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 6px)',
                        zIndex: 50,
                        background: '#fff',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        width: 320,
                        maxHeight: 420,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid hsl(var(--border))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'hsl(var(--container-low))',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Public Sans',sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          Notifications
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans',sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {notifications.length} total
                        </span>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 340 }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '32px 14px', textAlign: 'center' }}>
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 32,
                                color: 'hsl(var(--border))',
                                display: 'block',
                                marginBottom: 8,
                              }}
                            >
                              notifications_none
                            </span>
                            <span
                              style={{
                                fontFamily: "'Public Sans',sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 12,
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              No notifications yet
                            </span>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              style={{
                                display: 'flex',
                                gap: 10,
                                padding: '11px 14px',
                                borderBottom: '1px solid hsl(var(--border))',
                                background: n.is_read ? '#fff' : 'hsl(var(--container-low))',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: 16,
                                  marginTop: 1,
                                  flexShrink: 0,
                                  color:
                                    n.type === 'Alert'
                                      ? 'hsl(var(--destructive))'
                                      : n.type === 'Action'
                                        ? 'hsl(var(--accent))'
                                        : 'hsl(var(--primary))',
                                }}
                              >
                                {n.type === 'Alert'
                                  ? 'warning'
                                  : n.type === 'Action'
                                    ? 'task_alt'
                                    : 'info'}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontFamily: "'Public Sans',sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 12,
                                    color: 'hsl(var(--on-surface))',
                                    marginBottom: 2,
                                  }}
                                >
                                  {n.title}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "'Public Sans',sans-serif",
                                    fontWeight: 500,
                                    fontSize: 11,
                                    color: 'hsl(var(--on-surface-muted))',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {n.message}
                                </div>
                                <div
                                  style={{
                                    fontFamily: "'Public Sans',sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 10,
                                    color: 'hsl(var(--on-surface-muted))',
                                    marginTop: 4,
                                    opacity: 0.6,
                                  }}
                                >
                                  {new Date(n.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div
                        style={{
                          borderTop: '1px solid hsl(var(--border))',
                          padding: '8px 14px',
                        }}
                      >
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                          onClick={() => {
                            setOpenNotifications(false)
                            navigate('/dashboard/notifications')
                          }}
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenUserMenu((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '4px 10px 4px 4px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: 'hsl(var(--primary))',
                      flexShrink: 0,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        decoding="async"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11,
                        }}
                      >
                        {initials || 'M'}
                      </div>
                    )}
                  </div>
                  <span
                    className="hidden md:block"
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      maxWidth: 100,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                    }}
                  >
                    {userName?.toLowerCase()}
                  </span>

                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                  >
                    expand_more
                  </span>
                </button>

                {openUserMenu && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setOpenUserMenu(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 6px)',
                        zIndex: 50,
                        background: '#fff',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        minWidth: 210,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Identity header */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            textTransform: 'capitalize',
                            marginBottom: 2,
                          }}
                        >
                          {userName?.toLowerCase()}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          ID: {userRegNo?.slice(0, 10) || 'Unverified'}
                        </div>
                      </div>
                      {/* Menu items */}
                      {[
                        { icon: 'person', label: 'Member Profile', to: '/dashboard/settings' },
                        { icon: 'settings', label: 'Settings', to: '/dashboard/settings' },
                        { icon: 'favorite', label: 'My Wishlist', to: '/dashboard/store/wishlist' },
                      ].map((item) => (
                        <Link
                          key={item.to + item.label}
                          to={item.to}
                          onClick={() => setOpenUserMenu(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                            textDecoration: 'none',
                            position: 'relative',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                          {item.icon === 'favorite' && wishlist.length > 0 && (
                            <span
                              style={{
                                marginLeft: 'auto',
                                minWidth: 18,
                                height: 18,
                                borderRadius: 'var(--radius-pill)',
                                background: 'hsl(var(--primary))',
                                color: '#fff',
                                fontSize: 9,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 5px',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {wishlist.length}
                            </span>
                          )}
                        </Link>
                      ))}
                      <div style={{ height: 1, background: 'hsl(var(--border))' }} />
                      <button
                        onClick={() => {
                          setOpenUserMenu(false)
                          handleLogout()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          color: 'hsl(var(--destructive))',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          logout
                        </span>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-body">
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </div>

        {/* Dashboard Footer */}
        <footer className="mt-16 py-10 px-12 border-t border-border/10 bg-muted/5">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-micro text-muted-foreground/40 mb-0 font-medium tracking-tight uppercase">
              © {new Date().getFullYear()} The Base Movement. National Infrastructure.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <Link
                className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
                to="/dashboard/privacy"
              >
                Privacy
              </Link>
              <Link
                className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
                to="/dashboard/terms"
              >
                Terms
              </Link>
              <Link
                className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
                to="/dashboard/contact"
              >
                Support
              </Link>
            </div>
          </div>
        </footer>
      </main>
      <BackToTop />
    </div>
  )
}
