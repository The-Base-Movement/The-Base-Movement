import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import { PAGE_SIZE, type Station } from './pollingstations/utils'
import { PollingStationsKPIs } from './pollingstations/PollingStationsKPIs'
import { PollingStationsFilterBar } from './pollingstations/PollingStationsFilterBar'
import { PollingStationsTable } from './pollingstations/PollingStationsTable'

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
        <div className="ph">
          <div>
            <h3>Station directory</h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans'",
                fontWeight: 'var(--font-weight-medium, 500)',
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
        />

        {/* Table / Pagination */}
        <PollingStationsTable
          loading={loading}
          stations={stations}
          page={page}
          setPage={setPage}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}
