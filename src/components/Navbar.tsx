import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { useIsClient } from '@/hooks/useIsClient'

const NAV_LINKS = [
  { label: 'Home',       publicPath: '/',            dashPath: '/dashboard' },
  { label: 'Updates',    publicPath: '/blog',         dashPath: '/dashboard/blog' },
  { label: 'Polls',      publicPath: '/polls',        dashPath: '/dashboard/polls' },
  { label: 'The Plan',   publicPath: '/our-agenda',   dashPath: '/dashboard/agenda' },
  { label: 'Chapters',   publicPath: '/chapters',     dashPath: '/dashboard/chapters' },
  { label: 'Supplies',   publicPath: '/store',        dashPath: '/dashboard/store' },
  { label: 'Donate',     publicPath: '/donate',       dashPath: '/dashboard/donate' },
  { label: 'Contact',    publicPath: '/contact',      dashPath: '/dashboard/contact' },
]

export default function Navbar() {
  const { settings } = useBranding()
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isClient = useIsClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userAvatar, setUserAvatar] = useState('')
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isClient) return
    const handle = requestAnimationFrame(() => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true')
      const avatar = localStorage.getItem('userAvatar')
      if (avatar) setUserAvatar(avatar)
    })
    return () => cancelAnimationFrame(handle)
  }, [isClient])

  useEffect(() => {
    setIsOpen(false)
    setIsDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true')
      setUserAvatar(localStorage.getItem('userAvatar') || '')
    }
    window.addEventListener('storage', checkLogin)
    return () => window.removeEventListener('storage', checkLogin)
  }, [])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userAvatar')
    setIsLoggedIn(false)
    setIsDropdownOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const linkPath = (link: typeof NAV_LINKS[number]) =>
    isLoggedIn ? link.dashPath : link.publicPath

  const linkActive = (link: typeof NAV_LINKS[number]) =>
    isActive(isLoggedIn ? link.dashPath : link.publicPath)

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid hsl(var(--border))', position: 'sticky', top: 0, zIndex: 50 }}>
      <nav
        aria-label="Main Navigation"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1440, margin: '0 auto', padding: '0 32px', height: 72 }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <img alt="The Base Logo" style={{ height: 38, width: 38, objectFit: 'contain' }} src={settings.logo_url} decoding="async" />
          <Link to="/" style={{ textDecoration: 'none', color: 'hsl(var(--on-surface))' }}>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: '-.02em', lineHeight: 1 }}>
              The Base
            </span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="desktop-only">
          {NAV_LINKS.map(link => (
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
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!linkActive(link)) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--primary))' }}
              onMouseLeave={e => { if (!linkActive(link)) (e.currentTarget as HTMLElement).style.color = 'hsl(var(--on-surface-muted))' }}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to="/dashboard"
              style={{
                fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12,
                textDecoration: 'none',
                color: isActive('/dashboard') ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 60%)',
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop auth / user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-only">
          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid hsl(var(--primary))', objectFit: 'cover' }}
                    decoding="async"
                  />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'hsl(var(--primary))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 220,
                  background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden', zIndex: 50,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Member portal</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--accent))', marginTop: 2 }}>Active patriot</div>
                  </div>
                  {[
                    { to: '/dashboard',        icon: 'dashboard', label: 'Dashboard' },
                    { to: '/dashboard/settings', icon: 'settings',  label: 'Settings' },
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', color: 'hsl(var(--destructive))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', textDecoration: 'none', padding: '8px 16px', border: '1px solid hsl(var(--border))', borderRadius: 4 }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = 'hsl(var(--primary))'); (e.currentTarget.style.color = 'hsl(var(--primary))') }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = 'hsl(var(--border))'); (e.currentTarget.style.color = 'hsl(var(--on-surface))') }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: '#fff', textDecoration: 'none', padding: '8px 16px', background: 'hsl(var(--accent))', borderRadius: 4, border: 'none' }}
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--on-surface-muted))', padding: 6, display: 'flex', alignItems: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{isOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="mobile-only" style={{ background: '#fff', borderTop: '1px solid hsl(var(--border))', padding: '16px 20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_LINKS.map(link => (
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

          <div style={{ borderTop: '1px solid hsl(var(--border))', marginTop: 16, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'hsl(var(--primary) / 8%)', color: 'hsl(var(--primary))', borderRadius: 4, textDecoration: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>
                  Dashboard
                </Link>
                <Link to="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', color: 'hsl(var(--on-surface-muted))', borderRadius: 4, textDecoration: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
                  Settings
                </Link>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', color: 'hsl(var(--destructive))', borderRadius: 4, textAlign: 'left', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ display: 'block', padding: '11px 14px', border: '1px solid hsl(var(--border))', borderRadius: 4, textAlign: 'center', textDecoration: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                  Login
                </Link>
                <Link to="/register" style={{ display: 'block', padding: '11px 14px', background: 'hsl(var(--accent))', borderRadius: 4, textAlign: 'center', textDecoration: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: '#fff' }}>
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
