/**
 * BlogPostCard Component
 * -------------------------------------------------------------
 * Displays a blog post preview card in list / grids.
 *
 * Layout: a photo carrying the category pill, a bordered meta bar straddling
 * the seam between photo and body, then a centred title, excerpt and Read more
 * button.
 *
 * The meta bar deliberately carries date and read time rather than comment and
 * like counts. Both counts are available (`blog_comments`,
 * `blog_post_likes`) but are currently zero on almost every post, and a bar
 * that announces "0 comments, 0 likes" on every card reads worse than one that
 * never mentions engagement at all. Add them here when the numbers earn it.
 *
 * Colours that need a hover live in `.blog-card*` classes in src/index.css --
 * an inline colour beats every :hover rule for that property.
 */

import { Link } from 'react-router-dom'
import { getBlogImageUrl } from '@/lib/blogImages'
import type { BlogPost } from '@/types/admin'

interface BlogPostCardProps {
  post: BlogPost
  baseUrl: string
}

const FONT = "'Public Sans', sans-serif"

/** One entry in the straddling meta bar. */
function MetaItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 'var(--font-weight-medium, 500)',
        color: 'hsl(var(--on-surface))',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  )
}

/**
 * BlogPostCard component definition.
 */
export function BlogPostCard({ post, baseUrl }: BlogPostCardProps) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  const maxExcerptLength = 120
  const excerptText =
    post.excerpt && post.excerpt.length > maxExcerptLength
      ? post.excerpt.substring(0, maxExcerptLength) + '...'
      : post.excerpt

  const href = `${baseUrl}/${post.slug}`

  return (
    <article
      className="blog-card"
      aria-labelledby={`blog-post-title-${post.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Photo, with the category pill in the top corner -- the meta bar
          overlaps the bottom edge, so the pill cannot live down there. */}
      <div
        className="blog-card-photo"
        style={{
          aspectRatio: '16 / 10',
          background: 'hsl(var(--container-low))',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={getBlogImageUrl(post.imageUrl)}
          alt={post.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          decoding="async"
          loading="lazy"
        />
        {post.category && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '4px 10px',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--primary))',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            {post.category}
          </span>
        )}
      </div>

      {/* Meta bar, pulled up over the seam */}
      <div
        className="blog-card-meta"
        style={{
          margin: '-30px 18px 0',
          position: 'relative',
          zIndex: 3,
          borderRadius: 'var(--radius-sm)',
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {formattedDate && <MetaItem icon="calendar_today">{formattedDate}</MetaItem>}
        {post.readTime && <MetaItem icon="schedule">{post.readTime}</MetaItem>}
      </div>

      {/* Body */}
      <div
        style={{
          padding: '18px 20px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 10,
          flex: 1,
        }}
      >
        <Link to={href} style={{ textDecoration: 'none' }}>
          <h3
            id={`blog-post-title-${post.id}`}
            className="blog-card-title"
            style={{
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              margin: 0,
              textWrap: 'balance',
            }}
          >
            {post.title}
          </h3>
        </Link>

        <p
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '34ch',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {excerptText}
        </p>

        {/* Pushed to the bottom so the button lines up across a row of
            uneven titles. */}
        <Link
          to={href}
          className="blog-card-cta"
          aria-label={`Read more: ${post.title}`}
          style={{
            marginTop: 'auto',
            paddingTop: 9,
            paddingBottom: 9,
            paddingLeft: 20,
            paddingRight: 20,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)',
            fontFamily: FONT,
            fontSize: 11.5,
            fontWeight: 'var(--font-weight-medium, 500)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Read more
        </Link>
      </div>
    </article>
  )
}
