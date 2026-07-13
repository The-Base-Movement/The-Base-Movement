import { createPortal } from 'react-dom'
import type { PartyOfficial, PartyTier } from './utils'
import { fallbackAvatar } from '@/lib/avatar'

interface ViewModalProps {
  official: PartyOfficial
  tiers: PartyTier[]
  onClose: () => void
  onEdit: (official: PartyOfficial) => void
}

function SocialLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        fontWeight: 'var(--font-weight-medium, 500)',
        color: 'hsl(var(--on-surface))',
        textDecoration: 'none',
        background: 'hsl(var(--container-low))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {icon}
      </span>
      {label}
    </a>
  )
}

export function ViewModal({ official, tiers, onClose, onEdit }: ViewModalProps) {
  const tierTitle = tiers.find((t) => t.name === official.tier)?.title || official.tier

  const socialLinks = [
    { href: official.facebook_url, icon: 'share', label: 'Facebook' },
    { href: official.instagram_url, icon: 'photo_camera', label: 'Instagram' },
    { href: official.twitter_url, icon: 'alternate_email', label: 'Twitter / X' },
    { href: official.linkedin_url, icon: 'work', label: 'LinkedIn' },
  ].filter((s) => !!s.href)

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        overflowY: 'auto',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 480,
          margin: 'auto',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--container-low))',
          }}
        >
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Official Profile
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar + name/role/tier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'hsl(var(--container-low))',
                border: '2px solid hsl(var(--border))',
              }}
            >
              <img
                src={official.avatar_url || fallbackAvatar(official.name)}
                alt={official.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <p
                style={{
                  margin: '0 0 4px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 17,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {official.name}
              </p>
              <p
                style={{
                  margin: '0 0 8px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {official.role}
                {official.region ? ` · ${official.region}` : ''}
              </p>
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--primary))',
                  background: 'hsla(var(--primary), 0.08)',
                  border: '1px solid hsla(var(--primary), 0.2)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '2px 7px',
                }}
              >
                {tierTitle}
              </span>
            </div>
          </div>

          {/* Bio */}
          {official.bio && (
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Biography
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.6,
                }}
              >
                {official.bio}
              </p>
            </div>
          )}

          {/* Contact */}
          {official.email && (
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Contact
              </p>
              <a
                href={`mailto:${official.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'hsl(var(--primary))',
                  fontFamily: "'Public Sans', sans-serif",
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  mail
                </span>
                {official.email}
              </a>
            </div>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Social
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {socialLinks.map((s) => (
                  <SocialLink key={s.label} href={s.href!} icon={s.icon} label={s.label} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            style={{ flex: 1, height: 38 }}
          >
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose()
              onEdit(official)
            }}
            style={{ flex: 1, height: 38 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              edit
            </span>
            Edit
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
