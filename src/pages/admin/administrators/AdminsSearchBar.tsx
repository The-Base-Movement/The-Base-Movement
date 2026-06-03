import { SortToggle } from '@/components/ui/SortToggle'
import { ROLE_FILTER_OPTIONS } from './roleFilterOptions'

interface AdminsSearchBarProps {
  searchTerm: string
  onChange: (val: string) => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (val: 'asc' | 'desc') => void
  roleFilter: string
  onRoleFilterChange: (val: string) => void
}

export function AdminsSearchBar({
  searchTerm,
  onChange,
  sortOrder,
  onSortChange,
  roleFilter,
  onRoleFilterChange,
}: AdminsSearchBarProps) {
  return (
    <div className="panel">
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <label htmlFor="admins-search" style={{ display: 'none' }}>
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
              id="admins-search"
              type="text"
              placeholder="Filter by name or ID…"
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
                borderRadius: 'var(--radius-sm)',
                boxSizing: 'border-box',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>

          {/* Role filter dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: roleFilter ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              manage_accounts
            </span>
            <select
              id="role-filter"
              name="roleFilter"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              style={{
                height: 38,
                paddingLeft: 32,
                paddingRight: 28,
                border: `1px solid ${roleFilter ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                background: roleFilter ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--container-low))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                borderRadius: 'var(--radius-sm)',
                boxSizing: 'border-box',
                color: roleFilter ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              expand_more
            </span>
          </div>

          {/* Clear role filter pill — shown when a role is active */}
          {roleFilter && (
            <button
              onClick={() => onRoleFilterChange('')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 38,
                padding: '0 10px',
                border: '1px solid hsl(var(--primary) / 0.3)',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--primary) / 0.06)',
                color: 'hsl(var(--primary))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                close
              </span>
              Clear
            </button>
          )}

          <SortToggle value={sortOrder} onChange={onSortChange} />
        </div>
      </div>
    </div>
  )
}
