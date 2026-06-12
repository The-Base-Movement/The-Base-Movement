interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingTop: 8,
      }}
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="btn btn-outline btn-sm"
        style={{ justifyContent: 'center', opacity: currentPage === 1 ? 0.4 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          chevron_left
        </span>
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          style={{ minWidth: 34, justifyContent: 'center' }}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="btn btn-outline btn-sm"
        style={{ justifyContent: 'center', opacity: currentPage === totalPages ? 0.4 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          chevron_right
        </span>
      </button>
    </div>
  )
}
