import { useState, useEffect } from 'react'
import { adminService, type AuditLogEntry } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AuditLogsTable } from './auditlogs/AuditLogsTable'
import { AuditLogsFilterBar } from './auditlogs/AuditLogsFilterBar'
import { AuditLogDetailModal } from './auditlogs/AuditLogDetailModal'

interface FilterState {
  action: string
  status: string
  dateFrom: string
  dateTo: string
}

const ITEMS_PER_PAGE = 50

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    action: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true)
      try {
        const allLogs = await adminService.getSystemAuditLogs()
        setLogs(allLogs)
        setCurrentPage(1)
      } catch (error) {
        console.error('Failed to load audit logs:', error)
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    }
    loadLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filters.action && log.action !== filters.action) return false
    if (filters.status && log.status !== filters.status) return false

    if (filters.dateFrom) {
      const logDate = new Date(log.timestamp)
      const fromDate = new Date(filters.dateFrom)
      if (logDate < fromDate) return false
    }

    if (filters.dateTo) {
      const logDate = new Date(log.timestamp)
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      if (logDate > toDate) return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort()

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters({ action: '', status: '', dateFrom: '', dateTo: '' })
    setCurrentPage(1)
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="System Audit Logs"
        description="View administrative actions and system events"
      />

      <AuditLogsFilterBar
        filters={filters}
        actions={uniqueActions}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <AuditLogsTable
        logs={paginatedLogs}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onSelectRow={setSelectedLog}
      />

      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}
