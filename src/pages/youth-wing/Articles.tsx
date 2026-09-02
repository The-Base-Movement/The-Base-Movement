import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { youthWingService } from '@/services/youthWingService'
import type { BlogPost } from '@/types/admin'
import { YW_SCOPE, YW_ACCENT, YW_ACCENT_SOFT } from './theme'

/**
 * Youth Wing reading list. Only articles with audience = 'YOUTH' appear here,
 * and those articles never appear on /blog. The two bodies of content are
 * written for different readerships and are kept apart end to end.
 */
export default function YouthWingArticles() {
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchParams] = useSearchParams()

  // The article page's aside links categories here, so this page has to honour
  // ?category= or those links are dead ends.
  const category = searchParams.get('category')
  const visible = useMemo(
    () =>
      category
        ? articles.filter((a) => (a.category || '').toLowerCase() === category.toLowerCase())
        : articles,
    [articles, category]
  )

  useEffect(() => {
    youthWingService
      .getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className={YW_SCOPE}>
      <SEO
        title="Youth Wing articles | The Base Movement"
        description="Civic education articles written for The Base Movement Youth Wing, ages 14 to 17."
        canonical="/youth-wing/articles"
      />

      <section
        style={{
          background: YW_ACCENT_SOFT,
          borderBottom: '1px solid hsl(var(--border))',
          padding: '36px 0',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8">
          <span
            className="pill"
            style={{
              background: 'hsla(var(--yw-accent), 0.12)',
              color: YW_ACCENT,
              border: '1px solid hsla(var(--yw-accent), 0.3)',
            }}
          >
            Written for ages 14 to 17
          </span>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '12px 0 0',
            }}
          >
            Youth Wing articles
          </h1>
          <BrandLine />
          <p
            style={{
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              margin: '16px 0 0',
              maxWidth: 620,
              lineHeight: 1.65,
            }}
          >
            Civic education written for the Youth Wing. For the Movement&apos;s general updates, see{' '}
            <Link to="/blog" style={{ color: 'hsl(var(--primary))' }}>
              Updates
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-12">
        {isLoading ? (
          <p style={{ color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
        ) : visible.length === 0 ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}
          >
            <p style={{ color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
              {category
                ? `No Youth Wing articles in ${category} yet.`
                : 'No Youth Wing articles have been published yet.'}
            </p>
            {category && (
              <Link to="/youth-wing/articles" className="btn btn-outline">
                All Youth Wing articles
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((a) => (
              <Link
                key={a.id}
                to={`/youth-wing/articles/${a.slug}`}
                className="panel"
                style={{ padding: 0, overflow: 'hidden', textDecoration: 'none', display: 'block' }}
              >
                {a.imageUrl && (
                  <img
                    src={a.imageUrl}
                    alt=""
                    style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div style={{ padding: '18px 20px' }}>
                  <p
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: YW_ACCENT,
                      margin: '0 0 6px',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {a.category || 'Youth Wing'}
                  </p>
                  <h2
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 17,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {a.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {a.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
