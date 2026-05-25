import { Link } from 'react-router-dom'
import type { Chapter } from '@/services/adminService'
import { adminService } from '@/services/adminService'

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
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

interface ChaptersGridProps {
  currentChapters: Chapter[]
  filteredChapters: Chapter[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  search: string
  statusFilter: 'All' | 'Active' | 'Pending'
  networkFilter: 'All' | 'Ghana' | 'Diaspora'
  regionFilter: string
  availableRegions: string[]
  onSearchChange: (val: string) => void
  onStatusFilterChange: (val: 'All' | 'Active' | 'Pending') => void
  onNetworkFilterChange: (val: 'All' | 'Ghana' | 'Diaspora') => void
  onRegionFilterChange: (val: string) => void
  onPageChange: (page: number) => void
  onOpenAddModal: () => void
  onOpenEditModal: (chapter: Chapter) => void
  onOpenPollManageModal: (chapter: Chapter) => void
  onVerifyChapter: (id: string, name: string) => void
  onDeleteChapter: (id: string, name: string) => void
}

export function ChaptersGrid({
  currentChapters,
  filteredChapters,
  currentPage,
  totalPages,
  itemsPerPage,
  search,
  statusFilter,
  networkFilter,
  regionFilter,
  availableRegions,
  onSearchChange,
  onStatusFilterChange,
  onNetworkFilterChange,
  onRegionFilterChange,
  onPageChange,
  onOpenAddModal,
  onOpenEditModal,
  onOpenPollManageModal,
  onVerifyChapter,
  onDeleteChapter,
}: ChaptersGridProps) {
  return (
    <>
      {/* Search + filter - Desktop */}
      <div className="desktop-only" style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
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
            aria-label="Search chapters by name or region"
            name="search"
            id="input-f2d090"
            type="text"
            placeholder="Search chapters by name or region..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ ...fieldStyle, paddingLeft: 34 }}
          />
        </div>
        <label htmlFor="select-b86bb7" style={{ display: 'none' }}>
          Filter by status
        </label>
        <select
          name="statusFilter"
          id="select-b86bb7"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as 'All' | 'Active' | 'Pending')}
          style={{ ...fieldStyle, width: 150, appearance: 'none' as const }}
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
        <label htmlFor="select-network" style={{ display: 'none' }}>
          Filter by network
        </label>
        <select
          name="networkFilter"
          id="select-network"
          value={networkFilter}
          onChange={(e) => {
            onNetworkFilterChange(e.target.value as 'All' | 'Ghana' | 'Diaspora')
          }}
          style={{ ...fieldStyle, width: 175, appearance: 'none' as const }}
        >
          <option value="All">All networks</option>
          <option value="Ghana">Ghana Network</option>
          <option value="Diaspora">Diaspora Network</option>
        </select>
        {networkFilter === 'Ghana' && (
          <>
            <label htmlFor="select-region" style={{ display: 'none' }}>
              Filter by region
            </label>
            <select
              name="regionFilter"
              id="select-region"
              value={regionFilter}
              onChange={(e) => onRegionFilterChange(e.target.value)}
              style={{ ...fieldStyle, width: 175, appearance: 'none' as const }}
            >
              <option value="">All regions</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Search + filter - Mobile */}
      <div
        className="mobile-only"
        style={{
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'hsl(var(--container-low))',
          padding: '12px',
          borderRadius: 6,
          border: '1px solid hsl(var(--border))',
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
            }}
          >
            search
          </span>
          <input
            aria-label="Search chapters"
            name="search"
            id="input-cdadcc"
            style={{
              ...fieldStyle,
              width: '100%',
              height: 38,
              paddingLeft: 30,
              boxSizing: 'border-box',
            }}
            placeholder="Search chapters..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {(['All', 'Active', 'Pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`btn btn-sm ${statusFilter === status ? 'btn-dest' : 'btn-outline'}`}
              style={{ flexShrink: 0, fontSize: 10, height: 26 }}
            >
              {status}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <label htmlFor="select-network-mob" style={{ display: 'none' }}>
            Filter by network
          </label>
          <select
            name="networkFilter-mob"
            id="select-network-mob"
            value={networkFilter}
            onChange={(e) => {
              onNetworkFilterChange(e.target.value as 'All' | 'Ghana' | 'Diaspora')
            }}
            style={{
              ...fieldStyle,
              flex: 1,
              appearance: 'none' as const,
              fontSize: 12,
              height: 36,
            }}
          >
            <option value="All">All networks</option>
            <option value="Ghana">Ghana Network</option>
            <option value="Diaspora">Diaspora Network</option>
          </select>
          {networkFilter === 'Ghana' && (
            <>
              <label htmlFor="select-region-mob" style={{ display: 'none' }}>
                Filter by region
              </label>
              <select
                name="regionFilter-mob"
                id="select-region-mob"
                value={regionFilter}
                onChange={(e) => onRegionFilterChange(e.target.value)}
                style={{
                  ...fieldStyle,
                  flex: 1,
                  appearance: 'none' as const,
                  fontSize: 12,
                  height: 36,
                }}
              >
                <option value="">All regions</option>
                {availableRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Chapters grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {currentChapters.length > 0
          ? currentChapters.map((chapter) => {
              if (!chapter || !chapter.id) return null
              return (
                <div key={chapter.id} className="panel">
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom:
                        chapter.status === 'Active' ? 'none' : '1px solid hsl(var(--border))',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 8,
                      background:
                        chapter.status === 'Active' ? 'hsl(var(--accent))' : 'transparent',
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                      boxShadow:
                        chapter.status === 'Active' ? 'inset 0 -2px 10px rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-normal, 400)',
                          color:
                            chapter.status === 'Active'
                              ? 'rgba(0,0,0,0.6)'
                              : 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          marginBottom: 3,
                        }}
                      >
                        ID: {chapter.id?.slice(0, 8) || 'N/A'}
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontFamily: "'Public Sans', sans-serif",
                          color: chapter.status === 'Active' ? '#000' : 'hsl(var(--on-surface))',
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {chapter.flag_url && (
                          <img
                            src={chapter.flag_url}
                            alt={chapter.country}
                            style={{
                              marginRight: 6,
                              height: 13,
                              width: 'auto',
                              verticalAlign: 'middle',
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {chapter.name}
                      </h4>
                    </div>
                    <span
                      className={`pill ${chapter.status === 'Active' ? 'pill-primary' : 'pill-mute'}`}
                      style={{
                        flexShrink: 0,
                        background: chapter.status === 'Active' ? '#000' : undefined,
                        color: chapter.status === 'Active' ? '#fff' : undefined,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 9,
                      }}
                    >
                      {chapter.status}
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
                        Regional hub
                      </div>
                      <b
                        style={{
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontFamily: "'Public Sans', sans-serif",
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {chapter.city_or_region}
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
                        Strength
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
                        {(chapter.member_count || 0).toLocaleString()}
                      </b>
                    </div>
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
                    <Link
                      to={`/admin/chapter-hub/${chapter.id}`}
                      className="btn btn-outline btn-sm"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        fontSize: 11,
                        textDecoration: 'none',
                      }}
                    >
                      Hub
                    </Link>
                    {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                      <>
                        {chapter.status !== 'Active' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                            onClick={() => onVerifyChapter(chapter.id, chapter.name)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              verified
                            </span>
                            Verify
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                          onClick={() => onOpenEditModal(chapter)}
                        >
                          Configure
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                          onClick={() => onOpenPollManageModal(chapter)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            how_to_vote
                          </span>
                          Poll
                        </button>
                        <button
                          className="btn btn-dest btn-sm"
                          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                          onClick={() => onDeleteChapter(chapter.id, chapter.name)}
                        >
                          Decommission
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          : null}

        {/* Add new chapter card */}
        {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
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
              e.currentTarget.style.background = '#fff'
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
              Add new chapter
            </span>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="pagination-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
            }}
          >
            Showing {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredChapters.length)} of{' '}
            {filteredChapters.length} chapters
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                chevron_left
              </span>
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${currentPage === i + 1 ? 'btn-dest' : 'btn-outline'}`}
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
