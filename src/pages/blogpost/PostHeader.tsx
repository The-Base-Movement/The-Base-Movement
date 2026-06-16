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
        <span
          className="px-3 py-1 text-xs font-medium tracking-tight"
          style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
        >
          {category}
        </span>
        <div
          className="flex items-center gap-4 text-xs font-medium tracking-tight"
          style={{ color: 'hsl(var(--on-surface-muted))' }}
        >
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

      <h1
        className="leading-[1.1] tracking-tighter mb-0"
        style={{ color: 'hsl(var(--on-surface))' }}
      >
        {title}
      </h1>

      <p
        className="leading-relaxed font-medium italic pl-6 py-2 mb-0"
        style={{
          color: 'hsl(var(--on-surface-muted))',
          borderLeft: '4px solid hsl(var(--accent))',
        }}
      >
        {excerpt}
      </p>
    </header>
  )
}
