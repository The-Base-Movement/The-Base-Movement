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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'digital' | 'scan' | 'admin'>('all')
  const [searchType, setSearchType] = useState<'default' | 'constituency' | 'polling_station'>(
    'default'
  )
  const itemsPerPage = 8

  const fetchMembers = useCallback(() => {
    setIsLoading(true)
    adminService
      .getMembersPaginated(currentPage, itemsPerPage, searchTerm, sourceFilter, searchType)
      .then(({ data, totalCount: total }) => {
        setMembers(data)
        setTotalMembers(total)
        setIsLoading(false)
      })
  }, [currentPage, searchTerm, sourceFilter, searchType])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers()
  }, [fetchMembers])

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }
  const handleSourceFilterChange = (val: 'all' | 'digital' | 'scan' | 'admin') => {
    setSourceFilter(val)
    setCurrentPage(1)
  }
  const handleClearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }
  const handleSearchTypeChange = (val: 'default' | 'constituency' | 'polling_station') => {
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

  const stats = {
    total: totalMembers,
    active: members.filter((m) => m.status === 'Active').length,
    pending: members.filter((m) => m.status === 'Pending').length,
    regions: new Set(members.filter((m) => m.region).map((m) => m.region)).size,
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
    stats,
    fetchMembers,
    handleSearchChange,
    handleSearchTypeChange,
    handleSourceFilterChange,
    handleClearSearch,
    handleNextPage,
    handlePrevPage,
  }
}
