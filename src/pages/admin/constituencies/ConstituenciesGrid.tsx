import { useNavigate } from 'react-router-dom'
import type { Constituency } from '@/types/admin'
import { SortToggle } from '@/components/ui/SortToggle'
import { Pagination } from '@/components/Pagination'
import { isConstituencyVerified } from '@/lib/leadStatus'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
}

interface ConstituenciesGridProps {
  currentConstituencies: Constituency[]
  filteredConstituencies: Constituency[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  loading: boolean
  search: string
  regionFilter: string
  regionOptions: string[]
  sortField: 'name' | 'members'
  sortOrder: 'asc' | 'desc'
  canManage: boolean
  onSearchChange: (val: string) => void
  onRegionFilterChange: (val: string) => void
  onSortFieldChange: (val: 'name' | 'members') => void
  onSortOrderChange: (val: 'asc' | 'desc') => void
  onPageChange: (page: number) => void
  onOpenAddModal: () => void
  onEditConstituency: (c: Constituency) => void
  onDeleteConstituency: (c: Constituency) => void
}

export function ConstituenciesGrid({
  currentConstituencies,
  filteredConstituencies,
  currentPage,
  totalPages,
  itemsPerPage,
  loading,
  search,
  regionFilter,
  regionOptions,
  sortField,
  sortOrder,
  canManage,
  onSearchChange,
  onRegionFilterChange,
  onSortFieldChange,
  onSortOrderChange,
  onPageChange,
  onOpenAddModal,
  onEditConstituency,
  onDeleteConstituency,
}: ConstituenciesGridProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* Search + filter */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
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
            aria-label="Search constituencies by name or region"
            name="search"
            id="constituency-search"
            type="text"
            placeholder="Search constituencies or regions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: 34 }}
          />
        </div>
        <label htmlFor="constituency-region-filter" style={{ display: 'none' }}>
          Filter by region
        </label>
        <select
          name="regionFilter"
          id="constituency-region-filter"
          value={regionFilter}
          onChange={(e) => onRegionFilterChange(e.target.value)}
          style={{ ...fieldStyle, width: 175, appearance: 'none' as const, flexShrink: 0 }}
        >
          {regionOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <label htmlFor="constituency-sort-field" style={{ display: 'none' }}>
          Sort field
        </label>
        <select
          name="sortField"
          id="constituency-sort-field"
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as 'name' | 'members')}
          style={{ ...fieldStyle, width: 130, appearance: 'none' as const, flexShrink: 0 }}
        >
          <option value="name">Name</option>
          <option value="members">Members</option>
        </select>
        <SortToggle
          value={sortOrder}
          onChange={onSortOrderChange}
          label={sortField === 'members' ? 'Members' : 'A–Z'}
        />
      </div>

      {/* Constituency cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {loading ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 24,
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Loading...
          </div>
        ) : currentConstituencies.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: 24,
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            No constituencies found.
          </div>
        ) : (
          currentConstituencies.map((c) => {
            const hasLead = isConstituencyVerified(c)
            return (
              <div key={c.id} className="panel">
                <div
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    background: hasLead ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    boxShadow: 'inset 0 -2px 10px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-normal, 400)',
                        color: hasLead ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        fontFamily: "'Public Sans', sans-serif",
                        marginBottom: 3,
                      }}
                    >
                      ID: {String(c.id).slice(0, 8)}
                    </div>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: hasLead ? '#fff' : '#000',
                        lineHeight: 1.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </h4>
                  </div>
                  <span
                    className={`pill ${hasLead ? 'pill-ok' : 'pill-warn'}`}
                    style={{
                      flexShrink: 0,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                    }}
                  >
                    {hasLead ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        marginBottom: 3,
                      }}
                    >
                      Region
                    </div>
                    <b
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {c.regionName}
                    </b>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        marginBottom: 3,
                      }}
                    >
                      Members
                    </div>
                    <b
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, color: 'hsl(var(--primary))' }}
                      >
                        group
                      </span>
                      {(c.memberCount || 0).toLocaleString()}
                    </b>
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px 14px 10px',
                    fontSize: 11,
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {c.leaderName ?? <span style={{ fontStyle: 'italic' }}>No coordinator</span>}
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderTop: '1px solid hsl(var(--border))',
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                    onClick={() => navigate(`/admin/constituencies/${c.id}`)}
                  >
                    View
                  </button>
                  {canManage && (
                    <>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                        onClick={() => onEditConstituency(c)}
                      >
                        Configure
                      </button>
                      <button
                        className="btn btn-dest btn-sm"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                        onClick={() => onDeleteConstituency(c)}
                      >
                        Decommission
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Add new constituency card */}
        {canManage && !loading && (
          <div
            className="panel"
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '30px 14px',
              border: '1px dashed hsl(var(--border))',
              minHeight: 140,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onClick={onOpenAddModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'hsl(var(--primary))'
              e.currentTarget.style.background = 'rgba(0,107,63,.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'hsl(var(--border))'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 28, color: 'hsl(var(--primary))' }}
            >
              add_circle
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--primary))',
              }}
            >
              Define new constituency
            </span>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={filteredConstituencies.length}
        pageSize={itemsPerPage}
      />
    </>
  )
}
