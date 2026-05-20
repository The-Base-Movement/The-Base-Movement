interface MembersFilterBarProps {
  searchTerm: string
  sourceFilter: 'all' | 'digital' | 'scan' | 'admin'
  onSearchChange: (val: string) => void
  onSourceFilterChange: (val: 'all' | 'digital' | 'scan' | 'admin') => void
  onClearSearch: () => void
}

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All', icon: 'group' },
  { value: 'digital', label: 'Digital', icon: 'computer' },
  { value: 'scan', label: 'Scanned', icon: 'document_scanner' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
] as const

export function MembersFilterBar({
  searchTerm,
  sourceFilter,
  onSearchChange,
  onSourceFilterChange,
  onClearSearch,
}: MembersFilterBarProps) {
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div
        style={{
          padding: '10px 14px',
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
            aria-label="Search by name, ID, phone, profession, region…"
            name="searchTerm"
            id="input-0acdd0"
            type="text"
            placeholder="Search by name, ID, phone, profession, region…"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '0 12px 0 36px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12.5,
              outline: 'none',
              background: 'hsl(var(--surface))',
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
                fontWeight: 800,
                transition: 'all .15s',
                background: sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'transparent',
                borderColor:
                  sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'hsl(var(--border))',
                color: sourceFilter === opt.value ? '#fff' : 'hsl(var(--on-surface-muted))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
