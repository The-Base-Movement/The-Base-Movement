import { useState, useEffect, useMemo } from 'react'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { DonationCampaign } from '@/types/admin'
import { toast } from 'sonner'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import { PriorityCard } from './strategicpriorities/PriorityCard'
import { StrategicPrioritiesKPIs } from './strategicpriorities/StrategicPrioritiesKPIs'
import { StrategicPrioritiesSidebar } from './strategicpriorities/StrategicPrioritiesSidebar'
import { MobileFilterModal } from './strategicpriorities/MobileFilterModal'
import { DotLoader } from '@/components/states'
import { PriorityModal } from './strategicpriorities/PriorityModal'

export default function StrategicPriorities() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [showMobileFilter, setShowMobileFilter] = useState(false)
  const { openDelete, modal } = useDeleteModal()
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'media-library' | 'url'>(
    'media-library'
  )
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Form State
  const [formData, setFormData] = useState<Omit<DonationCampaign, 'id' | 'raisedAmount'>>({
    title: '',
    description: '',
    targetAmount: 0,
    endDate: '',
    status: 'Active',
    imageUrl: '',
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const data = await adminService.getDonationCampaigns()
      const processed = data.map((campaign) => {
        if (
          campaign.status === 'Active' &&
          campaign.raisedAmount >= campaign.targetAmount &&
          campaign.targetAmount > 0
        ) {
          return { ...campaign, status: 'Closed' as const }
        }
        return campaign
      })
      setCampaigns(processed)
    } catch (err) {
      console.error('[STRATEGIC PRIORITIES] Synchronization failed:', err)
      toast.error('Failed to synchronize strategic priorities.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const success = await adminService.createDonationCampaign(formData)
      if (success) {
        toast.success('Strategic priority deployed successfully.')
        setIsCreating(false)
        setFormData({
          title: '',
          description: '',
          targetAmount: 0,
          endDate: '',
          status: 'Active',
          imageUrl: '',
        })
        fetchCampaigns()
      } else {
        toast.error('Failed to deploy strategic protocol.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    setIsSubmitting(true)
    try {
      const updatedFormData = { ...formData }
      if (
        editingCampaign.raisedAmount >= Number(formData.targetAmount) &&
        Number(formData.targetAmount) > 0
      ) {
        updatedFormData.status = 'Closed'
      }
      const success = await adminService.updateDonationCampaign(editingCampaign.id, updatedFormData)
      if (success) {
        toast.success('Strategic priority updated.')
        setEditingCampaign(null)
        fetchCampaigns()
      } else {
        toast.error('Failed to update protocol.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (campaign: DonationCampaign) => {
    openDelete({
      itemName: campaign.title,
      title: 'Decommission Strategic Priority',
      description:
        'Are you sure you want to decommission this strategic priority? This action is immutable.',
      isPermanent: true,
      successMessage: 'Priority decommissioned.',
      errorMessage: 'Decommissioning failed.',
      onConfirm: async () => {
        const success = await adminService.deleteDonationCampaign(campaign.id, campaign.title)
        if (success) fetchCampaigns()
        return success
      },
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const url = await contentService.uploadImage(file, 'priorities')
      if (url) {
        setFormData((prev) => ({ ...prev, imageUrl: url }))
        toast.success('Priority image uploaded successfully.')
      } else {
        toast.error('Failed to upload priority image.')
      }
    } catch (err) {
      console.error('[STRATEGIC PRIORITIES] Image upload failed:', err)
      toast.error('Operational error during image upload.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const filteredCampaigns = useMemo(() => {
    const list = campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return list.sort((a, b) => {
      const titleA = a.title || ''
      const titleB = b.title || ''
      return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA)
    })
  }, [campaigns, searchQuery, sortOrder])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <DotLoader label="Synchronizing tactical priorities…" />
      </div>
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Strategic priorities"
        icon="target"
        description="Manage movement-wide mobilization goals, financial targets, and operational milestones."
        actions={
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                targetAmount: 0,
                endDate: '',
                status: 'Active',
                imageUrl: '',
              })
              setIsCreating(true)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Add Priority
          </button>
        }
      />

      {isMobile && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .kpis::-webkit-scrollbar {
                display: none;
              }
            `,
          }}
        />
      )}

      <StrategicPrioritiesKPIs campaigns={campaigns} isMobile={isMobile} />

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        <StrategicPrioritiesSidebar
          campaigns={campaigns}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Main Priorities Grid */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: 20,
            }}
          >
            {filteredCampaigns.length === 0 ? (
              <div
                style={{
                  gridColumn: '1/-1',
                  padding: '100px 0',
                  textAlign: 'center',
                  border: '2px dashed hsl(var(--border))',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
                >
                  target
                </span>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 20,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    No priorities found
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 8,
                    }}
                  >
                    Try refining your search or add a new strategic priority.
                  </p>
                </div>
                <button className="btn btn-outline" onClick={() => setSearchQuery('')}>
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <PriorityCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => {
                    setEditingCampaign(campaign)
                    setFormData({
                      title: campaign.title,
                      description: campaign.description,
                      targetAmount: campaign.targetAmount,
                      endDate: campaign.endDate.split('T')[0],
                      status: campaign.status,
                      imageUrl: campaign.imageUrl || '',
                    })
                  }}
                  onDelete={() => handleDelete(campaign)}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {/* Mobile filter FAB + bottom sheet */}
      {isMobile && (
        <>
          <button
            onClick={() => setShowMobileFilter(true)}
            style={{
              position: 'fixed',
              top: '50%',
              left: 0,
              transform: 'translateY(-50%)',
              zIndex: 50,
              width: 38,
              height: 48,
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              background: 'hsl(var(--on-surface))',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '4px 0 16px rgba(0,0,0,0.18)',
              cursor: 'pointer',
            }}
            aria-label="Open filters"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              filter_list
            </span>
          </button>

          <MobileFilterModal
            isOpen={showMobileFilter}
            onClose={() => setShowMobileFilter(false)}
            campaigns={campaigns}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </>
      )}

      {/* 📝 Create/Edit Modal */}
      <PriorityModal
        isOpen={isCreating || !!editingCampaign}
        isCreating={isCreating}
        onClose={() => {
          setIsCreating(false)
          setEditingCampaign(null)
        }}
        isMobile={isMobile}
        isSubmitting={isSubmitting}
        formData={formData}
        setFormData={setFormData}
        onSubmit={isCreating ? handleCreate : handleUpdate}
        imageUploadMode={imageUploadMode}
        setImageUploadMode={setImageUploadMode}
        isUploadingImage={isUploadingImage}
        handleImageUpload={handleImageUpload}
      />

      {modal}
    </div>
  )
}
