interface FilterState {
  action: string
  status: string
  dateFrom: string
  dateTo: string
}

interface AuditLogsFilterBarProps {
  filters: FilterState
  actions: string[]
  onFilterChange: (key: keyof FilterState, value: string) => void
  onClearFilters: () => void
}

const selectSt: React.CSSProperties = {
  height: 32,
  padding: '0 8px',
  borderRadius: 4,
  border: '1px solid hsl(var(--border))',
  fontSize: 11.5,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  boxSizing: 'border-box',
}

const inputSt: React.CSSProperties = {
  height: 32,
  padding: '0 8px',
  borderRadius: 4,
  border: '1px solid hsl(var(--border))',
  fontSize: 11.5,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  boxSizing: 'border-box',
}

export function AuditLogsFilterBar({
  filters,
  actions,
  onFilterChange,
  onClearFilters,
}: AuditLogsFilterBarProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="panel" style={{ marginBottom: 20, padding: '14px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              marginBottom: 6,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Action
          </label>
          <select
            value={filters.action}
            onChange={(e) => onFilterChange('action', e.target.value)}
            style={selectSt}
          >
            <option value="">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              marginBottom: 6,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            style={selectSt}
          >
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
            <option value="Warning">Warning</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              marginBottom: 6,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            style={inputSt}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              marginBottom: 6,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            style={inputSt}
          />
        </div>

        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClearFilters}
              style={{ width: '100%' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                close
              </span>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
