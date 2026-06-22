interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const maxVisible = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const endPage = Math.min(totalPages, startPage + maxVisible - 1)
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        borderTop: '1px solid hsl(var(--border))',
        flexWrap: 'wrap',
      }}
    >
      {totalItems !== undefined && pageSize !== undefined && (
        <span
          style={{
            flex: 1,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of{' '}
          {totalItems}
        </span>
      )}
      {totalItems === undefined && <div style={{ flex: 1 }} />}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="btn btn-outline btn-sm"
        style={{ height: 28, padding: '0 8px', opacity: currentPage === 1 ? 0.4 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          chevron_left
        </span>
      </button>
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="btn btn-outline btn-sm"
            style={{ minWidth: 28, height: 28, justifyContent: 'center' }}
          >
            1
          </button>
          {startPage > 2 && (
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              …
            </span>
          )}
        </>
      )}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          style={{ minWidth: 28, height: 28, justifyContent: 'center' }}
        >
          {page}
        </button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              …
            </span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="btn btn-outline btn-sm"
            style={{ minWidth: 28, height: 28, justifyContent: 'center' }}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="btn btn-outline btn-sm"
        style={{ height: 28, padding: '0 8px', opacity: currentPage === totalPages ? 0.4 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          chevron_right
        </span>
      </button>
      {totalItems === undefined && (
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            marginLeft: 4,
          }}
        >
          {currentPage} / {totalPages}
        </span>
      )}
    </div>
  )
}
