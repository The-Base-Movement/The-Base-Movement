import { type Chapter } from '@/types/admin'
import { ChapterCard } from '@/components/ChapterCard'

interface DashboardChapterGridProps {
  paginatedChapters: Chapter[]
  userChapterName: string | null
  totalPages: number
  currentPage: number
  onClearSearch: () => void
  onPageChange: (page: number) => void
}

export function DashboardChapterGrid({
  paginatedChapters,
  userChapterName,
  totalPages,
  currentPage,
  onClearSearch,
  onPageChange,
}: DashboardChapterGridProps) {
  return (
    <div>
      {paginatedChapters.length === 0 ? (
        <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--on-surface-muted))',
              opacity: 0.3,
              display: 'block',
              marginBottom: 8,
            }}
          >
            account_balance
          </span>
          <p
            style={{
              margin: '0 0 12px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No chapters found matching your query.
          </p>
          <button
            className="btn btn-outline btn-sm"
            onClick={onClearSearch}
            style={{ justifyContent: 'center' }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {paginatedChapters
            .filter((c) => !!c && !!c.id)
            .map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} userChapterName={userChapterName} />
            ))}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{ justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chevron_left
            </span>
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={
                currentPage === i + 1 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
              }
              style={{ minWidth: 36, justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{ justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chevron_right
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
