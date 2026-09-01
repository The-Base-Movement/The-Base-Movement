import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBranding } from '@/hooks/useBranding'
import { YW_ACCENT } from './theme'

/**
 * Navigation for the Youth Wing surface.
 *
 * Same design language as the adult Navbar (sticky bar, 72px, Public Sans,
 * design-system tokens) but a different bar: teal instead of brand green, only
 * Youth Wing destinations, and no Donate or member Login. A 15-year-old must
 * never be one click from an adult party-membership call to action, and the
 * adult nav's Diaspora / Constituencies / Leadership links do not apply to them.
 *
 * The one adult link kept is a quiet "Main site" exit at the end.
 */

const YOUTH_LINKS = [
  { label: 'Youth Wing', to: '/youth-wing' },
  { label: 'Articles', to: '/youth-wing/articles' },
  { label: 'Paper form', to: '/youth-wing/form' },
  { label: 'My portal', to: '/youth-wing/portal' },
]

export function YouthNavbar() {
  const { settings } = useBranding()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (to: string) =>
    to === '/youth-wing' ? pathname === '/youth-wing' : pathname.startsWith(to)

  // The colour lives in .yw-navlink / .yw-navlink.is-active (src/index.css).
  // Set inline it would beat the :hover rule, which is why these never lit up.
  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 12,
    letterSpacing: '.01em',
    textDecoration: 'none',
    borderBottom: active ? `2px solid ${YW_ACCENT}` : '2px solid transparent',
    paddingBottom: 2,
    transition: 'color 0.15s, border-color 0.15s',
  })

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
      <div style={{ height: 3, background: YW_ACCENT }} aria-hidden="true" />
      <nav
        aria-label="Youth Wing Navigation"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 20px',
          height: 72,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <img
            alt="The Base Logo"
            style={{ height: 38, width: 38, objectFit: 'contain' }}
            src={settings.logo_url}
            decoding="async"
          />
          <Link to="/youth-wing" style={{ textDecoration: 'none' }}>
            <span
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 18,
                letterSpacing: '-.02em',
                lineHeight: 1,
                color: 'hsl(var(--on-surface))',
              }}
            >
              The Base
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                marginTop: 3,
                color: YW_ACCENT,
              }}
            >
              Youth Wing
            </span>
          </Link>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 24 }}
          className="nav-desktop-only"
        >
          {YOUTH_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`yw-navlink${isActive(link.to) ? ' is-active' : ''}`}
              style={linkStyle(isActive(link.to))}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/youth-wing/register"
            className="btn btn-sm btn-yw"
            style={{ textDecoration: 'none' }}
          >
            Join
          </Link>
          <Link
            to="/"
            className="yw-link"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              textDecoration: 'none',
            }}
          >
            Main site &rarr;
          </Link>
        </div>

        <button
          type="button"
          className="nav-mobile-only"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((v) => !v)}
          // No inline display: the .nav-mobile-only / .nav-desktop-only media
          // queries own visibility, and an inline `display: none` would beat the
          // sub-1024px rule and hide the hamburger on the very widths it serves.
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface))',
          }}
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {isOpen && (
        <div
          className="nav-mobile-only"
          style={{
            borderTop: '1px solid hsl(var(--border))',
            padding: '14px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {YOUTH_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`yw-navlink${isActive(link.to) ? ' is-active' : ''}`}
              style={{ ...linkStyle(isActive(link.to)), fontSize: 14, borderBottom: 'none' }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/youth-wing/register"
            onClick={() => setIsOpen(false)}
            className="btn btn-sm btn-yw"
            style={{ textDecoration: 'none', justifyContent: 'center' }}
          >
            Join the Youth Wing
          </Link>
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="yw-link"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            Main site &rarr;
          </Link>
        </div>
      )}
    </header>
  )
}
