import { Link } from 'react-router-dom'
import type { BlogPost } from '@/services/adminService'

interface DashboardFeaturedPostProps {
  post: BlogPost
  baseUrl: string
}

export function DashboardFeaturedPost({ post, baseUrl }: DashboardFeaturedPostProps) {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {post.imageUrl && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            decoding="async"
            loading="lazy"
          />
        </div>
      )}
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {post.category && (
            <span className="pill pill-ok" style={{ fontSize: 9 }}>
              {post.category}
            </span>
          )}
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </span>
        </div>
        <Link to={`${baseUrl}/${post.slug}`} style={{ textDecoration: 'none' }}>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
              margin: '0 0 8px',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            {post.title}
          </h2>
        </Link>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.55,
            margin: '0 0 14px',
          }}
        >
          {post.excerpt}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {post.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : post.authorName} ·{' '}
            {post.readTime}
          </span>
          <Link
            to={`${baseUrl}/${post.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 11,
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
            }}
          >
            Read article
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
