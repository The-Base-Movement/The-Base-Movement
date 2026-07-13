/**
 * Dashboard Sidebar Component
 * -------------------------------------------------------------
 * Responsive navigation sidebar container for the authenticated member dashboard.
 * Renders partitioned navigation groups dynamically mapped to constituency/chapter links
 * based on member location. Includes notification badges for personal metrics.
 */

import { Link, useLocation } from 'react-router-dom'

interface Settings {
  logo_url: string
}

interface MyLink {
  to: string
  icon: string
  subLinkTo?: string
}

interface NavSubItem {
  to: string
  icon: string
  label: string
}

interface NavItem {
  to: string
  icon: string
  label: string
  subItems?: NavSubItem[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface Props {
  settings: Settings
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isAdmin: boolean
  userPlatform: 'GHANA' | 'DIASPORA' | null
  myConstituencyLink: MyLink | null
  myChapterLink: MyLink | null
  likedCount: number
  referralCount: number
  messageCount: number
  setIsShareModalOpen: (v: boolean) => void
  onClose?: () => void
  toggleTheme: () => void
  isDarkTheme: boolean
  avatarUrl?: string | null
  userName?: string | null
  userRegNo?: string | null
  initials: string
}

/**
 * Sidebar
 * -------------------------------------------------------------
 * Main navigation container. Renders links, action triggers,
 * and user profile info.
 */
export default function Sidebar({
  settings,
  isSidebarOpen,
  isSidebarCollapsed,
  isAdmin,
  userPlatform,
  myConstituencyLink,
  myChapterLink,
  likedCount,
  referralCount,
  messageCount,
  setIsShareModalOpen,
  onClose,
  toggleTheme,
  isDarkTheme,
  avatarUrl,
  userName,
  userRegNo,
  initials,
}: Props) {
  const location = useLocation()

  // Helper to determine if a route is currently active
  const isActive = (path: string) => location.pathname === path

  const groups: NavGroup[] = [
    {
      label: 'Movement',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
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
              { to: '/dashboard/constituencies', icon: 'location_city', label: 'Constituencies' },
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
        { to: '/dashboard/my-donations', icon: 'volunteer_activism', label: 'My Donations' },
        { to: '/dashboard/tickets', icon: 'confirmation_number', label: 'My Tickets' },
        { to: '/dashboard/messages', icon: 'chat', label: 'Messages' },
        { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
      ],
    },
  ]

  return (
    <aside
      aria-label="Dashboard Sidebar"
      className={`fixed left-0 flex flex-col bg-[#181d19] text-white border-r-[4px] border-accent z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-60'} ${isAdmin ? 'top-0 h-full md:top-[36px] md:h-[calc(100%-36px)]' : 'top-0 h-full'}`}
    >
      {/* Fixed Header */}
      <div
        className={`py-[24px] flex items-center border-b border-white/[0.08] mb-3 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-[22px] gap-[10px]'}`}
      >
        <Link
          to="/"
          onClick={onClose}
          className="w-14 h-14 md:w-10 md:h-10 bg-white flex items-center justify-center rounded-sm shrink-0 p-1.5"
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
            onClick={onClose}
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
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden ml-auto bg-transparent border-none cursor-pointer text-white/70 hover:text-white p-1 flex items-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              close
            </span>
          </button>
        )}
      </div>

      {!isSidebarCollapsed && (
        <div className="px-4 mb-4 space-y-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-[4px] transition-all group border border-white/5"
          >
            <span className="material-symbols-outlined text-[18px] text-accent">arrow_back</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
              Back to Site
            </span>
          </Link>
          {/* Mobile-only: admin banner is hidden under md, so surface the link here */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={onClose}
              className="md:hidden flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-[4px] transition-all group border border-accent/40"
            >
              <span className="material-symbols-outlined text-[18px] text-accent">
                admin_panel_settings
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
                Admin Dashboard
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto sidebar-scroll min-h-0">
        {groups.map((group) => (
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
                    onClick={onClose}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${isSidebarCollapsed ? 'mr-0' : 'mr-[10px]'}`}
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
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
                        {item.to === '/dashboard/messages' && messageCount > 0 && (
                          <span
                            style={{
                              background: 'hsl(var(--destructive))',
                              color: '#fff',
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
                            {messageCount}
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
                    {item.to === '/dashboard/messages' &&
                      messageCount > 0 &&
                      isSidebarCollapsed && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 18,
                            background: 'hsl(var(--destructive))',
                            color: '#fff',
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
                          {messageCount}
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
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={`mt-8 mb-8 px-4 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
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
          <button
            className="dashboard-mobile-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              width: isSidebarCollapsed ? 44 : '100%',
              height: 44,
              marginTop: 10,
              borderRadius: isSidebarCollapsed ? '50%' : 4,
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              letterSpacing: '0.02em',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isDarkTheme ? 'light_mode' : 'dark_mode'}
            </span>
            {!isSidebarCollapsed && (isDarkTheme ? 'Light Mode' : 'Dark Mode')}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <div className="mt-auto px-[22px] py-6 border-t border-white/[0.08] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-[1.5px] border-accent overflow-hidden shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName || 'Member'}
                  className="w-full h-full object-cover"
                />
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
                Compatriot ID: {userRegNo?.slice(0, 8)}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
