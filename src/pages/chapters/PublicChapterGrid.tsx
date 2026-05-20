import { cn } from '@/lib/utils'
import { type Chapter } from '@/types/admin'
import { ChapterCard } from '@/components/ChapterCard'

interface PublicChapterGridProps {
  paginatedChapters: Chapter[]
  filteredTotal: number
  userChapterName: string | null
  totalPages: number
  currentPage: number
  onClearSearch: () => void
  onPageChange: (page: number) => void
}

export function PublicChapterGrid({
  paginatedChapters,
  filteredTotal,
  userChapterName,
  totalPages,
  currentPage,
  onClearSearch,
  onPageChange,
}: PublicChapterGridProps) {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedChapters
          .filter((c) => !!c && !!c.id)
          .map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} userChapterName={userChapterName} />
          ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-12 pt-12 border-t border-stone-100 flex items-center justify-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-9 px-3 border border-stone-200 bg-white text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-brand-green hover:text-brand-green transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chevron_left
            </span>
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={cn(
                'w-9 h-9 border text-xs font-bold cursor-pointer transition-colors',
                currentPage === i + 1
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white border-stone-200 hover:border-brand-green hover:text-brand-green'
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-3 border border-stone-200 bg-white text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-brand-green hover:text-brand-green transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              chevron_right
            </span>
          </button>
        </div>
      )}
      {filteredTotal === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-stone-200">
          <span
            className="material-symbols-outlined text-stone-200 block mx-auto mb-4"
            style={{ fontSize: 48 }}
          >
            account_balance
          </span>
          <p className="text-stone-400 font-bold tracking-tight">No strategic hubs found.</p>
          <button
            onClick={onClearSearch}
            className="mt-4 text-brand-green font-bold text-xs bg-transparent border-none cursor-pointer hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
