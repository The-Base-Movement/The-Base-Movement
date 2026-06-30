import { useState, useEffect } from 'react'
import { contentService } from '@/services/contentService'
import type { BlogPost } from '@/types/admin'
import SEO from '@/components/SEO'
import { BlogPostCard } from '@/components/BlogPostCard'

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
            <a
              href="/dashboard/blog"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8, textDecoration: 'none' }}
            >
              Browse Updates
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} baseUrl="/dashboard/blog" />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
