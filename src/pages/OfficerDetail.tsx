import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const TIER_COLOR: Record<number, string> = {
  0: 'hsl(var(--destructive))',
  1: 'hsl(var(--accent))',
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
          borderRadius: 8,
          transition: 'background 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'hsl(var(--container-low))',
            border: `2px solid color-mix(in srgb, ${accentColor} 12%, transparent)`,
          }}
        >
          <img
            src={officer.avatar_url || '/officer-placeholder.png'}
            alt={officer.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
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
              fontFamily: "'Public Sans', sans-serif",
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

export default function OfficerDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [officer, setOfficer] = useState<OfficerFull | null>(null)
  const [related, setRelated] = useState<OfficerFull[]>([])
  const [tierIndex, setTierIndex] = useState(2)
  const [tierTitle, setTierTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const ctaRef = useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCtaVisible(true)
      },
      { threshold: 0.2 }
    )
    if (ctaRef.current) obs.observe(ctaRef.current)
    return () => obs.disconnect()
  }, [])

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
      const [allOfficersRes, tiersRes] = await Promise.all([
        supabase.from('party_officials').select('*').order('order_index', { ascending: true }),
        supabase
          .from('party_tiers')
          .select('name, title, order_index')
          .order('order_index', { ascending: true }),
      ])

      const match = (allOfficersRes.data as OfficerFull[] | null)?.find(
        (o) => toSlug(o.name) === slug
      )

      if (!match) {
        navigate('/officers', { replace: true })
        return
      }

      setOfficer(match)

      if (tiersRes.data) {
        const idx = tiersRes.data.findIndex((t) => t.name === match.tier)
        setTierIndex(idx === -1 ? 2 : idx)
        setTierTitle(tiersRes.data[idx === -1 ? 0 : idx]?.title || match.tier)
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
            fontFamily: "'Public Sans', sans-serif",
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

  const accentColor = TIER_COLOR[tierIndex] ?? 'hsl(var(--primary))'
  const hasSocials =
    officer.facebook_url ||
    officer.instagram_url ||
    officer.twitter_url ||
    officer.linkedin_url ||
    officer.email

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
        description={officer.bio || `${officer.name} — ${officer.role}`}
      />

      {/* Hero band */}
      <section
        style={{
          background: 'hsl(var(--on-surface))',
          padding: 'clamp(48px, 8vw, 80px) clamp(16px, 5vw, 48px) clamp(32px, 5vw, 56px)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Breadcrumbs variant="dark" />
        </div>
      </section>

      {/* Content */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(64px, 8vw, 96px)',
        }}
      >
        <div
          className="officer-detail-outer"
          style={{
            marginTop: -32,
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Profile card */}
          <div
            className="officer-detail-grid"
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 12,
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 320px) 1fr',
            }}
          >
            {/* Photo */}
            <div
              style={{
                position: 'relative',
                background: 'hsl(var(--container-low))',
                minHeight: 400,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: accentColor,
                }}
              />
              <img
                src={officer.avatar_url || '/officer-placeholder.png'}
                alt={officer.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  minHeight: 400,
                }}
              />
            </div>

            {/* Details */}
            <div
              style={{
                padding: 'clamp(24px, 3vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: accentColor,
                    background: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                    padding: '3px 10px',
                    borderRadius: 99,
                  }}
                >
                  {tierTitle || officer.tier}
                </span>
                <button
                  onClick={handleShare}
                  title="Copy link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid hsl(var(--border))',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
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
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 8px',
                    lineHeight: 1.2,
                  }}
                >
                  {officer.name}
                </h1>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: 0,
                  }}
                >
                  {officer.role}
                </p>
              </div>

              {/* Key facts strip */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'hsl(var(--container-low))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, color: accentColor }}
                  >
                    verified
                  </span>
                  {tierTitle || officer.tier}
                </span>
                {officer.region && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'hsl(var(--container-low))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13, color: accentColor }}
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
                    gap: 4,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'hsl(var(--container-low))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, color: accentColor }}
                  >
                    flag
                  </span>
                  Ghana First
                </span>
              </div>

              <BrandLine />

              {officer.bio ? (
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {officer.bio}
                </p>
              ) : (
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  No biography available yet.
                </p>
              )}

              {hasSocials && (
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: 8,
                  }}
                >
                  {officer.facebook_url && (
                    <a
                      href={officer.facebook_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <FacebookIcon size={18} />
                    </a>
                  )}
                  {officer.instagram_url && (
                    <a
                      href={officer.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <InstagramIcon size={18} />
                    </a>
                  )}
                  {officer.linkedin_url && (
                    <a
                      href={officer.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <LinkedInIcon size={18} />
                    </a>
                  )}
                  {officer.twitter_url && (
                    <a
                      href={officer.twitter_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <XIcon size={18} />
                    </a>
                  )}
                  {officer.email && (
                    <a
                      href={`mailto:${officer.email}`}
                      style={{
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.5,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        mail
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related leaders aside */}
          {related.length > 0 && (
            <aside
              style={{
                background: 'hsl(var(--background))',
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
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
                  style={{ fontSize: 15, color: accentColor }}
                >
                  group
                </span>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  {tierTitle || 'Same tier'}
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
                    fontFamily: "'Public Sans', sans-serif",
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
            </aside>
          )}
        </div>
      </section>

      {/* CTA strip */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(48px, 6vw, 72px)',
        }}
      >
        <div
          ref={ctaRef}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            background: 'hsl(var(--on-surface))',
            borderRadius: 12,
            padding: 'clamp(24px, 4vw, 40px) clamp(24px, 5vw, 48px)',
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                color: '#fff',
                margin: '0 0 6px',
              }}
            >
              Inspired by {officer.name.split(' ')[0]}? Join the movement.
            </h3>
            <p
              style={{
                fontSize: 14,
                fontWeight: 'var(--font-weight-normal, 400)',
                color: 'rgba(255,255,255,0.65)',
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
        @media (max-width: 768px) {
          .officer-detail-outer { grid-template-columns: 1fr !important; }
          .officer-detail-grid { grid-template-columns: 1fr !important; }
          .officer-detail-grid > div:first-child { min-height: 280px !important; }
        }
      `}</style>
    </main>
  )
}
