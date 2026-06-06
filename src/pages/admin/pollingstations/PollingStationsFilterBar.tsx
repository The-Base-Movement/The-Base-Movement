import { selectStyle, inputStyle } from './utils'
import { SortToggle } from '@/components/ui/SortToggle'

interface PollingStationsFilterBarProps {
  selectedRegion: string
  setSelectedRegion: (v: string) => void
  selectedConstituency: string
  setSelectedConstituency: (v: string) => void
  regions: { id: string; name: string }[]
  filteredConstituencies: { id: string; region_id: string; name: string }[]
  searchInput: string
  setSearchInput: (v: string) => void
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  setSearch: (v: string) => void
  hasFilters: boolean
  handleClearFilters: () => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (next: 'asc' | 'desc') => void
}

export function PollingStationsFilterBar({
  selectedRegion,
  setSelectedRegion,
  selectedConstituency,
  setSelectedConstituency,
  regions,
  filteredConstituencies,
  searchInput,
  setSearchInput,
  handleSearchKeyDown,
  setSearch,
  hasFilters,
  handleClearFilters,
  sortOrder,
  onSortChange,
}: PollingStationsFilterBarProps) {
  return (
    <div
      style={{
        padding: '12px 18px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Region select */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 160px' }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: 8,
            fontSize: 15,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          map
        </span>
        <select
          id="ps-region-filter"
          name="ps-region-filter"
          aria-label="Filter by region"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{ ...selectStyle, width: '100%' }}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            right: 8,
            fontSize: 14,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
          }}
        >
          expand_more
        </span>
      </div>

      {/* Constituency select */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 160px' }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: 8,
            fontSize: 15,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          location_city
        </span>
        <select
          id="ps-constituency-filter"
          name="ps-constituency-filter"
          aria-label="Filter by constituency"
          value={selectedConstituency}
          onChange={(e) => setSelectedConstituency(e.target.value)}
          disabled={!selectedRegion}
          style={{ ...selectStyle, width: '100%', opacity: selectedRegion ? 1 : 0.5 }}
        >
          <option value="">All constituencies</option>
          {filteredConstituencies.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            right: 8,
            fontSize: 14,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
          }}
        >
          expand_more
        </span>
      </div>

      {/* Search input */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '2 1 200px' }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: 8,
            fontSize: 15,
            color: 'hsl(var(--on-surface-muted))',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          search
        </span>
        <input
          id="ps-search"
          name="ps-search"
          type="text"
          aria-label="Search polling stations by code, name or community"
          placeholder="Search code, name, community…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={() => setSearch(searchInput)}
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <SortToggle value={sortOrder} onChange={onSortChange} />

      {hasFilters && (
        <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            close
          </span>
          Clear filters
        </button>
      )}
    </div>
  )
}
