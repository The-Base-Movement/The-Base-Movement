import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { youthWingService } from '@/services/youthWingService'
import type { BlogPost } from '@/types/admin'
import { YW_SCOPE, YW_ACCENT } from './theme'

/**
 * A single Youth Wing article. The lookup is audience-scoped, so an adult /blog
 * slug pasted into this URL returns nothing rather than rendering adult content
 * inside the youth surface.
 */
export default function YouthWingArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    youthWingService
      .getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) {
    return (
      <div className={YW_SCOPE}>
        <div className="max-w-[820px] mx-auto px-5 py-16">
          <p style={{ color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className={YW_SCOPE}>
        <SEO title="Article not found | The Base Movement Youth Wing" noindex />
        <div className="max-w-[820px] mx-auto px-5 py-16">
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 26,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 10px',
            }}
          >
            Article not found
          </h1>
          <p style={{ color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>
            This article is not part of the Youth Wing reading list.
          </p>
          <Link to="/youth-wing/articles" className="btn btn-outline">
            Back to Youth Wing articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={YW_SCOPE}>
      <SEO
        title={`${article.seoTitle || article.title} | The Base Movement Youth Wing`}
        description={article.metaDescription || article.excerpt}
        canonical={`/youth-wing/articles/${article.slug}`}
        ogType="article"
        ogImage={article.imageUrl}
      />

      <article className="max-w-[820px] mx-auto px-5 lg:px-8 py-12">
        <Link
          to="/youth-wing/articles"
          style={{ fontSize: 12.5, color: YW_ACCENT, textDecoration: 'none' }}
        >
          &larr; Youth Wing articles
        </Link>
        <p
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: YW_ACCENT,
            margin: '18px 0 6px',
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {article.category || 'Youth Wing'}
        </p>
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {article.title}
        </h1>
        <BrandLine />
        <p
          style={{
            fontSize: 12.5,
            color: 'hsl(var(--on-surface-muted))',
            margin: '14px 0 0',
          }}
        >
          {article.authorName || 'The Base Movement'}
          {article.publishedAt
            ? ` · ${new Date(article.publishedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}`
            : ''}
          {article.readTime ? ` · ${article.readTime}` : ''}
        </p>

        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt=""
            style={{
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              margin: '26px 0 0',
              display: 'block',
            }}
          />
        )}

        <div
          className="prose prose-lg max-w-none prose-standard prose-headings:font-meta prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:font-medium"
          style={{ marginTop: 28 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || '') }}
        />
      </article>
    </div>
  )
}
