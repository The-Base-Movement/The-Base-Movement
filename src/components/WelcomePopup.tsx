/**
 * WelcomePopup — one-time announcement modal shown to logged-out visitors on
 * the homepage. Toggled and edited from Settings ("Homepage Popup" tab),
 * which writes `welcome_popup_enabled` / `welcome_popup_message` /
 * `welcome_popup_version` site settings (same mechanism as maintenance mode).
 *
 * "Strategic" open/close: opens after a short delay (avoids fighting the hero
 * animation on paint), and is remembered as dismissed per popup version in
 * localStorage so a returning visitor isn't nagged again until the message
 * changes and IT bumps the version.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBranding } from '@/hooks/useBranding'

const OPEN_DELAY_MS = 1400
const DISMISS_KEY = 'welcome_popup_dismissed_version'

export function WelcomePopup() {
  const { user, isLoading } = useAuth()
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const enabled = settings.welcome_popup_enabled === true
  const version = String(settings.welcome_popup_version ?? 1)
  const message =
    typeof settings.welcome_popup_message === 'string' ? settings.welcome_popup_message : ''

  useEffect(() => {
    if (isLoading || user || !enabled) return
    if (localStorage.getItem(DISMISS_KEY) === version) return

    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isLoading, user, enabled, version])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    localStorage.setItem(DISMISS_KEY, version)
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
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          border: '1px solid hsl(var(--border))',
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
            bottom: '-8%',
            width: 220,
            height: 'auto',
            opacity: 0.06,
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

        <div style={{ position: 'relative', zIndex: 1 }}>
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
            }}
          >
            {message}
          </p>

          <div
            className="welcome-popup-actions"
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => goTo('/login')}
              style={{ flex: 1, minWidth: 140 }}
            >
              Log In Now
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => goTo('/register')}
              style={{ flex: 1, minWidth: 140 }}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => goTo('/faq#new-site')}
            style={{ width: '100%' }}
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
