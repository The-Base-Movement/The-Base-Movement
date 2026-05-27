import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import type { PartyOfficial, PartyTier } from './partyofficials/utils'
import { OfficialsTable } from './partyofficials/OfficialsTable'
import { OfficialModal } from './partyofficials/OfficialModal'
import { TiersModal } from './partyofficials/TiersModal'
import { ViewModal } from './partyofficials/ViewModal'

export default function PartyOfficials() {
  const [officials, setOfficials] = useState<PartyOfficial[]>([])
  const [tiers, setTiers] = useState<PartyTier[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewingOfficial, setViewingOfficial] = useState<PartyOfficial | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false)
  const [tierFormData, setTierFormData] = useState<Partial<PartyTier>>({
    name: '',
    title: '',
    description: '',
    order_index: 0,
  })
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<PartyOfficial>>({
    name: '',
    role: '',
    tier: '',
    region: '',
    bio: '',
    avatar_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    email: '',
    order_index: 0,
  })

  async function fetchOfficials() {
    const { data, error } = await supabase
      .from('party_officials')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load officials')
    } else {
      setOfficials(data || [])
    }
    setLoading(false)
  }

  async function fetchTiers() {
    const { data } = await supabase
      .from('party_tiers')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setTiers(data)
  }

  useEffect(() => {
    fetchTiers()
    fetchOfficials()
  }, [])

  const handleOpenModal = (official?: PartyOfficial) => {
    if (official) {
      setFormData(official)
      setIsEditing(true)
    } else {
      setFormData({
        name: '',
        role: '',
        tier: '',
        region: '',
        bio: '',
        avatar_url: '',
        facebook_url: '',
        instagram_url: '',
        twitter_url: '',
        linkedin_url: '',
        email: '',
        order_index: 0,
      })
      setIsEditing(false)
    }
    setIsModalOpen(true)
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, 'party-officials')
      if (url) {
        setFormData((prev) => ({ ...prev, avatar_url: url }))
        toast.success('Image uploaded to media library')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this official?')) return
    const { error } = await supabase.from('party_officials').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete official')
    } else {
      toast.success('Official deleted successfully')
      fetchOfficials()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.role) {
      toast.error('Name and role are required')
      return
    }

    if (isEditing && formData.id) {
      const { error } = await supabase
        .from('party_officials')
        .update({
          name: formData.name,
          role: formData.role,
          tier: formData.tier,
          region: formData.region || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          twitter_url: formData.twitter_url || null,
          linkedin_url: formData.linkedin_url || null,
          email: formData.email || null,
          order_index: formData.order_index,
        })
        .eq('id', formData.id)

      if (error) {
        toast.error('Failed to update official')
      } else {
        toast.success('Official updated')
        setIsModalOpen(false)
        fetchOfficials()
      }
    } else {
      const { error } = await supabase.from('party_officials').insert([
        {
          name: formData.name,
          role: formData.role,
          tier: formData.tier,
          region: formData.region || null,
          bio: formData.bio || null,
          avatar_url: formData.avatar_url || null,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          twitter_url: formData.twitter_url || null,
          linkedin_url: formData.linkedin_url || null,
          email: formData.email || null,
          order_index: formData.order_index || 0,
        },
      ])

      if (error) {
        toast.error('Failed to create official')
      } else {
        toast.success('Official created')
        setIsModalOpen(false)
        fetchOfficials()
      }
    }
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="Party Officials"
        icon="badge"
        description="Manage movement leadership, regional representatives, and institutional authority figures across all operational tiers."
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setIsTiersModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                layers
              </span>
              Manage Tiers
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Add Official
            </button>
          </>
        }
      />

      <OfficialsTable
        loading={loading}
        officials={officials}
        tiers={tiers}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
        handleView={(official) => setViewingOfficial(official)}
      />

      {isModalOpen && (
        <OfficialModal
          isEditing={isEditing}
          setIsModalOpen={setIsModalOpen}
          formData={formData}
          setFormData={setFormData}
          tiers={tiers}
          handleUploadImage={handleUploadImage}
          isUploading={isUploading}
          handleSubmit={handleSubmit}
        />
      )}

      {viewingOfficial && (
        <ViewModal
          official={viewingOfficial}
          tiers={tiers}
          onClose={() => setViewingOfficial(null)}
          onEdit={(official) => {
            setViewingOfficial(null)
            handleOpenModal(official)
          }}
        />
      )}

      {isTiersModalOpen && (
        <TiersModal
          setIsTiersModalOpen={setIsTiersModalOpen}
          tiers={tiers}
          tierFormData={tierFormData}
          setTierFormData={setTierFormData}
          editingTierId={editingTierId}
          setEditingTierId={setEditingTierId}
          fetchTiers={fetchTiers}
        />
      )}
    </div>
  )
}
