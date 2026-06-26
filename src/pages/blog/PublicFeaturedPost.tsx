import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getBlogImageUrl } from '@/lib/blogImages'
import type { BlogPost } from '@/services/adminService'

interface PublicFeaturedPostProps {
  post: BlogPost
  baseUrl: string
}

export function PublicFeaturedPost({ post, baseUrl }: PublicFeaturedPostProps) {
  const [titleHover, setTitleHover] = useState(false)
  const muted = 'hsl(var(--on-surface-muted))'

  return (
    <section className="mb-16">
      <p className="font-meta text-xs tracking-tight mb-6" style={{ color: 'hsl(var(--accent))' }}>
        Featured
      </p>
      <div
        className="grid md:grid-cols-2 gap-0 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img
            src={getBlogImageUrl(post.imageUrl)}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            decoding="async"
            loading="lazy"
          />
        </div>
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-2.5 py-1 rounded-sm text-xs font-medium tracking-tight border"
              style={{
                background: 'hsl(var(--container-low))',
                color: muted,
                borderColor: 'hsl(var(--border))',
              }}
            >
              {post.category}
            </span>
            <span className="mx-2 opacity-50" style={{ color: muted }}>
              |
            </span>
            <span className="text-xs font-meta font-medium" style={{ color: muted }}>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
            </span>
          </div>
          <Link to={`${baseUrl}/${post.slug}`}>
            <h2
              className="text-xl md:text-2xl font-medium tracking-tight leading-tight mb-4 transition-colors"
              style={{ color: titleHover ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))' }}
              onMouseEnter={() => setTitleHover(true)}
              onMouseLeave={() => setTitleHover(false)}
            >
              {post.title}
            </h2>
          </Link>
          <p className="text-sm leading-relaxed mb-6" style={{ color: muted }}>
            {post.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs font-medium tracking-tight" style={{ color: muted }}>
              {post.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : post.authorName}{' '}
              <span className="mx-2 opacity-50">|</span> {post.readTime}
            </div>
            <Link
              to={`${baseUrl}/${post.slug}`}
              className="flex items-center gap-2 font-medium text-xs hover:underline"
              style={{ color: 'hsl(var(--primary))' }}
            >
              Read article{' '}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
