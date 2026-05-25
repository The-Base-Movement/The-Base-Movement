import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-8 pt-8 border-t border-stone-100 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 px-3 border border-border rounded-sm text-xs font-medium cursor-pointer disabled:opacity-30 hover:border-primary hover:text-primary transition-colors bg-white"
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
            'w-9 h-9 border rounded-sm text-xs font-medium cursor-pointer transition-colors',
            currentPage === i + 1
              ? 'bg-on-surface text-white border-on-surface'
              : 'bg-white border-border hover:border-primary hover:text-primary'
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-9 px-3 border border-border rounded-sm text-xs font-medium cursor-pointer disabled:opacity-30 hover:border-primary hover:text-primary transition-colors bg-white"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          chevron_right
        </span>
      </button>
    </div>
  )
}
