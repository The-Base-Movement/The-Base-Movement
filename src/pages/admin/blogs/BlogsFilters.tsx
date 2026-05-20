/**
 * blogs/BlogsFilters.tsx
 * ─────────────────────────────────────────────────────────────────
 * Desktop-only sticky sidebar with search + status + category filters.
 * Hidden on mobile — use MobileFilterSheet for small screens.
 *
 * Props:
 *  searchQuery / setSearchQuery   — free-text post search
 *  statusFilter / setStatusFilter — Published | Pending Verification | Draft | all
 *  categoryFilter / setCategoryFilter — CATEGORIES list or 'all'
 */

import { selectSt, labelSt } from './styles'
import { CATEGORIES } from './constants'

interface BlogsFiltersProps {
  searchQuery: string
  setSearchQuery: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  categoryFilter: string
  setCategoryFilter: (v: string) => void
}

export function BlogsFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
}: BlogsFiltersProps) {
  return (
    <aside className="desktop-only panel h-fit sticky top-20">
      {/* Panel header */}
      <div className="ph">
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
          >
            filter_list
          </span>
          Intelligence filters
        </span>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Search */}
        <div>
          <label htmlFor="input-bbba95" style={labelSt}>
            Search feed
          </label>
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Keywords…"
              name="searchQuery"
              id="input-bbba95"
              type="text"
              placeholder="Keywords…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...selectSt, paddingLeft: 34 }}
            />
          </div>
        </div>

        {/* Status filter */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
          <label htmlFor="select-0a8b07" style={labelSt}>
            Status
          </label>
          <select
            name="statusFilter"
            id="select-0a8b07"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectSt}
          >
            <option value="all">All statuses</option>
            <option value="Published">Published</option>
            <option value="Pending Verification">Pending</option>
            <option value="Draft">Drafts</option>
          </select>
        </div>

        {/* Category filter */}
        <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
          <label htmlFor="select-339e1e" style={labelSt}>
            Category
          </label>
          <select
            name="categoryFilter"
            id="select-339e1e"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={selectSt}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  )
}
