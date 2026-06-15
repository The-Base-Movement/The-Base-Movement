import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BlogPost } from '@/types/admin'

interface BlogPostCardProps {
  post: BlogPost
  baseUrl: string
}

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
      }}
      className="overflow-hidden group flex flex-col h-full cursor-pointer"
    >
      {/* Image with category pill overlay */}
      <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden flex items-center justify-center">
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
            <div className="flex h-[5px] w-14" aria-hidden="true">
              <div className="flex-1 bg-[#CE1126]" />
              <div className="flex-1 bg-[#DAA520]" />
              <div className="flex-1 bg-[#006B3F]" />
            </div>
            <span className="text-[9px] font-medium tracking-[0.18em] uppercase text-white/30 font-['Public_Sans',sans-serif]">
              The Base
            </span>
          </div>
        )}
        {post.category && (
          <span className="absolute bottom-[14px] left-[14px] px-[10px] py-1 bg-white font-medium text-[11.5px] text-[var(--primary)] tracking-[0.05em] uppercase rounded-[2px]">
            {post.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-[18px] flex flex-col flex-1">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 text-[12px] font-medium tracking-[0.04em] uppercase text-[var(--on-surface-muted,#6b7280)] font-['Public_Sans',sans-serif]">
          <span>{post.category || 'Movement'}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-current opacity-60 shrink-0" />
          <span>{post.readTime}</span>
        </div>

        <Link
          to={`${baseUrl}/${post.slug}`}
          className="group/title flex items-start justify-between gap-3"
        >
          <h3
            id={`blog-post-title-${post.id}`}
            className="font-['Public_Sans',sans-serif] font-medium text-[17px] leading-[1.3] tracking-[-0.01em] mb-2 text-[var(--on-surface,#181d19)] group-hover/title:text-[var(--primary)] transition-colors"
          >
            {post.title}
          </h3>
          <span
            className="material-symbols-outlined shrink-0 mt-1 opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-300"
            style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
          >
            arrow_forward
          </span>
        </Link>

        <p className="text-[13px] text-[var(--on-surface-muted,#6b7280)] leading-[1.55] mb-[14px] line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-2 pt-[14px] border-t border-[var(--border,#e5e7eb)]">
          {post.authorImage ? (
            <img
              src={post.authorImage}
              alt={displayName || ''}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0"
              style={{ background: 'hsl(var(--primary))' }}
            >
              {authorInitial}
            </div>
          )}
          <span className="font-['Public_Sans',sans-serif] text-[11.5px] font-medium text-[var(--on-surface,#181d19)]">
            {displayName}
          </span>
          <span className="ml-auto text-[10.5px] text-[var(--on-surface-muted,#6b7280)] font-medium font-['Public_Sans',sans-serif]">
            {formattedDate}
          </span>
        </div>
      </div>
    </article>
  )
}
