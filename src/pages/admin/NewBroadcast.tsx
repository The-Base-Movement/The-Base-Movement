import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Broadcast, Region } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular components
import { NewBroadcastForm } from './newbroadcast/NewBroadcastForm'
import { NewBroadcastPreview } from './newbroadcast/NewBroadcastPreview'

export default function NewBroadcast() {
  const navigate = useNavigate()
  const location = useLocation()
  const editorRef = useRef<{ getContent: () => string } | null>(null)

  const state = location.state as {
    template?: { title: string; content: string; type: string; priority: string }
  } | null
  const initialTemplate = state?.template

  const [isSending, setIsSending] = useState(false)
  const [fullRegions, setFullRegions] = useState<Region[]>([])
  const [allConstituencies, setAllConstituencies] = useState<{ name: string; region_id: number }[]>(
    []
  )
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  const [newBroadcast, setNewBroadcast] = useState<
    Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>
  >({
    title: initialTemplate?.title || '',
    content: initialTemplate?.content || '',
    channel: 'In-app',
    target_type: (initialTemplate?.type as 'ALL' | 'REGION' | 'CONSTITUENCY') || 'ALL',
    target_value: '',
    priority: (initialTemplate?.priority as 'Normal' | 'High' | 'Urgent') || 'Normal',
    status: 'Sent',
  })

  const fetchData = useCallback(async () => {
    try {
      const [regions, cData] = await Promise.all([
        adminService.getRegions(),
        adminService.getConstituencies(),
      ])
      setFullRegions(regions || [])
      setAllConstituencies(cData?.data || [])
    } catch {
      toast.error('Failed to load regions and constituencies.')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSend = async () => {
    const content = editorRef.current ? editorRef.current.getContent() : newBroadcast.content
    if (!newBroadcast.title || !content || content === '<p></p>') {
      toast.error('Please fill in all required fields.')
      return
    }
    if (newBroadcast.target_type !== 'ALL' && !newBroadcast.target_value) {
      toast.error('Please select a target region or constituency.')
      return
    }
    setIsSending(true)
    try {
      const payload: Omit<Broadcast, 'id' | 'created_at' | 'sender_id'> = {
        ...newBroadcast,
        content,
      }
      const success = await adminService.sendBroadcast(payload)
      if (success) {
        toast.success('Broadcast deployed to the field.')
        navigate('/admin/broadcasts')
      } else {
        toast.error('Failed to deploy broadcast.')
      }
    } catch {
      toast.error('Critical failure in mobilization dispatch.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="New broadcast"
        icon="campaign"
        actions={
          <div className="actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/admin/broadcasts')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                arrow_back
              </span>
              Abort
            </button>
          </div>
        }
      />

      {/* Form panel */}
      <NewBroadcastForm
        newBroadcast={newBroadcast}
        setNewBroadcast={setNewBroadcast}
        fullRegions={fullRegions}
        allConstituencies={allConstituencies}
        selectedRegionId={selectedRegionId}
        setSelectedRegionId={setSelectedRegionId}
        isSending={isSending}
        handleSend={handleSend}
        editorRef={editorRef}
      />

      {/* Preview info */}
      <NewBroadcastPreview channel={newBroadcast.channel} targetType={newBroadcast.target_type} />
    </div>
  )
}
