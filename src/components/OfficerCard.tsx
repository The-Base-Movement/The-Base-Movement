import { useState, useEffect } from 'react'
import { XIcon, LinkedInIcon, FacebookIcon, InstagramIcon } from '@/components/icons/SocialIcons'

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
  const cardWidth = tierIndex === 0 ? 340 : 300

  return (
    <div
      style={{
        position: 'relative',
        width: isMobile ? '100%' : cardWidth,
        maxWidth: isMobile ? undefined : cardWidth,
        height: '100%',
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
          background: '#fff',
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
            background: '#fff',
            borderRadius: 16,
            padding: '48px 24px 24px',
            WebkitMaskImage: 'radial-gradient(circle at 50% 0px, transparent 18px, black 19px)',
            maskImage: 'radial-gradient(circle at 50% 0px, transparent 18px, black 19px)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Photo */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'hsl(var(--container-low))',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <img
              src={officer.avatarUrl || '/officer-placeholder.png'}
              alt={officer.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Name */}
          <h3
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: officer.tier === 'executive' ? 20 : 18,
              color: 'hsl(var(--on-surface))',
            }}
          >
            {officer.name}
          </h3>

          {/* Color Separator Dash */}
          <div
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              background: tierColor,
              margin: '12px auto',
            }}
          />

          {/* Role and Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {officer.role}
            </span>
            {officer.region && (
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: tierColor,
                  background: `color-mix(in srgb, ${tierColor} 10%, transparent)`,
                  padding: '2px 8px',
                  borderRadius: 99,
                  alignSelf: 'center',
                }}
              >
                {officer.region}
              </span>
            )}
            {officer.bio && officer.tier === 'executive' && (
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.5,
                }}
              >
                {officer.bio}
              </p>
            )}
          </div>

          {/* Social Icons at Bottom */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', width: '100%' }}>
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
                <FacebookIcon size={16} />
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
                <InstagramIcon size={16} />
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
                <LinkedInIcon size={16} />
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
                <XIcon size={16} />
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
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  mail
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
