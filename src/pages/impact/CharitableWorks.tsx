import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Skeleton } from '@/components/states'
import { impactContentService, type ImpactProject } from '@/services/impactContentService'
import { ImpactProjectModal } from './ImpactProjectModal'

/**
 * Public /impact page — showcases the charitable works of the movement.
 * No financial data: content comes from impact_projects (admin-managed).
 * Each card opens a modal with up to 4 images + notes.
 */
export default function CharitableWorks() {
  const [projects, setProjects] = useState<ImpactProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [active, setActive] = useState<ImpactProject | null>(null)

  useEffect(() => {
    impactContentService
      .getPublishedProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <main style={{ background: 'hsl(var(--background))', minHeight: '100vh' }}>
      <SEO
        title="Our Charitable Work"
        description="The community and charitable work of The Base Movement across Ghana and the diaspora, projects, outreach, and the people we serve."
        canonical="/impact"
      />

      {active && <ImpactProjectModal project={active} onClose={() => setActive(null)} />}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          background: '#181d19',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '5px solid',
          borderImage:
            'linear-gradient(to right, hsl(var(--brand-red)), hsl(var(--brand-gold)), hsl(var(--brand-green))) 1',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 100% at 90% 50%, rgba(0,107,63,.2), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'clamp(40px,5vw,72px) clamp(20px,4vw,48px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Breadcrumbs variant="dark" />
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <BrandLine />
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 'clamp(28px,5vw,44px)',
                lineHeight: 1.1,
                margin: '16px 0 0',
              }}
            >
              Our charitable work
            </h1>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 'clamp(15px,2.4vw,18px)',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.82)',
                margin: '16px 0 0',
              }}
            >
              Beyond politics, The Base Movement shows up for communities. These are the projects,
              outreach efforts, and acts of service our members carry out across Ghana and the
              diaspora.
            </p>
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'clamp(40px,8vw,80px) 20px',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: 'hsl(var(--primary))' }}
            >
              volunteer_activism
            </span>
            <p style={{ margin: '12px 0 0', fontSize: 15 }}>
              Our charitable work will be showcased here soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p)}
                className="panel"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Cover */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 10',
                    background: 'hsl(var(--container-low))',
                  }}
                >
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                        image
                      </span>
                    </div>
                  )}
                  {p.images.length > 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        photo_library
                      </span>
                      {p.images.length}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div
                  style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 16,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.25,
                    }}
                  >
                    {p.title}
                  </h3>
                  {p.location && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        location_on
                      </span>
                      {p.location}
                    </span>
                  )}
                  {p.summary && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: 'hsl(var(--on-surface-muted))',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.summary}
                    </p>
                  )}
                  <span
                    style={{
                      marginTop: 'auto',
                      paddingTop: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    View project
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      arrow_forward
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA (non-financial) ──────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 'clamp(20px,3vw,28px)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Be part of the work
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              margin: '10px auto 20px',
              maxWidth: 520,
            }}
          >
            Join the movement or reach out to volunteer with a project in your community.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary">
              Join the movement
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Volunteer with us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
