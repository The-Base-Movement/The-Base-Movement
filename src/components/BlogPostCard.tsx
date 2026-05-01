import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface AuthorProfile {
  name: string
  role: string
  bio: string
  image: string
}

interface BlogPost {
  id: number
  category: string
  date: string
  title: string
  excerpt: string
  author: string
  authorProfile?: AuthorProfile
  readTime: string
  image: string
}

interface BlogPostCardProps {
  post: BlogPost
  baseUrl: string
  slugify: (text: string) => string
  categoryColors: Record<string, string>
}

export function BlogPostCard({ post, baseUrl, slugify, categoryColors }: BlogPostCardProps) {
  return (
    <article
      className="bg-white border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full"
    >
      <div className="h-44 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${categoryColors[post.category] ?? ''}`}>
            {post.category}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{post.date}</span>
        </div>
        <Link to={`${baseUrl}/${slugify(post.title)}`}>
          <h3 className="text-sm font-bold text-charcoal-dark uppercase tracking-tight leading-tight mb-3 hover:text-brand-green transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-slate-500 text-xs leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            {post.authorProfile?.name || post.author} · {post.readTime}
          </span>
          <Link
            to={`${baseUrl}/${slugify(post.title)}`}
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
