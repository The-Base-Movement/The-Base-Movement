/**
 * ShareModal Component
 * -------------------------------------------------------------
 * Portal-based modal for sharing a URL via multiple channels.
 * Renders into `document.body` so it sits above all other content.
 *
 * Channels: WhatsApp, Facebook, X (Twitter), and Email.
 * `buildLink` constructs the platform-specific share URL with encoded title
 * and target URL.
 * `handleCopy` uses the Clipboard API and shows a 2-second "Copied!" state.
 *
 * Used from the member dashboard Share & Invite feature and the store
 * product detail page (`onShare` callback on `ProductCard`).
 *
 * The footer renders the three brand colours (red / gold / green) as a 5 px
 * stripe to reinforce movement branding.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'

function ShareIcon({ name }: { name: string }) {
  if (name === 'WhatsApp')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    )
  if (name === 'Facebook')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  if (name === 'X')
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
      mail
    </span>
  )
}

const SHARE_OPTIONS = [
  { name: 'WhatsApp', bg: '#25D366', text: '#fff' },
  { name: 'Facebook', bg: '#1877F2', text: '#fff' },
  { name: 'X', bg: '#000', text: '#fff' },
  { name: 'Email', bg: 'hsl(var(--primary))', text: '#fff' },
]

function buildLink(name: string, title: string, url: string) {
  if (name === 'WhatsApp') return `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  if (name === 'Facebook')
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  if (name === 'X')
    return `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  url?: string
}

export function ShareModal({
  isOpen,
  onClose,
  title = 'Share & Invite Others',
  url = 'https://thebasemovement.info/register',
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 15,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {title}
            </p>
            <p
              style={{
                margin: '3px 0 0',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Share your personal invite link
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 24px' }}>
          {/* Link box */}
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              wordBreak: 'break-all',
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            {url}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: copied ? '#2a7a4e' : 'hsl(var(--primary))',
              color: '#fff',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
              marginBottom: 20,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Or share directly
            </span>
            <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHARE_OPTIONS.map((option) => (
              <a
                key={option.name}
                href={buildLink(option.name, title, url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  background: 'hsl(var(--background))',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(var(--background))')}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 'var(--radius-sm)',
                    background: option.bg,
                    color: option.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShareIcon name={option.name} />
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Share on {option.name}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: 'hsl(var(--on-surface-muted))',
                    marginLeft: 'auto',
                  }}
                >
                  chevron_right
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Brand line footer */}
        <div style={{ display: 'flex', height: 5 }} aria-hidden="true">
          <div style={{ flex: 1, background: '#CE1126' }} />
          <div style={{ flex: 1, background: '#DAA520' }} />
          <div style={{ flex: 1, background: '#006B3F' }} />
        </div>
      </div>
    </div>,
    document.body
  )
}
