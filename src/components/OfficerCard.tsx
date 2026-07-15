/**
 * OfficerCard Component
 * -------------------------------------------------------------
 * Renders a "lanyard-style" profile card for a single movement officer.
 * The card hangs from a dashed lanyard string with a coloured ring whose hue
 * is derived from `tierIndex` (0 = executive red, 1 = gold, 2+ = primary green).
 *
 * Features:
 * - Responsive: full-width on mobile, fixed `cardWidth` on desktop
 * - Top-tier cards are taller (longer lanyard) and wider (340 px vs 300 px)
 * - Hover lift animation via `isHovered` state
 * - Bio text is only shown for executive-tier officers
 * - Social icon links (Facebook, Instagram, LinkedIn, X/Twitter, Email) open in
 *   a new tab without propagating the click to the card's `onClick` handler
 *
 * Used inside `OfficerCardSlider`.
 */

import { useState, useEffect } from 'react'
import { XIcon, LinkedInIcon, FacebookIcon, InstagramIcon } from '@/components/icons/SocialIcons'
import { fallbackAvatar } from '@/lib/avatar'

export type OfficerTier = string

export interface OfficerProfile {
  id: string
  name: string
  role: string
  region?: string
  bio?: string
  avatarUrl?: string
  tier: OfficerTier
  order_index?: number
  socials?: {
    twitter?: string
    linkedin?: string
    facebook?: string
    instagram?: string
    email?: string
  }
}

function getFirstSentence(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()

  // Find all sentence-ending punctuation marks followed by space or end of string
  const matches = clean.matchAll(/[.!?](?:\s|$)/g)
  for (const match of matches) {
    const index = match.index
    if (index !== undefined) {
      const preceding = clean.slice(0, index).toLowerCase()
      // Check if the period is likely part of an abbreviation
      const isAbbreviation =
        preceding.endsWith('dr') ||
        preceding.endsWith('mr') ||
        preceding.endsWith('mrs') ||
        preceding.endsWith('ms') ||
        preceding.endsWith('prof')
      if (!isAbbreviation) {
        return clean.slice(0, index + 1)
      }
    }
  }
  return clean
}

export interface OfficerCardProps {
  officer: OfficerProfile
  onClick?: (officer: OfficerProfile) => void
  /** 0-based position of this tier in the sorted tier list — drives color and card width */
  tierIndex?: number
}

export function OfficerCard({ officer, onClick, tierIndex = 2 }: OfficerCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Color cycles by tier position: top tier = red, second = gold, rest = green
  const tierColor =
    tierIndex === 0
      ? 'hsl(var(--destructive))'
      : tierIndex === 1
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'

  // Top tier gets a taller lanyard and wider card
  const lanyardHeight = tierIndex === 0 ? 80 : tierIndex === 1 ? 100 : 60
  const desktopHeight = tierIndex === 0 ? 255 : 215
  const mobileHeight = tierIndex === 0 ? 215 : 180
  const cardHeight = isMobile ? mobileHeight : desktopHeight
  const cardWidth = tierIndex === 0 ? 460 : 400

  return (
    <div
      style={{
        position: 'relative',
        width: isMobile ? '100%' : cardWidth,
        maxWidth: isMobile ? undefined : cardWidth,
        height: isMobile ? 'auto' : '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: lanyardHeight,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isHovered ? 'translateY(-8px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick && onClick(officer)}
    >
      {/* Lanyard String */}
      <div
        style={{
          position: 'absolute',
          top: -lanyardHeight,
          left: '50%',
          transform: 'translateX(-50%)',
          height: lanyardHeight,
          width: 0,
          borderLeft: '2px dashed hsl(var(--on-surface-muted))',
          opacity: 0.5,
        }}
      />

      {/* The Colored Ring */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `5px solid ${tierColor}`,
          background: 'hsl(var(--card))',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        }}
      />

      {/* Card Body with Drop Shadow filter and Masked Top Hole */}
      <div
        style={{
          filter: 'drop-shadow(0px 12px 24px rgba(0,0,0,0.08))',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'hsl(var(--card))',
            borderRadius: 16,
            WebkitMaskImage: 'radial-gradient(circle at 50% 0px, transparent 18px, black 19px)',
            maskImage: 'radial-gradient(circle at 50% 0px, transparent 18px, black 19px)',
            width: '100%',
            height: isMobile ? 'auto' : cardHeight,
            display: isMobile ? 'column' : 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'stretch',
          }}
        >
          {/* Left/Top: Full Image */}
          <div
            style={{
              width: isMobile ? '100%' : 150,
              height: isMobile ? 220 : '100%',
              flexShrink: 0,
              overflow: 'hidden',
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: isMobile ? 0 : 16,
              borderTopRightRadius: isMobile ? 16 : 0,
              borderBottomRightRadius: 0,
              background: 'hsl(var(--container-low))',
            }}
          >
            <img
              src={officer.avatarUrl || fallbackAvatar(officer.name)}
              alt={officer.name}
              // Anchor to the top so portrait headshots keep the head/face in
              // frame — center-cropping the short mobile window cut off the head.
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: '60% top',
              }}
            />
          </div>

          {/* Right/Bottom: Card Body */}
          <div
            style={{
              flex: 1,
              padding: isMobile ? '24px 20px 24px 20px' : '44px 20px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              textAlign: 'left',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Name */}
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: officer.tier === 'executive' ? 18 : 16,
                  color: 'hsl(var(--on-surface))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {officer.name}
              </h3>

              {/* Role and Region */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {officer.role}
                </span>
                {officer.region && (
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10,
                      color: tierColor,
                      background: `color-mix(in srgb, ${tierColor} 10%, transparent)`,
                      padding: '1px 6px',
                      borderRadius: 99,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {officer.region}
                  </span>
                )}
              </div>

              {/* Color Separator Dash */}
              <div
                style={{
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  background: tierColor,
                  margin: '10px 0',
                }}
              />

              {/* Bio */}
              {officer.bio && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: isMobile ? 2 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getFirstSentence(officer.bio)}
                </p>
              )}
            </div>

            {/* Social Icons at Bottom */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-start',
                width: '100%',
                marginTop: 8,
              }}
            >
              {officer.socials?.facebook && (
                <a
                  href={officer.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    opacity: 0.4,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <FacebookIcon size={14} />
                </a>
              )}
              {officer.socials?.instagram && (
                <a
                  href={officer.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    opacity: 0.4,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <InstagramIcon size={14} />
                </a>
              )}
              {officer.socials?.linkedin && (
                <a
                  href={officer.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    opacity: 0.4,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <LinkedInIcon size={14} />
                </a>
              )}
              {officer.socials?.twitter && (
                <a
                  href={officer.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    opacity: 0.4,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <XIcon size={14} />
                </a>
              )}
              {officer.socials?.email && (
                <a
                  href={`mailto:${officer.socials.email}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: 'hsl(var(--on-surface))',
                    opacity: 0.4,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    mail
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
