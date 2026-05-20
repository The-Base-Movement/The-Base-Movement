import { STATUS_CONFIG } from './utils'
import type { Order } from '@/services/adminService'

interface OrdersFiltersProps {
  search: string
  setSearch: (s: string) => void
  statusFilter: Order['status'] | 'ALL'
  setStatusFilter: (s: Order['status'] | 'ALL') => void
}

export function OrdersFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: OrdersFiltersProps) {
  return (
    <>
      <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative' }}>
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
            id="input-3a7bb6"
            type="text"
            placeholder="Search manifest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 36,
              paddingRight: 16,
              height: 36,
              width: 256,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              outline: 'none',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 4,
              boxSizing: 'border-box',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <select
            name="statusFilter"
            id="select-736283"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Order['status'] | 'ALL')}
            style={{
              height: 36,
              padding: '0 32px 0 12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--background))',
              outline: 'none',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 4,
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
      </div>

      {/* Mobile Filter & Search Bar — Step 5 Compliance */}
      <div
        className="mobile-only"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'hsl(var(--container-low))',
        }}
      >
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            aria-label="Search manifest"
            name="search"
            id="input-b2d7a3"
            type="text"
            placeholder="Search manifest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: 34,
              paddingLeft: 30,
              boxSizing: 'border-box',
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            className={`pill ${statusFilter === 'ALL' ? 'pill-ok' : 'pill-mute'}`}
            style={{ flexShrink: 0 }}
            onClick={() => setStatusFilter('ALL')}
          >
            All Statuses
          </button>
          {(Object.keys(STATUS_CONFIG) as Order['status'][]).map((s) => (
            <button
              key={s}
              className={`pill ${statusFilter === s ? 'pill-ok' : 'pill-mute'}`}
              style={{ flexShrink: 0 }}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
