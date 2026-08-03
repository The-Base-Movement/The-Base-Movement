import { useState, useCallback, useEffect } from 'react'
import { adminService, type Member } from '@/services/adminService'

export function useMembersData() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMembers, setTotalMembers] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('search') || ''
    }
    return ''
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    regions: 0,
    recentJoins: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'digital' | 'scan' | 'admin'>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all')
  const [ageRangeFilter, setAgeRangeFilter] = useState<string>('all')
  const [religionFilter, setReligionFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'GHANA' | 'DIASPORA'>('all')
  const [searchType, setSearchType] = useState<
    'default' | 'constituency' | 'district' | 'region' | 'polling_station'
  >('default')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const itemsPerPage = 8

  const fetchMembers = useCallback(() => {
    setIsLoading(true)
    adminService
      .getMembersPaginated(
        currentPage,
        itemsPerPage,
        searchTerm,
        sourceFilter,
        searchType,
        sortOrder,
        genderFilter !== 'all' ? genderFilter : undefined,
        ageRangeFilter !== 'all' ? ageRangeFilter : undefined,
        religionFilter !== 'all' ? religionFilter : undefined,
        platformFilter !== 'all' ? platformFilter : undefined
      )
      .then(({ data, totalCount: total }) => {
        setMembers(data)
        setTotalMembers(total)
        setIsLoading(false)
      })
  }, [
    currentPage,
    searchTerm,
    sourceFilter,
    searchType,
    sortOrder,
    genderFilter,
    ageRangeFilter,
    religionFilter,
    platformFilter,
  ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers()
  }, [fetchMembers])

  // Directory-wide totals — independent of the current page and filters.
  useEffect(() => {
    let cancelled = false
    adminService.getDirectoryStats(24).then((s) => {
      if (cancelled) return
      setStats(s)
      setStatsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }
  const handleSourceFilterChange = (val: 'all' | 'digital' | 'scan' | 'admin') => {
    setSourceFilter(val)
    setCurrentPage(1)
  }
  const handleGenderFilterChange = (val: 'all' | 'Male' | 'Female') => {
    setGenderFilter(val)
    setCurrentPage(1)
  }
  const handleAgeRangeFilterChange = (val: string) => {
    setAgeRangeFilter(val)
    setCurrentPage(1)
  }
  const handleReligionFilterChange = (val: string) => {
    setReligionFilter(val)
    setCurrentPage(1)
  }
  const handlePlatformFilterChange = (val: 'all' | 'GHANA' | 'DIASPORA') => {
    setPlatformFilter(val)
    setCurrentPage(1)
  }
  const handleClearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }
  const handleSearchTypeChange = (
    val: 'default' | 'constituency' | 'district' | 'region' | 'polling_station'
  ) => {
    setSearchType(val)
    setSearchTerm('')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1)
  }
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1)
  }

  return {
    members,
    isLoading,
    totalMembers,
    currentPage,
    itemsPerPage,
    totalPages,
    searchTerm,
    searchType,
    sourceFilter,
    genderFilter,
    ageRangeFilter,
    religionFilter,
    platformFilter,
    sortOrder,
    setSortOrder,
    stats,
    statsLoading,
    fetchMembers,
    handleSearchChange,
    handleSearchTypeChange,
    handleSourceFilterChange,
    handleGenderFilterChange,
    handleAgeRangeFilterChange,
    handleReligionFilterChange,
    handlePlatformFilterChange,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
  }
}
