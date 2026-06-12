import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contentService } from '@/services/contentService'
import type { BlogPost } from '@/types/admin'
import SEO from '@/components/SEO'

export default function LikedPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentService.getLikedPosts().then((data) => {
      setPosts(data)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <SEO title="Liked Posts" noindex />
      <div className="main">
        <div className="ph" style={{ marginBottom: 24 }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Liked Posts
            </h2>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Updates you've liked
            </p>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="panel"
                style={{ height: 180, opacity: 0.5, animation: 'pulse 1.5s infinite' }}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div
            className="panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 24px',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}
            >
              favorite_border
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No liked posts yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                maxWidth: 260,
                lineHeight: 1.6,
              }}
            >
              Like updates as you read them and they'll appear here.
            </p>
            <Link
              to="/dashboard/blog"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8, textDecoration: 'none' }}
            >
              Browse Updates
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/dashboard/blog/${post.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="panel"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 4px 20px rgba(0,0,0,0.10)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = ''
                  }}
                >
                  {post.imageUrl ? (
                    <div
                      style={{
                        height: 140,
                        overflow: 'hidden',
                        background: 'hsl(var(--container-low))',
                      }}
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 80,
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 28,
                          color: 'hsl(var(--on-surface-muted))',
                          opacity: 0.3,
                        }}
                      >
                        article
                      </span>
                    </div>
                  )}
                  <div style={{ padding: '14px 16px 16px' }}>
                    {post.category && (
                      <span
                        className="pill pill-ok"
                        style={{ fontSize: 10, marginBottom: 8, display: 'inline-block' }}
                      >
                        {post.category}
                      </span>
                    )}
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.title}
                    </p>
                    {post.excerpt && (
                      <p
                        style={{
                          margin: '0 0 10px',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.excerpt}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 12,
                          color: 'hsl(var(--destructive))',
                          fontVariationSettings: "'FILL' 1",
                        }}
                      >
                        favorite
                      </span>
                      {post.readTime && <span>{post.readTime}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
