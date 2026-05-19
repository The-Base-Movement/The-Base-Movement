import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'

type Station = {
  code: string
  name: string
  community: string
  constituency: string
  region: string
  member_count: number
}

const PAGE_SIZE = 50

const selectStyle: React.CSSProperties = {
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 6,
  paddingLeft: 30,
  paddingRight: 28,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 800,
  fontSize: 12,
  background: '#fff',
  cursor: 'pointer',
  appearance: 'none',
  outline: 'none',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const inputStyle: React.CSSProperties = {
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 6,
  paddingLeft: 30,
  paddingRight: 12,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  background: '#fff',
  outline: 'none',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
  width: 220,
}

export default function PollingStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<{
    total: number
    regions: number
    constituencies: number
    withMembers: number
  } | null>(null)

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<
    { id: string; region_id: string; name: string }[]
  >([])
  const [filteredConstituencies, setFilteredConstituencies] = useState<
    { id: string; region_id: string; name: string }[]
  >([])

  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedConstituency, setSelectedConstituency] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasFilters = !!(selectedRegion || selectedConstituency || search)

  const fetchStations = useCallback(async () => {
    setLoading(true)
    const result = await adminService.getPollingStationsPaginated(
      page,
      PAGE_SIZE,
      selectedRegion || undefined,
      selectedConstituency || undefined,
      search || undefined
    )
    setStations(result.data)
    setTotalCount(result.totalCount)
    setLoading(false)
  }, [page, selectedRegion, selectedConstituency, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStations()
  }, [fetchStations])

  useEffect(() => {
    async function init() {
      const [statsData, regionsData, constsData] = await Promise.all([
        adminService.getPollingStationStats(),
        adminService.getGhanaRegions(),
        adminService.getGhanaConstituencies(),
      ])
      setStats(statsData)
      setRegions(regionsData)
      setConstituencies(constsData)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      const regionObj = regions.find((r) => r.name === selectedRegion)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredConstituencies(
        regionObj ? constituencies.filter((c) => c.region_id === regionObj.id) : []
      )
    } else {
      setFilteredConstituencies([])
    }

    setSelectedConstituency('')

    setPage(1)
  }, [selectedRegion, regions, constituencies])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [selectedConstituency, search])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setSearch(searchInput)
  }

  const handleClearFilters = () => {
    setSelectedRegion('')
    setSelectedConstituency('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const kpis = [
    {
      label: 'Total polling stations',
      value: stats ? stats.total.toLocaleString() : '—',
      sub: 'EC-registered stations across Ghana',
      bar: 'hsl(var(--on-surface))',
      icon: 'ballot',
    },
    {
      label: 'Regions covered',
      value: stats ? stats.regions.toLocaleString() : '—',
      sub: 'Administrative regions',
      bar: 'hsl(var(--primary))',
      icon: 'map',
    },
    {
      label: 'Constituencies',
      value: stats ? stats.constituencies.toLocaleString() : '—',
      sub: 'Unique constituencies in system',
      bar: 'hsl(var(--accent))',
      icon: 'location_city',
    },
    {
      label: 'Stations with members',
      value: stats ? stats.withMembers.toLocaleString() : '—',
      sub: 'Have at least 1 registered member',
      bar: 'hsl(var(--destructive))',
      icon: 'how_to_vote',
    },
  ]

  return (
    <div className="main">
      {/* Header */}
      <div className="top">
        <div>
          <div className="crumbs">Admin · Constituency Operations · Polling stations</div>
          <h2>Polling stations</h2>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 2,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            20,361 EC-registered polling stations across Ghana
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="kpis" style={{ marginBottom: 18 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    marginBottom: 6,
                  }}
                >
                  {kpi.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 26,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {kpi.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {kpi.sub}
                </div>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: kpi.bar, opacity: 0.7, marginTop: 2 }}
              >
                {kpi.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table panel */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>Station directory</h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              Browse, filter, and search all EC-registered polling stations.
            </p>
          </div>
          <span className="meta">
            {totalCount.toLocaleString()} {totalCount === 1 ? 'station' : 'stations'}
          </span>
        </div>

        {/* Filter bar */}
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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
              aria-label="Filter by region"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ ...selectStyle, minWidth: 180 }}
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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
              aria-label="Filter by constituency"
              value={selectedConstituency}
              onChange={(e) => {
                setSelectedConstituency(e.target.value)
                setPage(1)
              }}
              disabled={!selectedRegion}
              style={{ ...selectStyle, minWidth: 200, opacity: selectedRegion ? 1 : 0.5 }}
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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
              type="text"
              aria-label="Search polling stations by code, name or community"
              placeholder="Search code, name, community…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={() => setSearch(searchInput)}
              style={inputStyle}
            />
          </div>

          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={handleClearFilters}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                close
              </span>
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Code', 'Station name', 'Community', 'Constituency', 'Region', 'Members'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        fontWeight: 800,
                        fontSize: 9.5,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          border: '2px solid hsl(var(--border))',
                          borderTopColor: 'hsl(var(--primary))',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Public Sans'",
                          fontWeight: 700,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                        }}
                      >
                        Loading stations…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : stations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans'",
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No polling stations match the current filters.
                  </td>
                </tr>
              ) : (
                stations.map((s, i) => (
                  <tr
                    key={s.code}
                    style={{
                      borderBottom:
                        i < stations.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      background: i % 2 === 0 ? '#fff' : 'hsl(var(--container-low))',
                    }}
                  >
                    <td style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: '.02em',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {s.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 800,
                        fontSize: 12.5,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {s.name}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {s.community}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.constituency}
                    </td>
                    <td
                      style={{
                        padding: '9px 16px',
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.region}
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      {s.member_count > 0 ? (
                        <span
                          className="pill pill-ok"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {s.member_count} registered
                        </span>
                      ) : (
                        <span
                          style={{
                            color: 'hsl(var(--on-surface-muted))',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: '1px solid hsl(var(--border))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span
              style={{ fontWeight: 700, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}
            >
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of{' '}
              {totalCount.toLocaleString()} stations
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ opacity: page <= 1 ? 0.4 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_left
                </span>
                Previous
              </button>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  minWidth: 80,
                  textAlign: 'center',
                }}
              >
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
