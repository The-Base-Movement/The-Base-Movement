import VerificationListCard from '@/components/admin/VerificationListCard'
import { statusPill, PAGE_SIZE, STATUS_OPTIONS } from './utils'
import type { PendingVerification } from '@/services/adminService'
import { Skeleton } from '@/components/states'
import { SortToggle } from '@/components/ui/SortToggle'
import { Pagination } from '@/components/Pagination'

interface VerificationQueueProps {
  loading: boolean
  search: string
  handleSearch: (val: string) => void
  statusFilter: PendingVerification['status'] | 'All'
  handleFilter: (val: PendingVerification['status'] | 'All') => void
  constituencyFilter: string
  setConstituencyFilter: (val: string) => void
  constituencies: string[]
  countryFilter: string
  setCountryFilter: (val: string) => void
  countries: string[]
  filtered: PendingVerification[]
  paginated: PendingVerification[]
  selectedMember: PendingVerification | null
  setSelectedMember: (m: PendingVerification | null) => void
  setAiResult: (res: null) => void
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  safePage: number
  sortOrder: 'asc' | 'desc'
  onSortChange: (next: 'asc' | 'desc') => void
}

export function VerificationQueue({
  loading,
  search,
  handleSearch,
  statusFilter,
  handleFilter,
  constituencyFilter,
  setConstituencyFilter,
  constituencies,
  countryFilter,
  setCountryFilter,
  countries,
  filtered,
  paginated,
  selectedMember,
  setSelectedMember,
  setAiResult,
  setCurrentPage,
  totalPages,
  safePage,
  sortOrder,
  onSortChange,
}: VerificationQueueProps) {
  return (
    <div className="panel">
      {/* Search + filter bar */}
      <div className="ph" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 9,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            name="search"
            id="input-13be0c"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, ID, phone, region…"
            style={{
              width: '100%',
              height: 36,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '0 12px 0 32px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              outline: 'none',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
            }}
            aria-label="Search members by name, ID, or phone"
          />
        </div>
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
              pointerEvents: 'none',
            }}
          >
            filter_list
          </span>
          <select
            name="statusFilter"
            id="select-a12bda"
            value={statusFilter}
            onChange={(e) => handleFilter(e.target.value as PendingVerification['status'] | 'All')}
            style={{
              height: 36,
              paddingLeft: 30,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
              outline: 'none',
              cursor: 'pointer',
            }}
            aria-label="Filter by verification status"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </div>
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
              pointerEvents: 'none',
            }}
          >
            location_on
          </span>
          <select
            name="constituencyFilter"
            id="select-3f4bc0"
            value={constituencyFilter}
            onChange={(e) => {
              setConstituencyFilter(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              height: 36,
              paddingLeft: 30,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
              outline: 'none',
              cursor: 'pointer',
            }}
            aria-label="Filter by constituency"
          >
            <option value="">All constituencies</option>
            {constituencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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
              pointerEvents: 'none',
            }}
          >
            public
          </span>
          <select
            name="countryFilter"
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value)
              setCurrentPage(1)
            }}
            style={{
              height: 36,
              paddingLeft: 30,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
              outline: 'none',
              cursor: 'pointer',
            }}
            aria-label="Filter by Base Diaspora country"
          >
            <option value="">All Base Diaspora</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <SortToggle value={sortOrder} onChange={onSortChange} />
      </div>

      {/* List rows */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <Skeleton variant="avatar" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton variant="text-md" width="55%" />
                <Skeleton variant="text-sm" width="35%" />
              </div>
              <Skeleton variant="chip" width={70} style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--border))',
              display: 'block',
              marginBottom: 10,
            }}
          >
            search_off
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            No registrations match your search.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop list rows */}
          <div className="desktop-only">
            {paginated.map((member, i) => {
              const isActive = selectedMember?.id === member.id
              return (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member)
                    setAiResult(null)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '14px 18px',
                    borderBottom:
                      i < paginated.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    cursor: 'pointer',
                    background: isActive ? 'linear-gradient(135deg,#0f1310,#1f2620)' : '',
                    boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : '',
                    transition: 'background .15s',
                  }}
                >
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: isActive ? 'rgba(255,255,255,.1)' : 'var(--container-low)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: isActive
                          ? '1px solid rgba(255,255,255,.15)'
                          : '1px solid hsl(var(--border))',
                      }}
                    >
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          decoding="async"
                          loading="lazy"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                            color: isActive
                              ? 'rgba(255,255,255,.6)'
                              : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: isActive ? '#fff' : 'hsl(var(--on-surface))',
                        }}
                      >
                        {member.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            color: isActive
                              ? 'rgba(255,255,255,.5)'
                              : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {member.id}
                        </span>
                        <span
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            background: isActive ? 'rgba(255,255,255,.3)' : 'hsl(var(--border))',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10.5,
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            color: isActive
                              ? 'rgba(255,255,255,.5)'
                              : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {member.submitted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Region + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11.5,
                          color: isActive ? 'rgba(255,255,255,.8)' : 'hsl(var(--on-surface))',
                        }}
                      >
                        {member.region}
                      </p>
                      <p
                        style={{
                          margin: '1px 0 0',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 10.5,
                          color: isActive
                            ? 'rgba(255,255,255,.45)'
                            : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {member.constituency}
                      </p>
                    </div>
                    {isActive ? (
                      <span
                        style={{
                          padding: '2px 9px',
                          background: 'rgba(255,255,255,.12)',
                          border: '1px solid rgba(255,255,255,.2)',
                          borderRadius: 99,
                          fontSize: 9.5,
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                        }}
                      >
                        {member.status}
                      </span>
                    ) : (
                      <span className={statusPill(member.status)}>{member.status}</span>
                    )}
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 16,
                        color: isActive ? 'rgba(255,255,255,.4)' : 'hsl(var(--border))',
                        transform: isActive ? 'translateX(2px)' : 'none',
                        transition: 'transform .15s',
                      }}
                    >
                      chevron_right
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile cards */}
          <div className="mobile-only">
            {paginated.map((member) => (
              <VerificationListCard
                key={member.id}
                member={member}
                isActive={selectedMember?.id === member.id}
                onClick={(m) => {
                  setSelectedMember(m)
                  setAiResult(null)
                }}
              />
            ))}
          </div>
        </>
      )}

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
