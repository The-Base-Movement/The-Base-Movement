import { SortToggle } from '@/components/ui/SortToggle'

type SearchType = 'default' | 'constituency' | 'polling_station'

interface MembersFilterBarProps {
  searchTerm: string
  searchType: SearchType
  sourceFilter: 'all' | 'digital' | 'scan' | 'admin'
  sortOrder: 'asc' | 'desc'
  onSearchChange: (val: string) => void
  onSearchTypeChange: (val: SearchType) => void
  onSourceFilterChange: (val: 'all' | 'digital' | 'scan' | 'admin') => void
  onSortChange: (next: 'asc' | 'desc') => void
  onClearSearch: () => void
}

const SEARCH_TYPE_OPTIONS: {
  value: SearchType
  label: string
  placeholder: string
  icon: string
}[] = [
  {
    value: 'default',
    label: 'Name / ID / Phone',
    placeholder: 'Search by name, ID or phone…',
    icon: 'person_search',
  },
  {
    value: 'constituency',
    label: 'Constituency',
    placeholder: 'Search by constituency…',
    icon: 'location_city',
  },
  {
    value: 'polling_station',
    label: 'Polling Station',
    placeholder: 'Search by polling station code…',
    icon: 'how_to_vote',
  },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All', icon: 'group' },
  { value: 'digital', label: 'Digital', icon: 'computer' },
  { value: 'scan', label: 'Scanned', icon: 'document_scanner' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
] as const

export function MembersFilterBar({
  searchTerm,
  searchType,
  sourceFilter,
  sortOrder,
  onSearchChange,
  onSearchTypeChange,
  onSourceFilterChange,
  onSortChange,
  onClearSearch,
}: MembersFilterBarProps) {
  const activeOption =
    SEARCH_TYPE_OPTIONS.find((o) => o.value === searchType) ?? SEARCH_TYPE_OPTIONS[0]

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      {/* Search type selector */}
      <div
        style={{
          padding: '10px 14px 0',
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {SEARCH_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSearchTypeChange(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              height: 28,
              padding: '0 10px',
              borderRadius: 4,
              border: '1px solid',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              background: searchType === opt.value ? 'hsl(var(--primary))' : 'transparent',
              borderColor: searchType === opt.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              color: searchType === opt.value ? '#fff' : 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {opt.icon}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '8px 14px 10px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 17,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            aria-label={activeOption.placeholder}
            name="member-search"
            id="member-search"
            type="text"
            placeholder={activeOption.placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '0 12px 0 36px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12.5,
              outline: 'none',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
        {searchTerm && (
          <button className="btn btn-ghost btn-sm" onClick={onClearSearch}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              close
            </span>
            Clear
          </button>
        )}
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            marginLeft: 'auto',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSourceFilterChange(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 4,
                  border: '1px solid',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  transition: 'all .15s',
                  background: sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'transparent',
                  borderColor:
                    sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'hsl(var(--border))',
                  color:
                    sourceFilter === opt.value
                      ? 'hsl(var(--background))'
                      : 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
          <SortToggle value={sortOrder} onChange={onSortChange} />
        </div>
      </div>
    </div>
  )
}
