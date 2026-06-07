import type { Dispatch, MouseEvent, SetStateAction } from 'react'
import { Link, type NavigateFunction } from 'react-router-dom'
import type { Notification } from '@/types/admin'
import type { Product } from '@/types/product'

interface AdminNotificationService {
  markNotificationRead: (id: string) => Promise<unknown>
}

interface UserMenuItem {
  icon: string
  label: string
  to: string
}

interface TopbarProps {
  getPageTitle: () => string
  isAdmin: boolean
  isSidebarCollapsed: boolean
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>
  setIsSidebarCollapsed: Dispatch<SetStateAction<boolean>>
  toggleTheme: () => void
  isDarkTheme: boolean
  setOpenNotifications: Dispatch<SetStateAction<boolean>>
  openNotifications: boolean
  unreadCount: number
  notifications: Notification[]
  adminService: AdminNotificationService
  setNotifications: Dispatch<SetStateAction<Notification[]>>
  setUnreadCount: Dispatch<SetStateAction<number>>
  navigate: NavigateFunction
  openUserMenu: boolean
  setOpenUserMenu: Dispatch<SetStateAction<boolean>>
  avatarUrl: string | null
  userName: string
  userRegNo: string
  initials: string
  wishlist: Product[]
  handleLogout: () => void
}

const userMenuItems: UserMenuItem[] = [
  { icon: 'person', label: 'Member Profile', to: '/dashboard/settings' },
  { icon: 'settings', label: 'Settings', to: '/dashboard/settings' },
  { icon: 'favorite', label: 'My Wishlist', to: '/dashboard/store/wishlist' },
]

export default function Topbar({
  getPageTitle,
  isAdmin,
  isSidebarCollapsed,
  setIsSidebarOpen,
  setIsSidebarCollapsed,
  toggleTheme,
  isDarkTheme,
  setOpenNotifications,
  openNotifications,
  unreadCount,
  notifications,
  adminService,
  setNotifications,
  setUnreadCount,
  navigate,
  openUserMenu,
  setOpenUserMenu,
  avatarUrl,
  userName,
  userRegNo,
  initials,
  wishlist,
  handleLogout,
}: TopbarProps) {
  const handleThemeHover = (event: MouseEvent<HTMLButtonElement>, entering: boolean) => {
    event.currentTarget.style.color = entering
      ? 'hsl(var(--on-surface))'
      : 'hsl(var(--on-surface-muted))'
    event.currentTarget.style.background = entering ? 'hsl(var(--container-low))' : 'none'
  }

  const handleMenuHover = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    entering: boolean
  ) => {
    event.currentTarget.style.background = entering ? 'hsl(var(--container-low))' : 'none'
  }

  const handleNotificationsClick = () => {
    setOpenNotifications((value) => !value)
    setOpenUserMenu(false)

    if (!openNotifications && unreadCount > 0) {
      const unread = notifications.filter((notification) => !notification.is_read)
      unread.forEach((notification) => {
        void adminService.markNotificationRead(notification.id).catch(() => {})
      })
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, is_read: true }))
      )
      setUnreadCount(0)
    }
  }

  return (
    <div
      className={`fixed left-0 right-0 z-40 bg-white border-b border-border shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-60'}`}
      style={{ top: isAdmin ? 36 : 0 }}
    >
      <div className="flex items-center justify-between px-6 md:px-10 h-20">
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
            aria-label="Toggle dashboard sidebar"
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>

          <h1 className="hidden md:block text-[20px] md:text-[24px] font-medium tracking-tight text-on-surface m-0 font-meta">
            {getPageTitle()}
          </h1>
        </div>

        <div
          className="dashboard-header-actions"
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
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
              name="siteSearch"
              aria-label="Search the movement..."
              type="text"
              placeholder="Search the movement..."
              style={{
                width: 240,
                height: 36,
                paddingLeft: 34,
                paddingRight: 14,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <Link
            to="/dashboard/donate"
            className="hidden md:flex donate-button dashboard-header-donate"
            aria-label="Donate"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 14px',
              height: 36,
              background: 'hsl(var(--accent))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              textDecoration: 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              volunteer_activism
            </span>
            <span className="dashboard-header-donate-label">Donate GHS</span>
          </Link>

          <button
            className="dashboard-header-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(event) => handleThemeHover(event, true)}
            onMouseLeave={(event) => handleThemeHover(event, false)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isDarkTheme ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={handleNotificationsClick}
              aria-label={
                unreadCount > 0 ? `Notifications - ${unreadCount} unread` : 'Notifications'
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
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'hsl(var(--on-surface-muted))',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
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
                    borderRadius: 'var(--radius-pill)',
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
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
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
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          style={{
                            display: 'flex',
                            gap: 10,
                            padding: '11px 14px',
                            borderBottom: '1px solid hsl(var(--border))',
                            background: notification.is_read
                              ? 'hsl(var(--card))'
                              : 'hsl(var(--container-low))',
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 16,
                              marginTop: 1,
                              flexShrink: 0,
                              color:
                                notification.type === 'Alert'
                                  ? 'hsl(var(--destructive))'
                                  : notification.type === 'Action'
                                    ? 'hsl(var(--accent))'
                                    : 'hsl(var(--primary))',
                            }}
                          >
                            {notification.type === 'Alert'
                              ? 'warning'
                              : notification.type === 'Action'
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
                              {notification.title}
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
                              {notification.message}
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
                              {new Date(notification.created_at).toLocaleDateString('en-GB', {
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
                  <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '8px 14px' }}>
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

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenUserMenu((value) => !value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px 4px 4px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
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
                {userName.toLowerCase()}
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
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    minWidth: 210,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'hsl(var(--container-low))',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Public Sans',sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                        textTransform: 'capitalize',
                        marginBottom: 2,
                      }}
                    >
                      {userName.toLowerCase()}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans',sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      ID: {userRegNo?.slice(0, 10) || 'Unverified'}
                    </div>
                  </div>
                  {userMenuItems.map((item) => (
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
                      onMouseEnter={(event) => handleMenuHover(event, true)}
                      onMouseLeave={(event) => handleMenuHover(event, false)}
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
                    onMouseEnter={(event) => handleMenuHover(event, true)}
                    onMouseLeave={(event) => handleMenuHover(event, false)}
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
  )
}
