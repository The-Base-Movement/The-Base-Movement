import { useState, useEffect, useMemo } from 'react'
import { adminService, type Region } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'

// Modular imports
import { inputSt, type ConMap } from './regions/utils'
import { Modal } from './regions/Modal'
import { DeleteModal } from './regions/DeleteModal'
import { RegionsKPIs } from './regions/RegionsKPIs'
import { RegionsList } from './regions/RegionsList'

export default function AdminRegions() {
  // This page has no pre-existing write-permission gate (any role that could already reach
  // it had full CRUD). Movement Manager gets read-only nav access via VIEW_CONSTITUENCY_OPS,
  // so hide writes specifically for that role rather than introducing a MANAGE_ permission
  // check that would narrow access for other roles that never held one here before.
  const canManage = adminService.getCurrentUser()?.role !== 'MOVEMENT_MANAGER'
  const [regions, setRegions] = useState<Region[]>([])
  const [conMap, setConMap] = useState<ConMap>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedRegions, setExpandedRegions] = useState<number[]>([])
  const [constituencySearch, setConstituencySearch] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // modal states
  const [addRegionModal, setAddRegionModal] = useState(false)
  const [editRegionModal, setEditRegionModal] = useState<{ id: number; name: string } | null>(null)
  const [deleteRegionModal, setDeleteRegionModal] = useState<{ id: number; name: string } | null>(
    null
  )
  const [addConModal, setAddConModal] = useState<{ regionId: number; regionName: string } | null>(
    null
  )
  const [editConModal, setEditConModal] = useState<{
    id: string
    name: string
    regionName: string
  } | null>(null)
  const [deleteConModal, setDeleteConModal] = useState<{
    id: string
    name: string
    regionName: string
  } | null>(null)
  const [inputValue, setInputValue] = useState('')

  const refresh = () => setRefreshKey((k) => k + 1)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await adminService.getRegions()
      const result = await adminService.getGhanaConstituencies()
      const map: ConMap = {}
      for (const c of result) {
        const rid = Number(c.region_id)
        if (!map[rid]) map[rid] = []
        map[rid].push({ id: c.id, name: c.name })
      }
      setRegions(data)
      setConMap(map)
      setIsLoading(false)
    }
    load()
  }, [refreshKey])

  const totalConstituencies = regions.reduce((acc, r) => acc + (r.constituencies?.length || 0), 0)

  const toggleRegion = (id: number) =>
    setExpandedRegions((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))

  const filteredRegions = useMemo(() => {
    const list = regions.filter((region) => {
      const rName = region.name || ''
      const rCons = region.constituencies || []
      return (
        rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rCons.some((c) => c?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })
    return list.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [regions, searchQuery, sortOrder])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddRegion = async () => {
    if (!inputValue.trim()) return
    setIsSaving(true)
    const ok = await adminService.createRegion(inputValue.trim())
    setIsSaving(false)
    if (ok) {
      toast.success(`Region "${inputValue.trim()}" created`)
      setAddRegionModal(false)
      setInputValue('')
      refresh()
    } else {
      toast.error('Failed to create region')
    }
  }

  const handleEditRegion = async () => {
    if (!editRegionModal || !inputValue.trim()) return
    setIsSaving(true)
    const ok = await adminService.updateRegion(String(editRegionModal.id), inputValue.trim())
    setIsSaving(false)
    if (ok) {
      toast.success('Region updated')
      setEditRegionModal(null)
      setInputValue('')
      refresh()
    } else {
      toast.error('Failed to update region')
    }
  }

  const handleDeleteRegion = async () => {
    if (!deleteRegionModal) return
    setIsSaving(true)
    const ok = await adminService.deleteRegion(String(deleteRegionModal.id), deleteRegionModal.name)
    setIsSaving(false)
    if (ok) {
      toast.success(`Region "${deleteRegionModal.name}" deleted`)
      setDeleteRegionModal(null)
      refresh()
    } else {
      toast.error('Failed to delete region')
    }
  }

  const handleAddConstituency = async () => {
    if (!addConModal || !inputValue.trim()) return
    setIsSaving(true)
    const ok = await adminService.createConstituency(
      String(addConModal.regionId),
      addConModal.regionName,
      inputValue.trim()
    )
    setIsSaving(false)
    if (ok) {
      toast.success(`Constituency "${inputValue.trim()}" added`)
      setAddConModal(null)
      setInputValue('')
      refresh()
    } else {
      toast.error('Failed to add constituency')
    }
  }

  const handleEditConstituency = async () => {
    if (!editConModal || !inputValue.trim()) return
    setIsSaving(true)
    const ok = await adminService.updateConstituency(
      editConModal.id,
      editConModal.regionName,
      inputValue.trim()
    )
    setIsSaving(false)
    if (ok) {
      toast.success('Constituency updated')
      setEditConModal(null)
      setInputValue('')
      refresh()
    } else {
      toast.error('Failed to update constituency')
    }
  }

  const handleDeleteConstituency = async () => {
    if (!deleteConModal) return
    setIsSaving(true)
    const ok = await adminService.deleteConstituency(
      deleteConModal.id,
      deleteConModal.regionName,
      deleteConModal.name
    )
    setIsSaving(false)
    if (ok) {
      toast.success(`Constituency "${deleteConModal.name}" deleted`)
      setDeleteConModal(null)
      refresh()
    } else {
      toast.error('Failed to delete constituency')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Regions & Constituencies"
        icon="location_on"
        description="Manage administrative regions and electoral jurisdictions."
        actions={
          canManage ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setInputValue('')
                setAddRegionModal(true)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Define new region
            </button>
          ) : undefined
        }
      />

      {/* KPI tiles */}
      <RegionsKPIs
        regions={regions}
        totalConstituencies={totalConstituencies}
        isLoading={isLoading}
      />

      {/* Global search & Sort */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            name="searchQuery"
            id="input-3b886d"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regions or constituencies…"
            style={{ ...inputSt, paddingLeft: 34, height: 40, width: '100%' }}
          />
        </div>
        <SortToggle value={sortOrder} onChange={setSortOrder} />
      </div>

      {/* Regions list */}
      <RegionsList
        filteredRegions={filteredRegions}
        conMap={conMap}
        expandedRegions={expandedRegions}
        toggleRegion={toggleRegion}
        constituencySearch={constituencySearch}
        setConstituencySearch={setConstituencySearch}
        isLoading={isLoading}
        canManage={canManage}
        setInputValue={setInputValue}
        setEditRegionModal={setEditRegionModal}
        setDeleteRegionModal={setDeleteRegionModal}
        setAddConModal={setAddConModal}
        setEditConModal={setEditConModal}
        setDeleteConModal={setDeleteConModal}
      />

      {/* ── Modals ── */}

      {/* Add region */}
      {addRegionModal && (
        <Modal
          title="Define new region"
          subtitle="Add an administrative region"
          onClose={() => setAddRegionModal(false)}
        >
          <label
            htmlFor="input-bff317"
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Region name
          </label>
          <input
            name="inputValue"
            id="input-bff317"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRegion()}
            placeholder="e.g. Greater Accra"
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setAddRegionModal(false)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddRegion}
              disabled={isSaving || !inputValue.trim()}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              ) : null}
              {isSaving ? 'Saving…' : 'Create region'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit region */}
      {editRegionModal && (
        <Modal
          title="Edit region"
          subtitle={`Editing: ${editRegionModal.name}`}
          onClose={() => setEditRegionModal(null)}
        >
          <label
            htmlFor="input-5066bc"
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Region name
          </label>
          <input
            name="inputValue"
            id="input-5066bc"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditRegion()}
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setEditRegionModal(null)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditRegion}
              disabled={isSaving || !inputValue.trim()}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              ) : null}
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add constituency */}
      {addConModal && (
        <Modal
          title="Define constituency"
          subtitle={`Adding to: ${addConModal.regionName}`}
          onClose={() => setAddConModal(null)}
        >
          <label
            htmlFor="input-fe8639"
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Constituency name
          </label>
          <input
            name="inputValue"
            id="input-fe8639"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddConstituency()}
            placeholder="e.g. Ablekuma Central"
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setAddConModal(null)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddConstituency}
              disabled={isSaving || !inputValue.trim()}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              ) : null}
              {isSaving ? 'Saving…' : 'Add constituency'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit constituency */}
      {editConModal && (
        <Modal
          title="Edit constituency"
          subtitle={`In: ${editConModal.regionName}`}
          onClose={() => setEditConModal(null)}
        >
          <label
            htmlFor="input-1238ff"
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Constituency name
          </label>
          <input
            name="inputValue"
            id="input-1238ff"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEditConstituency()}
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setEditConModal(null)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditConstituency}
              disabled={isSaving || !inputValue.trim()}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              ) : null}
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete region */}
      {deleteRegionModal && (
        <DeleteModal
          label="region"
          itemName={deleteRegionModal.name}
          onClose={() => setDeleteRegionModal(null)}
          onConfirm={handleDeleteRegion}
          isLoading={isSaving}
        />
      )}

      {/* Delete constituency */}
      {deleteConModal && (
        <DeleteModal
          label="constituency"
          itemName={`${deleteConModal.name} (${deleteConModal.regionName})`}
          onClose={() => setDeleteConModal(null)}
          onConfirm={handleDeleteConstituency}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}
