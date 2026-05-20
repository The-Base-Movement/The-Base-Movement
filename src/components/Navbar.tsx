import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'

const NAV_LINKS = [
  { label: 'Home', publicPath: '/', dashPath: '/dashboard' },
  { label: 'Updates', publicPath: '/blog', dashPath: '/dashboard/blog' },
  { label: 'Polls', publicPath: '/polls', dashPath: '/dashboard/polls' },
  { label: 'The Plan', publicPath: '/our-agenda', dashPath: '/dashboard/agenda' },
  { label: 'Leadership', publicPath: '/officers', dashPath: '/officers' },
  { label: 'Chapters', publicPath: '/chapters', dashPath: '/dashboard/chapters' },
  { label: 'Supplies', publicPath: '/store', dashPath: '/dashboard/store' },
  { label: 'Donate', publicPath: '/donate', dashPath: '/dashboard/donate' },
  { label: 'Contact', publicPath: '/contact', dashPath: '/dashboard/contact' },
]

export default function Navbar() {
  const { settings } = useBranding()
  const { session } = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = !!session
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userAvatar, setUserAvatar] = useState('')
  const [userName, setUserName] = useState('')
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user) {
      const meta = session.user.user_metadata
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(meta?.full_name || localStorage.getItem('userName') || 'Member')

      setUserAvatar(meta?.avatar_url || localStorage.getItem('userAvatar') || '')
    } else {
      setUserName('')

      setUserAvatar('')
    }
  }, [session])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false)

    setIsDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userAvatar')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRegNo')
    localStorage.removeItem('userToken')
    localStorage.removeItem('userPlatform')
    setIsDropdownOpen(false)
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const linkPath = (link: (typeof NAV_LINKS)[number]) =>
    isLoggedIn ? link.dashPath : link.publicPath

  const linkActive = (link: (typeof NAV_LINKS)[number]) =>
    isActive(isLoggedIn ? link.dashPath : link.publicPath)

  return (
    <header
      style={{
        background: '#fff',
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
                fontWeight: 900,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-only">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={linkPath(link)}
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
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
        </div>

        {/* Desktop auth / user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-only">
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
                      fontWeight: 800,
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
                      fontWeight: 700,
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
                    background: '#fff',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
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
                        fontWeight: 800,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {userName || 'Member'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
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
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
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
                      fontWeight: 700,
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
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                  e.currentTarget.style.color = 'hsl(var(--primary))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))'
                  e.currentTarget.style.color = 'hsl(var(--on-surface))'
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  background: 'hsl(var(--accent))',
                  borderRadius: 4,
                  border: 'none',
                }}
              >
                Register
              </Link>
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
            background: '#fff',
            borderTop: '1px solid hsl(var(--border))',
            padding: '16px 20px 24px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={linkPath(link)}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  background: linkActive(link) ? 'hsl(var(--primary) / 8%)' : 'none',
                  color: linkActive(link) ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {link.label}
              </Link>
            ))}
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
            {isLoggedIn ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'hsl(var(--container-low))',
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
                        fontWeight: 800,
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {userName || 'Member'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
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
                    borderRadius: 4,
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
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
                    borderRadius: 4,
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
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
                    borderRadius: 4,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
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
              <>
                <Link
                  to="/login"
                  style={{
                    display: 'block',
                    padding: '11px 14px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    display: 'block',
                    padding: '11px 14px',
                    background: 'hsl(var(--accent))',
                    borderRadius: 4,
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#fff',
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
