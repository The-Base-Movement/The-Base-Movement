import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import SEO from '@/components/SEO'
import { Skeleton } from '@/components/states'
import { sharePost } from '@/lib/sharePost'
import { youthWingService } from '@/services/youthWingService'
import type { BlogPost } from '@/types/admin'
import { PostToolbar } from '../blogpost/PostToolbar'
import { PostHeader } from '../blogpost/PostHeader'
import { PostHeroImage } from '../blogpost/PostHeroImage'
import { PostSidebar } from '../blogpost/PostSidebar'
import { YW_SCOPE, YW_ACCENT } from './theme'

/**
 * A single Youth Wing article.
 *
 * Built from the same components as the adult post page (`../blogpost/*`) so the
 * two read as one publication: same toolbar, header, hero and author/share/
 * categories aside, same grid. What differs is deliberate and only two things --
 * the accent is the Youth Wing teal rather than the party green and gold, and
 * the categories in the aside link into the youth reading list, never /blog.
 *
 * There is no like button and no comment section. Youth Wing members have no
 * auth account, so there is nobody to attribute a like or a comment to, and a
 * comment thread under an article written for 14-17s is a moderation surface
 * this programme has not taken on.
 *
 * The lookup is audience-scoped: an adult /blog slug pasted into this URL
 * returns nothing rather than rendering adult content inside the youth surface.
 */
export default function YouthWingArticleDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<BlogPost | null>(null)
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    // Reset on slug change: navigating between two youth articles keeps this
    // component mounted, and without it the previous article stays on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    setIsLoading(true)
    youthWingService
      .getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setIsLoading(false))
  }, [slug])

  // The aside lists categories that actually exist in the youth reading list,
  // rather than the adult sidebar's fixed set -- a youth reader following
  // "Diaspora" into an empty youth feed is a dead end.
  useEffect(() => {
    youthWingService
      .getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
  }, [])

  const categories = useMemo(() => {
    const seen = [...new Set(articles.map((a) => a.category).filter(Boolean))]
    return seen.length > 0 ? seen : ['Youth Wing']
  }, [articles])

  const handleShare = (platform?: string) => {
    if (!article) return
    sharePost(article.title, window.location.href, platform)
  }

  if (isLoading) {
    return (
      <div className={YW_SCOPE}>
        <div className="page-container pt-12 pb-20">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Skeleton variant="chip" width={80} />
            <Skeleton variant="text-xl" width="60%" />
            <Skeleton variant="text-md" width="40%" />
            <Skeleton variant="img" height={320} />
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className={YW_SCOPE}>
        <SEO title="Article not found | The Base Movement Youth Wing" noindex />
        <div className="page-container pt-12 pb-20">
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
    <div
      className={`${YW_SCOPE} min-h-screen pb-20`}
      style={{ background: 'hsl(var(--background))' }}
    >
      <SEO
        title={`${article.seoTitle || article.title} | The Base Movement Youth Wing`}
        description={article.metaDescription || article.excerpt}
        canonical={`/youth-wing/articles/${article.slug}`}
        ogType="article"
        ogImage={article.imageUrl}
      />

      <main className="page-container pt-12">
        <PostToolbar title={article.title} onShare={handleShare} />

        <article className="space-y-12">
          <PostHeader
            category={article.category || 'Youth Wing'}
            publishedAt={article.publishedAt}
            readTime={article.readTime}
            title={article.title}
            excerpt={article.excerpt}
            accent={YW_ACCENT}
          />

          <PostHeroImage imageUrl={article.imageUrl} title={article.title} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-16">
            <PostSidebar
              authorImage={article.authorImage}
              authorName={article.authorName}
              authorRole={article.authorRole}
              authorBio={article.authorBio}
              onShare={handleShare}
              categories={categories}
              categoryBasePath="/youth-wing/articles"
              accent={YW_ACCENT}
            />

            <div className="lg:col-span-3 order-1 lg:order-2">
              <div
                className="prose prose-lg max-w-none prose-standard
                  prose-headings:font-meta prose-headings:font-medium prose-headings:tracking-tight
                  prose-p:leading-relaxed prose-p:mb-8 prose-strong:font-medium"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || '') }}
              />

              {article.tags.length > 0 && (
                <div
                  className="mt-16 pt-8 flex flex-wrap gap-2"
                  style={{ borderTop: '1px solid hsl(var(--border))' }}
                >
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-micro font-medium tracking-tight"
                      style={{
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-12">
                <Link to="/youth-wing/articles" className="btn btn-outline">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    arrow_back
                  </span>
                  All Youth Wing articles
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
