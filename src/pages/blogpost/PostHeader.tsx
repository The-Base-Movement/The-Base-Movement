interface PostHeaderProps {
  category: string
  publishedAt: string | null | undefined
  readTime: string | undefined
  title: string
  excerpt: string | undefined
  /**
   * Colour for the category chip and the excerpt rule. Defaults to the party
   * brand green and gold. The Youth Wing passes its teal, because a header in
   * party colours on a page written for 14-17s reads as party membership --
   * which is the one thing the youth track is not. The colours are set inline
   * (an inline style beats any :hover or scoped rule), so this has to be a prop
   * rather than a CSS override.
   */
  accent?: string
}

export function PostHeader({
  category,
  publishedAt,
  readTime,
  title,
  excerpt,
  accent,
}: PostHeaderProps) {
  const chip = accent ?? 'hsl(var(--primary))'
  const rule = accent ?? 'hsl(var(--accent))'
  return (
    <header className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <span
          className="px-3 py-1 text-xs font-medium tracking-tight"
          style={{ background: `color-mix(in srgb, ${chip} 10%, transparent)`, color: chip }}
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
          borderLeft: `4px solid ${rule}`,
        }}
      >
        {excerpt}
      </p>
    </header>
  )
}
