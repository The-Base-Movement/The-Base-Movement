interface PostHeaderProps {
  category: string
  publishedAt: string | null | undefined
  readTime: string | undefined
  title: string
  excerpt: string | undefined
}

export function PostHeader({ category, publishedAt, readTime, title, excerpt }: PostHeaderProps) {
  return (
    <header className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-micro font-bold tracking-tight">
          {category}
        </span>
        <div className="flex items-center gap-4 text-stone-400 text-micro font-bold tracking-tight">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              calendar_today
            </span>
            {publishedAt
              ? new Date(publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              schedule
            </span>
            {readTime}
          </span>
        </div>
      </div>

      <h1 className="text-stone-900 leading-[1.1] tracking-tighter mb-0">{title}</h1>

      <p className="text-stone-500 leading-relaxed font-medium italic border-l-4 border-warm-gold pl-6 py-2 mb-0">
        {excerpt}
      </p>
    </header>
  )
}
