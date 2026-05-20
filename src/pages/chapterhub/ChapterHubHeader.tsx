import { Link } from 'react-router-dom'
import type { Chapter } from '@/types/admin'

interface Props {
  chapter: Chapter
  slug: string
}

export function ChapterHubHeader({ chapter, slug }: Props) {
  return (
    <div className="top">
      <div>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            account_balance
          </span>
          {chapter.name}
        </h2>
        <div style={{ marginTop: 12 }}>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 8,
          }}
        >
          Chapter management hub — {chapter.city_or_region}, {chapter.country}
        </p>
      </div>
      <div className="actions">
        <Link to={`/dashboard/chapters/${slug}`} className="btn btn-outline">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            visibility
          </span>
          Public view
        </Link>
      </div>
    </div>
  )
}
