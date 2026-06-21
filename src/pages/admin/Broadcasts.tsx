import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { Broadcast } from '@/services/adminService'
import { toast } from 'sonner'

// Sub-components
import { BroadcastHeader } from './broadcasts/BroadcastHeader'
import { BroadcastKPIs } from './broadcasts/BroadcastKPIs'
import { BroadcastHistory } from './broadcasts/BroadcastHistory'
import { BroadcastPresets } from './broadcasts/BroadcastPresets'

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcastMetrics, setBroadcastMetrics] = useState<
    Record<string, { total: number; read: number }>
  >({})

  const fetchMetrics = useCallback(async (id: string) => {
    try {
      const stats = await adminService.getBroadcastMetrics(id)
      setBroadcastMetrics((prev) => ({ ...prev, [id]: stats }))
    } catch {
      // fail silently
    }
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const bData = await adminService.getBroadcasts()
      setBroadcasts(bData)
      bData.slice(0, 5).forEach((b) => fetchMetrics(b.id))
    } catch {
      toast.error('Failed to load broadcast history.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchMetrics])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const filteredBroadcasts = broadcasts.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-page-container">
      <BroadcastHeader />

      <BroadcastKPIs
        isLoading={isLoading}
        totalCount={broadcasts.length}
        urgentCount={broadcasts.filter((b) => b.priority === 'Urgent').length}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <BroadcastHistory
            isLoading={isLoading}
            filteredBroadcasts={filteredBroadcasts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            broadcastMetrics={broadcastMetrics}
            fetchMetrics={fetchMetrics}
          />
        </div>
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' }}>
          <BroadcastPresets />
        </div>
      </div>
    </div>
  )
}
