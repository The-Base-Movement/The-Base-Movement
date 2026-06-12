import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { sessionStore } from '@/lib/sessionStore'
import { Button } from '@/components/buttons/ui/neon-button'

const NAV_LINKS = [
  { label: 'Home', publicPath: '/', dashPath: '/dashboard' },
  { label: 'About', publicPath: '/about', dashPath: '/dashboard/about' },
  { label: 'Updates', publicPath: '/blog', dashPath: '/dashboard/blog' },
  { label: 'Polls', publicPath: '/polls', dashPath: '/dashboard/polls' },
  { label: 'The Plan', publicPath: '/our-agenda', dashPath: '/dashboard/agenda' },
  { label: 'Leadership', publicPath: '/officers', dashPath: '/dashboard/leadership' },
  { label: 'Constituencies', publicPath: '/constituencies', dashPath: '/dashboard/constituencies' },
  { label: 'Chapters', publicPath: '/chapters', dashPath: '/dashboard/chapters' },
  { label: 'Jobs', publicPath: '/jobs', dashPath: '/dashboard/jobs' },
  { label: 'Store', publicPath: '/store', dashPath: '/dashboard/store' },
  { label: 'Donate', publicPath: '/donate', dashPath: '/dashboard/donate' },
  { label: 'Contact', publicPath: '/contact', dashPath: '/dashboard/contact' },
]

const PRIMARY_NAV_LABELS = new Set(['Home', 'About', 'Updates', 'Donate', 'Contact'])
const PRIMARY_NAV_LINKS = NAV_LINKS.filter((link) => PRIMARY_NAV_LABELS.has(link.label))
const MORE_NAV_LINKS = NAV_LINKS.filter((link) => !PRIMARY_NAV_LABELS.has(link.label))

export default function Navbar() {
  const { settings } = useBranding()
  const { session } = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = !!session
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const [userAvatar, setUserAvatar] = useState('')
  const [userName, setUserName] = useState('')
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const shouldUseDark = storedTheme === 'dark'
    if (shouldUseDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkTheme(shouldUseDark)
  }, [])

  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(meta?.full_name || sessionStore.getItem('userName') || 'Member')

      setUserAvatar(meta?.avatar_url || sessionStore.getItem('userAvatar') || '')
    } else {
      setUserName('')

      setUserAvatar('')
    }
  }, [session])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false)

    setIsDropdownOpen(false)
    setIsMoreMenuOpen(false)
    setIsMobileMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false)
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node))
        setIsMoreMenuOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false)
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    sessionStore.clearAll()
    setIsDropdownOpen(false)
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const linkPath = (link: (typeof NAV_LINKS)[number]) =>
    isLoggedIn ? link.dashPath : link.publicPath

  const linkActive = (link: (typeof NAV_LINKS)[number]) =>
    isActive(isLoggedIn ? link.dashPath : link.publicPath)

  const moreMenuActive = MORE_NAV_LINKS.some((link) => linkActive(link))

  const toggleTheme = () => {
    const nextIsDark = !isDarkTheme
    if (nextIsDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
    setIsDarkTheme(nextIsDark)
    window.dispatchEvent(new Event('admin_theme_changed'))
  }

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 36,
        height: 36,
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--on-surface-muted))',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {isDarkTheme ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )

  return (
    <header
      style={{
        background: 'hsl(var(--background))',
        borderBottom: '1px solid hsl(var(--border))',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        aria-label="Main Navigation"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 32px',
          height: 72,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <img
            alt="The Base Logo"
            style={{ height: 38, width: 38, objectFit: 'contain' }}
            src={settings.logo_url}
            decoding="async"
          />
          <Link to="/" style={{ textDecoration: 'none', color: 'hsl(var(--on-surface))' }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 18,
                letterSpacing: '-.02em',
                lineHeight: 1,
              }}
            >
              The Base
            </span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="desktop-only">
          {PRIMARY_NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={linkPath(link)}
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                letterSpacing: '.01em',
                textDecoration: 'none',
                color: linkActive(link) ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                borderBottom: linkActive(link)
                  ? '2px solid hsl(var(--primary))'
                  : '2px solid transparent',
                paddingBottom: 2,
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!linkActive(link)) {
                  ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))'
                  ;(e.currentTarget as HTMLElement).style.borderBottomColor =
                    'hsl(var(--primary) / 40%)'
                }
              }}
              onMouseLeave={(e) => {
                if (!linkActive(link)) {
                  ;(e.currentTarget as HTMLElement).style.color = 'hsl(var(--on-surface-muted))'
                  ;(e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'
                }
              }}
            >
              {link.label}
            </Link>
          ))}
          <div
            ref={moreMenuRef}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMoreMenuOpen}
              onClick={() => setIsMoreMenuOpen((value) => !value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                border: 'none',
                borderBottom: moreMenuActive
                  ? '2px solid hsl(var(--primary))'
                  : '2px solid transparent',
                padding: '0 0 2px',
                background: 'none',
                color: moreMenuActive ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                letterSpacing: '.01em',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!moreMenuActive) {
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                  e.currentTarget.style.borderBottomColor = 'hsl(var(--primary) / 40%)'
                }
              }}
              onMouseLeave={(e) => {
                if (!moreMenuActive) {
                  e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
                  e.currentTarget.style.borderBottomColor = 'transparent'
                }
              }}
            >
              More
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                expand_more
              </span>
            </button>

            {isMoreMenuOpen && (
              <div
                role="menu"
                aria-label="More navigation links"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 220,
                  padding: 6,
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  zIndex: 60,
                }}
              >
                {MORE_NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={linkPath(link)}
                    role="menuitem"
                    onClick={() => setIsMoreMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: linkActive(link) ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                      background: linkActive(link) ? 'hsl(var(--primary) / 8%)' : 'transparent',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                    }}
                    onMouseEnter={(e) => {
                      if (!linkActive(link)) e.currentTarget.style.background = 'hsl(var(--card))'
                    }}
                    onMouseLeave={(e) => {
                      if (!linkActive(link)) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {link.label}
                    {linkActive(link) && (
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        check
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop auth / user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-only">
          {themeToggle}
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      border: '2px solid hsl(var(--primary))',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    decoding="async"
                  />
                ) : (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'hsl(var(--primary))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      person
                    </span>
                  </div>
                )}
                {userName && (
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {userName.split(' ')[0]}
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: 220,
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {userName || 'Member'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 10.5,
                        color: 'hsl(var(--accent))',
                        marginTop: 2,
                      }}
                    >
                      Active member
                    </div>
                  </div>
                  {[
                    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
                    { to: '/dashboard/settings', icon: 'settings', label: 'Settings' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        textDecoration: 'none',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 12,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--card))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                      >
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
                      gap: 10,
                      padding: '10px 14px',
                      border: 'none',
                      background: 'none',
                      color: 'hsl(var(--destructive))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--card))')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      logout
                    </span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="accent" size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-only"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div
          className="mobile-only"
          style={{
            background: 'hsl(var(--background))',
            borderTop: '1px solid hsl(var(--border))',
            padding: '16px 20px 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PRIMARY_NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={linkPath(link)}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  background: linkActive(link) ? 'hsl(var(--primary) / 8%)' : 'none',
                  color: linkActive(link) ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {link.label}
              </Link>
            ))}

            <button
              onClick={() => setIsMobileMoreOpen((value) => !value)}
              aria-expanded={isMobileMoreOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: moreMenuActive ? 'hsl(var(--primary) / 8%)' : 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: moreMenuActive ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                textAlign: 'left',
              }}
            >
              More
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 18,
                  transition: 'transform 0.2s ease',
                  transform: isMobileMoreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                expand_more
              </span>
            </button>

            {isMobileMoreOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  paddingLeft: 12,
                  borderLeft: '2px solid hsl(var(--border))',
                  marginLeft: 14,
                }}
              >
                {MORE_NAV_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    to={linkPath(link)}
                    style={{
                      display: 'block',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      background: linkActive(link) ? 'hsl(var(--primary) / 8%)' : 'none',
                      color: linkActive(link)
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid hsl(var(--border))',
              marginTop: 16,
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--card))',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Theme
              </span>
              {themeToggle}
            </div>
            {isLoggedIn ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'hsl(var(--card))',
                  }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '2px solid hsl(var(--primary))',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      decoding="async"
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'hsl(var(--primary))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        person
                      </span>
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {userName || 'Member'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: 11,
                        color: 'hsl(var(--accent))',
                      }}
                    >
                      Active member
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: isActive('/dashboard') ? 'hsl(var(--primary) / 8%)' : 'none',
                    color: 'hsl(var(--primary))',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    dashboard
                  </span>
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/settings"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    color: 'hsl(var(--on-surface-muted))',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    settings
                  </span>
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: 'none',
                    background: 'none',
                    color: 'hsl(var(--destructive))',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    logout
                  </span>
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Button asChild variant="outline" size="default" style={{ flex: 1 }}>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="accent" size="default" style={{ flex: 1 }}>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
