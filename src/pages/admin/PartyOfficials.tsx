/**
 * Party Officials Page Component
 * -------------------------------------------------------------
 * Component for administering movement leadership lists and tier structures.
 * Connects directly to Supabase schemas, handles representative registration,
 * tier configuration, image upload, and search/sort capabilities.
 */

import { useEffect, useState, useMemo } from 'react'
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

// Main component displaying the roster of officials, tiered groups, and modals
export default function PartyOfficials() {
  const [officials, setOfficials] = useState<PartyOfficial[]>([])
  const [tiers, setTiers] = useState<PartyTier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
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

  // Fetch registered officials ordered by priority indices
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

  // Fetch tier definitions for sorting leadership
  async function fetchTiers() {
    const { data } = await supabase
      .from('party_tiers')
      .select('*')
      .order('order_index', { ascending: true })
    if (data) setTiers(data)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTiers()
      fetchOfficials()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Open the direct official addition/edition modal
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

  // Upload representative avatar asset
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

  // Remove official entry
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
  const filteredOfficials = useMemo(() => {
    const list = officials.filter((o) => {
      const q = searchQuery.toLowerCase()
      return (
        o.name.toLowerCase().includes(q) ||
        o.role.toLowerCase().includes(q) ||
        (o.region ?? '').toLowerCase().includes(q)
      )
    })
    return list.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [officials, searchQuery, sortOrder])
  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="Party Officials"
        icon="badge"
        description="Manage movement leadership, regional representatives, and institutional authority figures across all operational tiers."
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setIsTiersModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                layers
              </span>
              Manage Tiers
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Add Official
            </button>
          </>
        }
      />

      <OfficialsTable
        loading={loading}
        officials={filteredOfficials}
        tiers={tiers}
        handleOpenModal={handleOpenModal}
        handleDelete={handleDelete}
        handleView={(official) => setViewingOfficial(official)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
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
