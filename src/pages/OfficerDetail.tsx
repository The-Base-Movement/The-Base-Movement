import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { XIcon, LinkedInIcon, FacebookIcon, InstagramIcon } from '@/components/icons/SocialIcons'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/buttons/ui/neon-button'
import SEO from '@/components/SEO'

interface OfficerFull {
  id: string
  name: string
  role: string
  bio: string | null
  region: string | null
  tier: string
  avatar_url: string | null
  order_index: number
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  email: string | null
}

interface PublicStats {
  members: number
  chapters: number
  regions: number
  diaspora: number
}

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const TIER_COLOR: Record<number, string> = {
  0: 'hsl(var(--destructive))',
  1: 'hsl(var(--accent))',
}

const FONT = "'Public Sans', sans-serif"

/** Up to two initials from a name, for the avatar fallback. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Split a biography into clean paragraphs (double newline, then single). */
function bioParagraphs(bio: string): string[] {
  const byBlock = bio
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (byBlock.length > 1) return byBlock
  return bio
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** A short hero "dek" — only used when the bio is long enough to avoid echoing it whole. */
function shortSummary(bio: string, max = 175): string {
  const clean = bio.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const slice = clean.slice(0, max)
  const dot = slice.lastIndexOf('. ')
  if (dot > 70) return slice.slice(0, dot + 1)
  const sp = slice.lastIndexOf(' ')
  return `${slice.slice(0, sp > 0 ? sp : max).trim()}…`
}

/** Portrait avatar with a branded initials fallback when no image exists. */
function PortraitAvatar({
  url,
  name,
  accent,
  size = 168,
}: {
  url: string | null
  name: string
  accent: string
  size?: number
}) {
  const [errored, setErrored] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const showInitials = !url || errored
  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: isMobile ? '100%' : size,
        maxWidth: isMobile ? 320 : undefined,
        aspectRatio: showInitials ? '4 / 5' : undefined,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: showInitials
          ? `color-mix(in srgb, ${accent} 14%, hsl(var(--container-low)))`
          : 'hsl(var(--container-low))',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent }}
      />
      {showInitials ? (
        <span
          aria-hidden
          style={{
            fontFamily: FONT,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: size * 0.34,
            letterSpacing: '0.02em',
            color: accent,
          }}
        >
          {initials(name)}
        </span>
      ) : (
        <img
          src={url ?? ''}
          alt={name}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      )}
    </div>
  )
}

/** Small circular avatar for the related-leaders list. */
function MiniAvatar({ url, name, accent }: { url: string | null; name: string; accent: string }) {
  const [errored, setErrored] = useState(false)
  const showInitials = !url || errored
  return (
    <div
      style={{
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showInitials
          ? `color-mix(in srgb, ${accent} 14%, hsl(var(--container-low)))`
          : 'hsl(var(--container-low))',
        border: `2px solid color-mix(in srgb, ${accent} 14%, transparent)`,
      }}
    >
      {showInitials ? (
        <span
          aria-hidden
          style={{
            fontFamily: FONT,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: accent,
          }}
        >
          {initials(name)}
        </span>
      ) : (
        <img
          src={url ?? ''}
          alt={name}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}

/** A circular, bordered social/contact action. */
function ContactButton({
  href,
  label,
  accent,
  children,
  external = true,
}: {
  href: string
  label: string
  accent: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: '50%',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--on-surface-muted))',
        background: 'hsl(var(--card))',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = accent
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 50%, transparent)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
        e.currentTarget.style.borderColor = 'hsl(var(--border))'
      }}
    >
      {children}
    </a>
  )
}

function MetaRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: string
  label: string
  value: string
  accent: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: accent, marginTop: 1 }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: FONT,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function RelatedCard({ officer, accentColor }: { officer: OfficerFull; accentColor: string }) {
  return (
    <Link to={`/officers/${toSlug(officer.name)}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <MiniAvatar url={officer.avatar_url} name={officer.name} accent={accentColor} />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {officer.name}
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {officer.role}
          </p>
        </div>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 14,
            color: 'hsl(var(--on-surface-muted))',
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          chevron_right
        </span>
      </div>
    </Link>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'hsl(var(--card))',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
  overflow: 'hidden',
}

const sectionHeading: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'hsl(var(--on-surface-muted))',
  margin: 0,
}

export default function OfficerDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [officer, setOfficer] = useState<OfficerFull | null>(null)
  const [related, setRelated] = useState<OfficerFull[]>([])
  const [tierIndex, setTierIndex] = useState(2)
  const [tierTitle, setTierTitle] = useState('')
  const [tierColor, setTierColor] = useState<string | null>(null)
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    if (!ctaRef.current) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCtaVisible(true)
      },
      { threshold: 0.2 }
    )
    obs.observe(ctaRef.current)
    return () => obs.disconnect()
  }, [officer])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      const [allOfficersRes, tiersRes, publicStats] = await Promise.all([
        supabase.from('party_officials').select('*').order('order_index', { ascending: true }),
        supabase
          .from('party_tiers')
          .select('name, title, order_index, accent_color')
          .order('order_index', { ascending: true }),
        adminService.getPublicStats().catch(() => null),
      ])

      const match = (allOfficersRes.data as OfficerFull[] | null)?.find(
        (o) => toSlug(o.name) === slug
      )

      if (!match) {
        navigate('/officers', { replace: true })
        return
      }

      setOfficer(match)
      if (publicStats) {
        setStats({
          members: publicStats.members,
          chapters: publicStats.chapters,
          regions: publicStats.regions,
          diaspora: publicStats.diaspora,
        })
      }

      if (tiersRes.data) {
        const idx = tiersRes.data.findIndex((t) => t.name === match.tier)
        const tier = tiersRes.data[idx === -1 ? 0 : idx] as
          | { title?: string; accent_color?: string | null }
          | undefined
        setTierIndex(idx === -1 ? 2 : idx)
        setTierTitle(tier?.title || match.tier)
        setTierColor(tier?.accent_color ?? null)
      }

      const relatedList = (allOfficersRes.data as OfficerFull[])
        .filter((o) => o.tier === match.tier && o.id !== match.id)
        .slice(0, 6)

      setRelated(relatedList)
      setLoading(false)
    }
    load()
  }, [slug, navigate])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'hsl(var(--background))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            fontFamily: FONT,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 14,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Loading…
        </p>
      </main>
    )
  }

  if (!officer) return null

  // Prefer the tier's own accent_color from the DB; fall back to the legacy
  // index map, then brand green.
  const accentColor = tierColor ?? TIER_COLOR[tierIndex] ?? 'hsl(var(--primary))'
  const firstName = officer.name.split(' ')[0]
  const tierLabel = tierTitle || officer.tier
  const paragraphs = officer.bio ? bioParagraphs(officer.bio) : []
  // Only echo a hero "dek" when the bio is long enough that it won't duplicate the body.
  const dek = officer.bio && officer.bio.trim().length > 220 ? shortSummary(officer.bio) : null

  const socialLinks = [
    officer.facebook_url && {
      key: 'fb',
      href: officer.facebook_url,
      label: 'Facebook',
      external: true,
      node: <FacebookIcon size={17} />,
    },
    officer.instagram_url && {
      key: 'ig',
      href: officer.instagram_url,
      label: 'Instagram',
      external: true,
      node: <InstagramIcon size={17} />,
    },
    officer.linkedin_url && {
      key: 'li',
      href: officer.linkedin_url,
      label: 'LinkedIn',
      external: true,
      node: <LinkedInIcon size={17} />,
    },
    officer.twitter_url && {
      key: 'x',
      href: officer.twitter_url,
      label: 'X (Twitter)',
      external: true,
      node: <XIcon size={17} />,
    },
    officer.email && {
      key: 'mail',
      href: `mailto:${officer.email}`,
      label: 'Email',
      external: false,
      node: (
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          mail
        </span>
      ),
    },
  ].filter(Boolean) as {
    key: string
    href: string
    label: string
    external: boolean
    node: React.ReactNode
  }[]

  const statItems = stats
    ? [
        { key: 'members', label: 'Registered members', value: stats.members },
        { key: 'regions', label: 'Regions', value: stats.regions },
        { key: 'chapters', label: 'Chapters', value: stats.chapters },
        { key: 'diaspora', label: 'Diaspora countries', value: stats.diaspora },
      ].filter((s) => s.value > 0)
    : []

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(to bottom, hsl(var(--surface-warm)), hsl(var(--background)))`,
        overflowX: 'hidden',
      }}
    >
      <SEO
        title={`${officer.name} | The Base`}
        description={
          officer.bio ? shortSummary(officer.bio, 155) : `${officer.name} — ${officer.role}`
        }
      />

      {/* ── Hero header ── */}
      <section
        style={{
          background: 'hsl(var(--container-low))',
          borderBottom: '1px solid hsl(var(--border))',
          padding: 'clamp(32px, 6vw, 56px) clamp(16px, 5vw, 48px) clamp(36px, 6vw, 64px)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Breadcrumbs />

          <div
            className="lp-hero-inner"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(20px, 4vw, 40px)' }}
          >
            <PortraitAvatar url={officer.avatar_url} name={officer.name} accent={accentColor} />

            <div
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div
                className="lp-hero-meta"
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: accentColor,
                    background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                    padding: '4px 11px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    verified
                  </span>
                  {tierLabel}
                </span>
                <button
                  onClick={handleShare}
                  title="Copy link to this profile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 11px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    cursor: 'pointer',
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: copied ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {copied ? 'check' : 'link'}
                  </span>
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 'clamp(1.6rem, 3.2vw, 2.4rem)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 6px',
                    lineHeight: 1.15,
                  }}
                >
                  {officer.name}
                </h1>
                <p
                  style={{
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {officer.role}
                </p>
              </div>

              <BrandLine />

              {/* Meta chips — only render what we have */}
              <div className="lp-hero-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {officer.region && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      fontFamily: FONT,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: accentColor }}
                    >
                      location_on
                    </span>
                    {officer.region}
                  </span>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: accentColor }}
                  >
                    flag
                  </span>
                  Ghana First
                </span>
              </div>

              {dek && (
                <p
                  style={{
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    margin: 0,
                    maxWidth: 620,
                  }}
                >
                  {dek}
                </p>
              )}

              {socialLinks.length > 0 && (
                <div
                  className="lp-hero-meta"
                  style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  {socialLinks.map((s) => (
                    <ContactButton
                      key={s.key}
                      href={s.href}
                      label={s.label}
                      accent={accentColor}
                      external={s.external}
                    >
                      {s.node}
                    </ContactButton>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: biography + sidebar ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 56px) clamp(16px, 5vw, 48px) clamp(48px, 7vw, 80px)',
        }}
      >
        <div
          className="lp-body"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* Biography — the main body */}
          <article style={{ ...cardStyle, padding: 'clamp(24px, 4vw, 40px)' }}>
            <p style={{ ...sectionHeading, marginBottom: 16 }}>About {firstName}</p>
            {paragraphs.length > 0 ? (
              <div style={{ maxWidth: '68ch' }}>
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: FONT,
                      fontWeight: 'var(--font-weight-normal, 400)',
                      fontSize: 16,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.8,
                      margin: i === 0 ? 0 : '18px 0 0',
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  maxWidth: '68ch',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: accentColor, marginTop: 1 }}
                >
                  history_edu
                </span>
                <p
                  style={{
                    fontFamily: FONT,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  A full biography for {firstName} is being prepared.{' '}
                  {socialLinks.length > 0
                    ? `In the meantime, you can connect using the links above. As ${officer.role}, ${firstName} is part of The Base's official leadership.`
                    : `As ${officer.role}, ${firstName} is part of The Base's official leadership, committed to Ghana First.`}
                </p>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Leadership details — only rows we actually have */}
            <div style={{ ...cardStyle, padding: 18 }}>
              <p style={{ ...sectionHeading, marginBottom: 14 }}>Leadership details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <MetaRow
                  icon="workspace_premium"
                  label="Tier"
                  value={tierLabel}
                  accent={accentColor}
                />
                <MetaRow
                  icon="badge"
                  label="Official role"
                  value={officer.role}
                  accent={accentColor}
                />
                {officer.region && (
                  <MetaRow
                    icon="location_on"
                    label="Region / base"
                    value={officer.region}
                    accent={accentColor}
                  />
                )}
              </div>
            </div>

            {/* Movement at a glance — live, DB-driven */}
            {statItems.length > 0 && (
              <div style={{ ...cardStyle, padding: 18 }}>
                <p style={{ ...sectionHeading, marginBottom: 4 }}>Movement at a glance</p>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 14px',
                  }}
                >
                  Live totals, updated as the movement grows.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: statItems.length > 1 ? '1fr 1fr' : '1fr',
                    gap: 10,
                  }}
                >
                  {statItems.map((s) => (
                    <div
                      key={s.key}
                      style={{
                        position: 'relative',
                        padding: '12px 14px 12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'hsl(var(--container-low))',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: accentColor,
                        }}
                      />
                      <p
                        style={{
                          fontFamily: FONT,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 22,
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          lineHeight: 1.1,
                        }}
                      >
                        {s.value.toLocaleString()}
                      </p>
                      <p
                        style={{
                          fontFamily: FONT,
                          fontSize: 10.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '4px 0 0',
                        }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related leaders */}
            {related.length > 0 && (
              <div style={{ ...cardStyle, padding: 0 }}>
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: accentColor }}
                  >
                    group
                  </span>
                  <p
                    style={{
                      fontFamily: FONT,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    More in {tierLabel}
                  </p>
                </div>
                <div style={{ padding: '8px 4px' }}>
                  {related.map((r) => (
                    <RelatedCard key={r.id} officer={r} accentColor={accentColor} />
                  ))}
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}>
                  <Link
                    to="/officers"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontFamily: FONT,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--on-surface))')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'hsl(var(--on-surface-muted))')
                    }
                  >
                    View all leaders
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(48px, 6vw, 72px)',
        }}
      >
        <div
          ref={ctaRef}
          className="lp-cta"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(24px, 4vw, 40px) clamp(24px, 5vw, 48px)',
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: FONT,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 6px',
              }}
            >
              Inspired by {firstName} ? Join the movement.
            </h3>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              Add your name. Strengthen the cause. Ghana First.
            </p>
          </div>
          <Link to="/register" style={{ flexShrink: 0 }}>
            <Button variant="accent" size="lg">
              Join the Base
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Button>
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .lp-body { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .lp-hero-inner { flex-direction: column !important; align-items: flex-start !important; }
          .lp-cta { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </main>
  )
}
