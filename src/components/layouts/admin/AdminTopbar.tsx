import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { CountryBadge } from '@/components/CountryBadge'
import { getCountryFlag } from '@/lib/utils'
import type { GlobalSearchResult, AdminUser, Notification } from '@/types/admin'

interface AdminTopbarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  user: AdminUser | null
  avatarUrl: string | null
  unreadCount: number
  notifications: Notification[]
  isNotificationsOpen: boolean
  setIsNotificationsOpen: (open: boolean) => void
  handleMarkAsRead: (id: string) => Promise<void>
  handleMarkAllAsRead: () => Promise<void>
  isUserMenuOpen: boolean
  setIsUserMenuOpen: (open: boolean) => void
  handleLogout: () => void
  canSubmitTicket: boolean
  setSubmitTicketOpen: (open: boolean) => void
  windowWidth: number
}

export function AdminTopbar({
  isSidebarOpen,
  setIsSidebarOpen,
  user,
  avatarUrl,
  unreadCount,
  notifications,
  isNotificationsOpen,
  setIsNotificationsOpen,
  handleMarkAsRead,
  handleMarkAllAsRead,
  isUserMenuOpen,
  setIsUserMenuOpen,
  handleLogout,
  canSubmitTicket,
  setSubmitTicketOpen,
  windowWidth,
}: AdminTopbarProps) {
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Debounced global search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        setShowSearchResults(true)
        try {
          const results = await adminService.globalSearch(searchQuery)
          setSearchResults(results)
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <header
      style={{
        height: 80,
        background: '#fff',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        gap: 12,
      }}
    >
      {/* Left: hamburger + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="ico"
          style={{ width: 32, height: 32, flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            menu
          </span>
        </button>

        {/* Search — hidden on mobile */}
        <div
          className="desktop-only"
          style={{ position: 'relative', maxWidth: 380, width: '100%' }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            search
          </span>
          <input
            aria-label="Search command center…"
            id="admin-search"
            name="adminSearch"
            type="search"
            autoComplete="off"
            placeholder="Search command center…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 30,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              background: 'hsl(var(--container-low))',
              color: 'hsl(var(--on-surface))',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Search results */}
          {showSearchResults && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setShowSearchResults(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Global search
                  </span>
                  {isSearching && (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 14,
                        color: 'hsl(var(--primary))',
                        animation: 'spin 1s linear infinite',
                      }}
                    >
                      sync
                    </span>
                  )}
                </div>

                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        to={result.to}
                        onClick={() => {
                          setShowSearchResults(false)
                          setSearchQuery('')
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderBottom: '1px solid hsl(var(--border))',
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 4,
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
                          >
                            {result.type === 'Member'
                              ? 'person'
                              : result.type === 'Article'
                                ? 'article'
                                : result.type === 'Chapter'
                                  ? 'place'
                                  : result.type === 'Product'
                                    ? 'shopping_bag'
                                    : result.type === 'Broadcast'
                                      ? 'campaign'
                                      : 'edit'}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 12.5,
                              color: 'hsl(var(--on-surface))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 10.5,
                                color: 'hsl(var(--on-surface-muted))',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {result.subtitle.split(' · ').map((part, i, arr) => (
                                <span key={i} className="inline-flex items-center gap-1">
                                  <CountryBadge flag={getCountryFlag(part)} />
                                  {i < arr.length - 1 && (
                                    <span className="mx-1 text-white/20">·</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 9.5,
                            color: 'hsl(var(--on-surface-muted))',
                            padding: '2px 6px',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 3,
                            flexShrink: 0,
                          }}
                        >
                          {result.type}
                        </span>
                      </Link>
                    ))
                  ) : !isSearching ? (
                    <div
                      style={{
                        padding: '28px 16px',
                        textAlign: 'center',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      No records found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    background: 'hsl(var(--container-low))',
                    borderTop: '1px solid hsl(var(--border))',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Press{' '}
                    <kbd
                      style={{
                        padding: '1px 5px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 3,
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                      }}
                    >
                      ESC
                    </kbd>{' '}
                    to dismiss
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: notifications + divider + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* IT Support */}
        {canSubmitTicket && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSubmitTicketOpen(true)}
            style={{ gap: 6, padding: '0 10px', flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              support_agent
            </span>
            <span className="desktop-only">IT Support</span>
          </button>
        )}
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="ico"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ width: 32, height: 32, position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              notifications
            </span>
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  minWidth: 14,
                  height: 14,
                  padding: '0 3px',
                  background: 'hsl(var(--destructive))',
                  color: '#fff',
                  borderRadius: 99,
                  border: '1.5px solid #fff',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div
                className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0"
                style={{
                  top: windowWidth < 640 ? 80 : 'calc(100% + 12px)',
                  width: windowWidth < 640 ? 'auto' : 320,
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Alert center
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--primary))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    notifications.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => !note.is_read && handleMarkAsRead(note.id)}
                        style={{
                          padding: '14px 18px',
                          borderBottom: '1px solid hsl(var(--border))',
                          background: note.is_read ? 'transparent' : 'rgba(206, 17, 38, 0.03)',
                          cursor: note.is_read ? 'default' : 'pointer',
                          display: 'flex',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: note.is_read
                              ? 'hsl(var(--container-low))'
                              : 'hsl(var(--destructive))',
                            color: note.is_read ? 'hsl(var(--on-surface-muted))' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {note.type === 'Alert'
                              ? 'warning'
                              : note.type === 'Action'
                                ? 'rocket_launch'
                                : note.type === 'Info'
                                  ? 'psychology'
                                  : 'notifications'}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 11.5,
                              color: 'hsl(var(--on-surface))',
                              marginBottom: 2,
                            }}
                          >
                            {note.title}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 10.5,
                              color: 'hsl(var(--on-surface-muted))',
                              lineHeight: 1.4,
                              marginBottom: 6,
                            }}
                          >
                            {note.message}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 9,
                                color: 'hsl(var(--on-surface-muted))',
                                opacity: 0.6,
                              }}
                            >
                              {new Date(note.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {!note.is_read && (
                              <div
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: '50%',
                                  background: 'hsl(var(--destructive))',
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 32,
                          color: 'hsl(var(--on-surface-muted))',
                          opacity: 0.2,
                        }}
                      >
                        notifications_off
                      </span>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 12,
                        }}
                      >
                        No strategic alerts
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  to="/admin/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderTop: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--container-low))',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  View all intelligence
                </Link>
              </div>
            </>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'hsl(var(--border))', margin: '0 4px' }} />

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 8px',
              border: '1px solid transparent',
              borderRadius: 4,
              background: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {/* Name + role — hidden on mobile */}
            <div className="desktop-only" style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.3,
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.3,
                }}
              >
                {user?.role === 'FOUNDER'
                  ? 'Movement Founder'
                  : user?.role === 'ORGANIZER'
                    ? 'Strategic Organizer'
                    : user?.role === 'EXECUTIVE'
                      ? 'Executive'
                      : user?.role === 'SUPER_ADMIN'
                        ? 'System Admin'
                        : user?.role === 'ADMIN'
                          ? 'Administrator'
                          : user?.role === 'FINANCE_OFFICER'
                            ? 'Finance Officer'
                            : user?.role === 'REGIONAL_DIRECTOR'
                              ? 'Regional Director'
                              : user?.role === 'CONSTITUENCY_LEAD'
                                ? 'Constituency Lead'
                                : 'Staff Verifier'}
              </div>
            </div>
            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  decoding="async"
                />
              ) : (
                user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') || 'HQ'
              )}
            </div>
          </button>

          {/* Dropdown panel */}
          {isUserMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 220,
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 2,
                    }}
                  >
                    {user?.email}
                  </div>
                </div>
                {[
                  { to: '/admin/settings', icon: 'settings', label: 'Administrative settings' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsUserMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      textDecoration: 'none',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    color: 'hsl(var(--destructive))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    logout
                  </span>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
