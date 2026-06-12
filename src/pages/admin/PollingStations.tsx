import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import { type Station } from './pollingstations/utils'
import { PollingStationsKPIs } from './pollingstations/PollingStationsKPIs'
import { PollingStationsFilterBar } from './pollingstations/PollingStationsFilterBar'
import { PollingStationsTable } from './pollingstations/PollingStationsTable'

export default function PollingStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(window.innerWidth < 768 ? 15 : 25)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleResize = () => setPageSize(window.innerWidth < 768 ? 15 : 25)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasFilters = !!(selectedRegion || selectedConstituency || search)

  const fetchStations = useCallback(async () => {
    setLoading(true)
    const result = await adminService.getPollingStationsPaginated(
      page,
      pageSize,
      selectedRegion || undefined,
      selectedConstituency || undefined,
      search || undefined,
      sortOrder
    )
    setStations(result.data)
    setTotalCount(result.totalCount)
    setLoading(false)
  }, [page, pageSize, selectedRegion, selectedConstituency, search, sortOrder])

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
  }, [selectedConstituency, search, sortOrder])

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

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

  return (
    <div className="main">
      <AdminPageHeader
        title="Polling stations"
        icon="how_to_vote"
        description="20,361 EC-registered polling stations across Ghana"
      />

      {/* KPI Strip */}
      <PollingStationsKPIs stats={stats} />

      {/* Table panel */}
      <div className="panel">
        <div className="ph" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3>Station directory</h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-medium, 500)',
                marginTop: 2,
                marginBottom: 4,
              }}
            >
              Browse, filter, and search all EC-registered polling stations.
            </p>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-medium, 500)',
                margin: 0,
              }}
            >
              {totalCount.toLocaleString()} {totalCount === 1 ? 'station' : 'stations'}
            </p>
          </div>
          <img
            src="/branding/patterns/eagle-in-flight.png"
            alt=""
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              height: '120%',
              opacity: 0.15,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Filter bar */}
        <PollingStationsFilterBar
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedConstituency={selectedConstituency}
          setSelectedConstituency={setSelectedConstituency}
          regions={regions}
          filteredConstituencies={filteredConstituencies}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearchKeyDown={handleSearchKeyDown}
          setSearch={setSearch}
          hasFilters={hasFilters}
          handleClearFilters={handleClearFilters}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Table / Pagination */}
        <PollingStationsTable
          loading={loading}
          stations={stations}
          page={page}
          setPage={setPage}
          totalCount={totalCount}
          totalPages={totalPages}
          pageSize={pageSize}
        />
      </div>
    </div>
  )
}
