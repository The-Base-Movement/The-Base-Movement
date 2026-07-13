interface DashboardMobileFilterToggleProps {
  onOpenFilters: () => void
  onRequestChapter: () => void
}

export function DashboardMobileFilterToggle({
  onOpenFilters,
  onRequestChapter,
}: DashboardMobileFilterToggleProps) {
  return (
    <div className="mobile-only" style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
      <button
        className="btn btn-outline"
        style={{ flex: 1, justifyContent: 'center' }}
        onClick={onOpenFilters}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          filter_list
        </span>
        Filter &amp; Search
      </button>
      <button
        className="btn btn-primary"
        style={{ flex: 1, justifyContent: 'center' }}
        onClick={onRequestChapter}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          add
        </span>
        Start a Community
      </button>
    </div>
  )
}
