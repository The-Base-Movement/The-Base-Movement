/**
 * Party Officials Page Component
 * -------------------------------------------------------------
 * Component for administering movement leadership lists and tier structures.
 * Connects directly to Supabase schemas, handles representative registration,
 * tier configuration, image upload, and search/sort capabilities.
 */

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { partyOfficialsService } from '@/services/partyOfficialsService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import type { PartyOfficial, PartyTier } from './partyofficials/utils'
import { OfficialsTable } from './partyofficials/OfficialsTable'
import { TiersModal } from './partyofficials/TiersModal'
import { ViewModal } from './partyofficials/ViewModal'

// Main component displaying the roster of officials, tiered groups, and modals
export default function PartyOfficials() {
  const navigate = useNavigate()
  const [officials, setOfficials] = useState<PartyOfficial[]>([])
  const [tiers, setTiers] = useState<PartyTier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewingOfficial, setViewingOfficial] = useState<PartyOfficial | null>(null)
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false)
  const [tierFormData, setTierFormData] = useState<Partial<PartyTier>>({
    name: '',
    title: '',
    description: '',
    order_index: 0,
  })
  const [editingTierId, setEditingTierId] = useState<string | null>(null)

  // Fetch registered officials ordered by priority indices
  async function fetchOfficials() {
    try {
      const data = await partyOfficialsService.getOfficials()
      setOfficials(data)
    } catch {
      toast.error('Failed to load officials')
    }
    setLoading(false)
  }

  async function fetchTiers() {
    const data = await partyOfficialsService.getTiers()
    setTiers(data)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTiers()
      fetchOfficials()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Navigate to the full add/edit page (replaces the old modal)
  const openForm = (official?: PartyOfficial) =>
    navigate(official ? `/admin/party-officials/${official.id}/edit` : '/admin/party-officials/new')

  // Remove official entry
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this official?')) return
    try {
      await partyOfficialsService.deleteOfficial(id)
      toast.success('Official deleted successfully')
      fetchOfficials()
    } catch {
      toast.error('Failed to delete official')
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
            <button className="btn btn-primary btn-sm" onClick={() => openForm()}>
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
        handleOpenModal={openForm}
        handleDelete={handleDelete}
        handleView={(official) => setViewingOfficial(official)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      {viewingOfficial && (
        <ViewModal
          official={viewingOfficial}
          tiers={tiers}
          onClose={() => setViewingOfficial(null)}
          onEdit={(official) => {
            setViewingOfficial(null)
            openForm(official)
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
