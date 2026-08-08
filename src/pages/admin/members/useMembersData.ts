import { useState, useCallback, useEffect, useMemo } from 'react'
import { adminService, type Member } from '@/services/adminService'
import type { MemberDirectoryFilters } from '@/services/memberService'

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
  const [partyAffiliationFilter, setPartyAffiliationFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'GHANA' | 'DIASPORA'>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [chapterFilter, setChapterFilter] = useState<string>('all')
  const [searchType, setSearchType] = useState<
    'default' | 'constituency' | 'district' | 'region' | 'polling_station'
  >('default')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const itemsPerPage = 8

  const filters: MemberDirectoryFilters = useMemo(
    () => ({
      searchTerm,
      registrationSource: sourceFilter,
      searchType,
      sortOrder,
      gender: genderFilter !== 'all' ? genderFilter : undefined,
      ageRange: ageRangeFilter !== 'all' ? ageRangeFilter : undefined,
      religion: religionFilter !== 'all' ? religionFilter : undefined,
      partyAffiliation: partyAffiliationFilter !== 'all' ? partyAffiliationFilter : undefined,
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      country: countryFilter !== 'all' ? countryFilter : undefined,
      chapter: chapterFilter !== 'all' ? chapterFilter : undefined,
    }),
    [
      searchTerm,
      sourceFilter,
      searchType,
      sortOrder,
      genderFilter,
      ageRangeFilter,
      religionFilter,
      partyAffiliationFilter,
      platformFilter,
      countryFilter,
      chapterFilter,
    ]
  )

  const fetchMembers = useCallback(() => {
    setIsLoading(true)
    adminService
      .getMembersPaginated(currentPage, itemsPerPage, filters)
      .then(({ data, totalCount: total }) => {
        setMembers(data)
        setTotalMembers(total)
        setIsLoading(false)
      })
  }, [currentPage, filters])

  // Every member matching the active filters — the export reads this, not the
  // single page the table renders.
  const fetchAllFilteredMembers = useCallback(() => adminService.getAllMembers(filters), [filters])

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
  const handlePartyAffiliationFilterChange = (val: string) => {
    setPartyAffiliationFilter(val)
    setCurrentPage(1)
  }
  const handlePlatformFilterChange = (val: 'all' | 'GHANA' | 'DIASPORA') => {
    setPlatformFilter(val)
    setCurrentPage(1)
  }
  const handleCountryFilterChange = (val: string) => {
    setCountryFilter(val)
    setCurrentPage(1)
  }
  const handleChapterFilterChange = (val: string) => {
    setChapterFilter(val)
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
    partyAffiliationFilter,
    platformFilter,
    countryFilter,
    chapterFilter,
    sortOrder,
    setSortOrder,
    stats,
    statsLoading,
    fetchMembers,
    fetchAllFilteredMembers,
    handleSearchChange,
    handleSearchTypeChange,
    handleSourceFilterChange,
    handleGenderFilterChange,
    handleAgeRangeFilterChange,
    handleReligionFilterChange,
    handlePartyAffiliationFilterChange,
    handlePlatformFilterChange,
    handleCountryFilterChange,
    handleChapterFilterChange,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
  }
}
