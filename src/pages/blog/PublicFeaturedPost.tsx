import { Link } from 'react-router-dom'
import type { BlogPost } from '@/services/adminService'

interface PublicFeaturedPostProps {
  post: BlogPost
  baseUrl: string
}

export function PublicFeaturedPost({ post, baseUrl }: PublicFeaturedPostProps) {
  return (
    <section className="mb-16">
      <p className="font-meta text-xs text-warm-gold tracking-tight mb-6">Featured</p>
      <div
        className="grid md:grid-cols-2 gap-0 border border-[hsl(var(--border))] shadow-sm overflow-hidden group hover:shadow-lg transition-shadow"
        style={{ background: 'hsl(var(--card))' }}
      >
        <div className="overflow-hidden bg-stone-100" style={{ aspectRatio: '16/9' }}>
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: 'hsl(132 9% 10%)' }}
            >
              <div className="flex h-[6px] w-20" aria-hidden="true">
                <div className="flex-1 bg-[#CE1126]" />
                <div className="flex-1 bg-[#DAA520]" />
                <div className="flex-1 bg-[#006B3F]" />
              </div>
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-white/30 font-['Public_Sans',sans-serif]">
                The Base
              </span>
            </div>
          )}
        </div>
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-sm text-xs font-medium tracking-tight border bg-[hsl(var(--container-low))] text-[hsl(var(--on-surface-muted))] border-[hsl(var(--border))]">
              {post.category}
            </span>
            <span className="mx-2 text-[hsl(var(--on-surface-muted))] opacity-50">|</span>
            <span className="text-xs text-[hsl(var(--on-surface-muted))] font-meta font-medium">
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
            <h2 className="text-xl md:text-2xl font-medium text-[hsl(var(--on-surface))] tracking-tight leading-tight mb-4 hover:text-[hsl(var(--primary))] transition-colors">
              {post.title}
            </h2>
          </Link>
          <p className="text-[hsl(var(--on-surface-muted))] text-sm leading-relaxed mb-6">
            {post.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs font-medium text-[hsl(var(--on-surface-muted))] tracking-tight">
              {post.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : post.authorName}{' '}
              <span className="mx-2 opacity-50">|</span> {post.readTime}
            </div>
            <Link
              to={`${baseUrl}/${post.slug}`}
              className="flex items-center gap-2 text-[hsl(var(--primary))] font-medium text-xs hover:underline"
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
