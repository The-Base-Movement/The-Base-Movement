import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { BlogPost } from '@/types/admin'

interface BlogPostCardProps {
  post: BlogPost
  baseUrl: string
}

const FONT = "'Public Sans', sans-serif"

export function BlogPostCard({ post, baseUrl }: BlogPostCardProps) {
  const [hover, setHover] = useState(false)
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const authorInitial = post.authorName?.charAt(0)?.toUpperCase() || 'T'
  const displayName =
    post.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : post.authorName

  const metaStyle: CSSProperties = {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 'var(--font-weight-medium, 500)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'hsl(var(--on-surface-muted))',
  }

  return (
    <article
      aria-labelledby={`blog-post-title-${post.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'hsl(var(--card))',
        border: `1px solid ${hover ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
        borderRadius: 'var(--radius-md)',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 16px 32px -8px rgba(0,0,0,.1)' : 'none',
        transition: 'all 0.2s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer',
      }}
    >
      {/* Image with category pill overlay */}
      <div
        style={{
          aspectRatio: '16 / 10',
          background: 'hsl(var(--container-low))',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {post.imageUrl ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hover ? 'scale(1.05)' : 'none',
              transition: 'transform 0.7s',
            }}
            decoding="async"
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'hsl(132 9% 10%)',
            }}
          >
            <div style={{ display: 'flex', height: 5, width: 56 }} aria-hidden="true">
              <div style={{ flex: 1, background: '#CE1126' }} />
              <div style={{ flex: 1, background: '#DAA520' }} />
              <div style={{ flex: 1, background: '#006B3F' }} />
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 'var(--font-weight-medium, 500)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: FONT,
              }}
            >
              The Base
            </span>
          </div>
        )}
        {post.category && (
          <span
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              padding: '4px 10px',
              background: 'hsl(var(--card))',
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11.5,
              color: 'hsl(var(--primary))',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            {post.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Meta */}
        <div
          style={{ ...metaStyle, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
        >
          <span>{post.category || 'Movement'}</span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'currentColor',
              opacity: 0.6,
              flexShrink: 0,
            }}
          />
          <span>{post.readTime}</span>
        </div>

        <Link
          to={`${baseUrl}/${post.slug}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h3
            id={`blog-post-title-${post.id}`}
            style={{
              fontFamily: FONT,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 17,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              marginBottom: 8,
              color: hover ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
              transition: 'color 0.2s',
            }}
          >
            {post.title}
          </h3>
          <span
            className="material-symbols-outlined"
            style={{
              flexShrink: 0,
              marginTop: 4,
              fontSize: 16,
              color: 'hsl(var(--primary))',
              opacity: hover ? 1 : 0,
              transform: hover ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'all 0.3s',
            }}
          >
            arrow_forward
          </span>
        </Link>

        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.55,
            marginBottom: 14,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>

        {/* Author row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 14,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          {post.authorImage ? (
            <img
              src={post.authorImage}
              alt={displayName || ''}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                flexShrink: 0,
                background: 'hsl(var(--primary))',
              }}
            >
              {authorInitial}
            </div>
          )}
          <span
            style={{
              fontFamily: FONT,
              fontSize: 11.5,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10.5,
              color: 'hsl(var(--on-surface-muted))',
              fontWeight: 'var(--font-weight-medium, 500)',
              fontFamily: FONT,
            }}
          >
            {formattedDate}
          </span>
        </div>
      </div>
    </article>
  )
}
