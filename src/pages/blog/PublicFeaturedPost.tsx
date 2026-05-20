import { Link } from 'react-router-dom'
import type { BlogPost } from '@/services/adminService'

interface PublicFeaturedPostProps {
  post: BlogPost
  baseUrl: string
  logoUrl: string
}

export function PublicFeaturedPost({ post, baseUrl, logoUrl }: PublicFeaturedPostProps) {
  return (
    <section className="mb-16">
      <p className="font-meta text-xs text-warm-gold tracking-tight mb-6">Featured</p>
      <div className="grid md:grid-cols-2 gap-0 bg-white border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="h-64 md:h-auto overflow-hidden bg-stone-100">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              decoding="async"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative">
              <img src={logoUrl} alt="The Base" className="w-16 h-16 opacity-20 mb-4 grayscale" />
              <span className="text-micro font-bold text-white/20 tracking-tight">
                The Base Editorial
              </span>
            </div>
          )}
        </div>
        <div className="p-6 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-sm text-micro font-bold tracking-tight border bg-stone-50 text-stone-500 border-stone-100">
              {post.category}
            </span>
            <span className="mx-2 text-stone-300 opacity-50">|</span>
            <span className="text-xs text-slate-400 font-meta font-medium">
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
            <h2 className="text-xl md:text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-4 hover:text-brand-green transition-colors">
              {post.title}
            </h2>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{post.excerpt}</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-micro font-medium text-stone-400 tracking-tight">
              {post.authorName?.toUpperCase() === 'ADMIN' ? 'The Base Editorial' : post.authorName}{' '}
              <span className="mx-2 opacity-50">|</span> {post.readTime}
            </div>
            <Link
              to={`${baseUrl}/${post.slug}`}
              className="flex items-center gap-2 text-brand-green font-bold text-xs hover:underline"
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
