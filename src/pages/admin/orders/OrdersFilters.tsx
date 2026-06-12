import { STATUS_CONFIG } from './utils'
import type { Order } from '@/services/adminService'
import { SortToggle } from '@/components/ui/SortToggle'

interface OrdersFiltersProps {
  search: string
  setSearch: (s: string) => void
  statusFilter: Order['status'] | 'ALL'
  setStatusFilter: (s: Order['status'] | 'ALL') => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (v: 'asc' | 'desc') => void
}

export function OrdersFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortOrder,
  onSortChange,
}: OrdersFiltersProps) {
  return (
    <div
      className="desktop-only"
      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
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
          aria-label="Search manifest"
          name="search"
          id="orders-search"
          type="text"
          placeholder="Search manifest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            paddingLeft: 36,
            paddingRight: 16,
            height: 36,
            width: '100%',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
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

      <div style={{ position: 'relative' }}>
        <select
          aria-label="Filter by status"
          name="statusFilter"
          id="orders-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
          style={{
            height: 36,
            padding: '0 32px 0 12px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--background))',
            outline: 'none',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            appearance: 'none',
            boxSizing: 'border-box',
          }}
        >
          <option value="ALL">All Statuses</option>
          {(Object.keys(STATUS_CONFIG) as Order['status'][]).map((s) => (
            <option key={s} value={s}>
              {s}
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
            fontSize: 16,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
          }}
        >
          expand_more
        </span>
      </div>

      <SortToggle value={sortOrder} onChange={onSortChange} />
    </div>
  )
}
