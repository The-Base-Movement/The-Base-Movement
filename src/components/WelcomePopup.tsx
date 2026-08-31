/**
 * WelcomePopup — announcement modal shown to logged-out visitors on the
 * homepage. Toggled and edited from Settings ("Homepage Popup" tab), which
 * writes `welcome_popup_enabled` / `welcome_popup_message` /
 * `welcome_popup_start_at` / `welcome_popup_end_at` site settings (same
 * mechanism as maintenance mode). The master toggle and the scheduled
 * active/end window both have to allow it before it can show.
 *
 * "Strategic" open: triggers once the visitor has scrolled 20% down the
 * page (not on paint, so it never fights the hero animation) and reappears
 * on every fresh homepage visit, since the component's own mount/unmount is
 * the reset, no persisted dismissal.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBranding } from '@/hooks/useBranding'

const SCROLL_TRIGGER_PCT = 20
const DOMAIN_RE = /thebasemovement\.org\.gh/gi

function renderMessage(text: string) {
  const parts = text.split(DOMAIN_RE)
  const matches = text.match(DOMAIN_RE) || []
  const nodes: React.ReactNode[] = []
  parts.forEach((part, i) => {
    if (part) nodes.push(part)
    if (matches[i]) nodes.push(<strong key={i}>{matches[i]}</strong>)
  })
  return nodes
}

export function WelcomePopup() {
  const { user, isLoading } = useAuth()
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const message =
    typeof settings.welcome_popup_message === 'string' ? settings.welcome_popup_message : ''

  const startAt =
    typeof settings.welcome_popup_start_at === 'string' && settings.welcome_popup_start_at
      ? new Date(settings.welcome_popup_start_at).getTime()
      : null
  const endAt =
    typeof settings.welcome_popup_end_at === 'string' && settings.welcome_popup_end_at
      ? new Date(settings.welcome_popup_end_at).getTime()
      : null
  const now = Date.now()
  const withinWindow = (!startAt || now >= startAt) && (!endAt || now <= endAt)
  const enabled = settings.welcome_popup_enabled === true && withinWindow

  useEffect(() => {
    if (isLoading || user || !enabled) return

    function checkScroll() {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      if (scrollable <= 0) return
      const pct = (window.scrollY / scrollable) * 100
      if (pct >= SCROLL_TRIGGER_PCT) {
        setOpen(true)
        window.removeEventListener('scroll', checkScroll)
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll()
    return () => window.removeEventListener('scroll', checkScroll)
  }, [isLoading, user, enabled])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function close() {
    setOpen(false)
  }

  function goTo(path: string) {
    close()
    navigate(path)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <style>{`
        @keyframes welcomePopupIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .welcome-popup-card { animation: welcomePopupIn 0.25s ease-out; }
        @media (max-width: 480px) {
          .welcome-popup-card { padding: 24px 18px !important; }
          .welcome-popup-actions { flex-direction: column !important; }
          .welcome-popup-actions .btn { width: 100%; }
        }
      `}</style>
      <div
        className="welcome-popup-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 460,
          minHeight: 520,
          maxHeight: '95vh',
          overflowY: 'auto',
          padding: '36px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Eagle watermark */}
        <img
          src="/branding/patterns/eagle-in-flight.webp"
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-8%',
            bottom: '-6%',
            width: 180,
            height: 'auto',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: 0,
            userSelect: 'none',
          }}
        />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'hsl(var(--container-low))',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </button>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            className="pill pill-ok"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 14,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              campaign
            </span>
            Official Update
          </span>

          <h2
            id="welcome-popup-title"
            style={{
              margin: '0 0 12px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.01em',
            }}
          >
            Our official website is now live!
          </h2>

          <p
            style={{
              margin: '0 0 22px',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13.5,
              lineHeight: 1.7,
              color: 'hsl(var(--on-surface-muted))',
              whiteSpace: 'pre-line',
              flex: 1,
            }}
          >
            {renderMessage(message)}
          </p>

          <div
            className="welcome-popup-actions"
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goTo('/login')}
              style={{ flex: 1, minWidth: 140, minHeight: 44 }}
            >
              Log In Now
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => goTo('/register')}
              style={{ flex: 1, minWidth: 140, minHeight: 44 }}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => goTo('/faq#new-site')}
            style={{ width: '100%', minHeight: 40 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              help
            </span>
            Need help logging in? Visit the FAQ
          </button>
        </div>
      </div>
    </div>
  )
}
