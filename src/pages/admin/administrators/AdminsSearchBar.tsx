import { SortToggle } from '@/components/ui/SortToggle'

interface AdminsSearchBarProps {
  searchTerm: string
  onChange: (val: string) => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (val: 'asc' | 'desc') => void
}

export function AdminsSearchBar({
  searchTerm,
  onChange,
  sortOrder,
  onSortChange,
}: AdminsSearchBarProps) {
  return (
    <div className="panel">
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <label htmlFor="input-2deddd" style={{ display: 'none' }}>
              Filter by name, ID or role…
            </label>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Filter by name, ID or role…"
              name="searchTerm"
              id="input-2deddd"
              type="text"
              placeholder="Filter by name, ID or role…"
              value={searchTerm}
              onChange={(e) => onChange(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                borderRadius: 4,
                boxSizing: 'border-box',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>
          <SortToggle value={sortOrder} onChange={onSortChange} />
        </div>
      </div>
    </div>
  )
}
