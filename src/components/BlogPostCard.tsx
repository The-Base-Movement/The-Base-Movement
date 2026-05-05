import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/types/admin'

interface BlogPostCardProps {
  post: BlogPost
  baseUrl: string
  categoryColors: Record<string, string>
}

export function BlogPostCard({ post, baseUrl, categoryColors }: BlogPostCardProps) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <article className="bg-white border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="h-44 overflow-hidden bg-stone-100">
        {post.imageUrl ? (
          <img src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
           decoding="async" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">The Base</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${categoryColors[post.category] ?? 'bg-stone-100 text-stone-500'}`}>
            {post.category}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formattedDate}</span>
        </div>
        <Link to={`${baseUrl}/${post.slug}`}>
          <h3 className="text-sm font-bold text-charcoal-dark uppercase tracking-tight leading-tight mb-3 hover:text-brand-green transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-slate-500 text-xs leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            {post.authorName} · {post.readTime}
          </span>
          <Link
            to={`${baseUrl}/${post.slug}`}
            className="text-[9px] font-bold text-brand-green uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Read
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}
