import { useState, useEffect } from 'react'
import { adminService, type Region } from '@/services/adminService'
import { toast } from 'sonner'

const inputSt: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 10px', border: '1px solid hsl(var(--border))',
  borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13,
  outline: 'none', background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box'
}

type ConEntry = { id: string; name: string }
type ConMap = Record<number, ConEntry[]>

// ── Inline modal ─────────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--on-surface))' }}>
          <div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', fontWeight: 600 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Delete warning modal ──────────────────────────────────────────────────────
function DeleteModal({ label, itemName, onClose, onConfirm, isLoading }: {
  label: string; itemName: string; onClose: () => void; onConfirm: () => void; isLoading: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ height: 4, background: 'hsl(var(--destructive))' }} />
        <div style={{ padding: '18px 22px', background: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 4, background: 'rgba(206,17,38,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}>delete_forever</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>Delete {label}</p>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '3px 0 0', fontWeight: 600, lineHeight: 1.5 }}>
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '10px 14px', marginBottom: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em', margin: '0 0 3px' }}>Target</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>{itemName}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} disabled={isLoading} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
            <button onClick={onConfirm} disabled={isLoading} className="btn btn-dest" style={{ flex: 1, height: 42 }}>
              {isLoading
                ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>
                : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
              }
              {isLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminRegions() {
  const [regions, setRegions] = useState<Region[]>([])
  const [conMap, setConMap] = useState<ConMap>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<number[]>([])
  const [constituencySearch, setConstituencySearch] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // modal states
  const [addRegionModal, setAddRegionModal] = useState(false)
  const [editRegionModal, setEditRegionModal] = useState<{ id: number; name: string } | null>(null)
  const [deleteRegionModal, setDeleteRegionModal] = useState<{ id: number; name: string } | null>(null)
  const [addConModal, setAddConModal] = useState<{ regionId: number; regionName: string } | null>(null)
  const [editConModal, setEditConModal] = useState<{ id: string; name: string; regionName: string } | null>(null)
  const [deleteConModal, setDeleteConModal] = useState<{ id: string; name: string; regionName: string } | null>(null)
  const [inputValue, setInputValue] = useState('')

  const refresh = () => setRefreshKey(k => k + 1)

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
    setExpandedRegions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])

  const filteredRegions = regions.filter(region => {
    const rName = region.name || ''
    const rCons = region.constituencies || []
    return rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rCons.some(c => c?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

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
    const ok = await adminService.createConstituency(String(addConModal.regionId), addConModal.regionName, inputValue.trim())
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
    const ok = await adminService.updateConstituency(editConModal.id, editConModal.regionName, inputValue.trim())
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
    const ok = await adminService.deleteConstituency(deleteConModal.id, deleteConModal.regionName, deleteConModal.name)
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>location_on</span>
            Regions &amp; Constituencies
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4, fontWeight: 600 }}>
            Manage administrative regions and electoral jurisdictions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setInputValue(''); setAddRegionModal(true) }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Define new region
        </button>
      </div>

      {/* KPI tiles */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          { label: 'Regions', value: regions.length || 16, icon: 'map', bar: 'hsl(var(--primary))' },
          { label: 'Constituencies', value: totalConstituencies, icon: 'location_on', bar: 'hsl(var(--accent))' },
          { label: 'Avg. per region', value: regions.length ? Math.round(totalConstituencies / regions.length) : 0, icon: 'analytics', bar: 'hsl(var(--on-surface))' },
          { label: 'Sync status', value: 'Live', icon: 'sync', bar: 'hsl(var(--primary))' },
        ].map(kpi => (
          <div key={kpi.label} className="panel" style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{kpi.label}</p>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>{kpi.icon}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>
              {isLoading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Global search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
        <input name="searchQuery" id="input-3b886d"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search regions or constituencies…"
          style={{ ...inputSt, paddingLeft: 34, height: 40, width: '100%' }}
        />
      </div>

      {/* Regions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel" style={{ padding: '16px 20px' }}>
              <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 4, width: 140 }} />
            </div>
          ))
        ) : filteredRegions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13 }}>
            No matching geographical data found.
          </div>
        ) : filteredRegions.map(region => {
          const isExpanded = expandedRegions.includes(region.id)
          const cSearch = constituencySearch[region.id] || ''
          const cons: ConEntry[] = (conMap[region.id] || []).filter(c =>
            c.name.toLowerCase().includes(cSearch.toLowerCase())
          ).sort((a, b) => a.name.localeCompare(b.name))

          return (
            <div key={region.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Region header row */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => toggleRegion(region.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 4, background: isExpanded ? 'hsl(var(--on-surface))' : 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: isExpanded ? '#fff' : 'hsl(var(--on-surface-muted))' }}>location_on</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', margin: 0 }}>{region.name}</p>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0' }}>
                      {(conMap[region.id] || []).length} constituencies
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'hsl(var(--accent))', color: '#000', border: 'none', width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); setInputValue(region.name); setEditRegionModal({ id: region.id, name: region.name }) }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
                  </button>
                  <button
                    className="btn btn-dest btn-sm"
                    style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => { e.stopPropagation(); setDeleteRegionModal({ id: region.id, name: region.name }) }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                  </button>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
                </div>
              </div>

              {/* Expanded: constituency grid */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', padding: '14px 16px' }}>
                  {/* Controls row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                      <input name="cSearch" id="input-c34fe2"
                        value={cSearch}
                        onChange={e => setConstituencySearch(prev => ({ ...prev, [region.id]: e.target.value }))}
                        placeholder="Filter constituencies…"
                        style={{ ...inputSt, paddingLeft: 30, height: 34, fontSize: 12 }}
                      />
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { setInputValue(''); setAddConModal({ regionId: region.id, regionName: region.name }) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                      Define constituency
                    </button>
                  </div>

                  {/* Constituency grid */}
                  {cons.length === 0 ? (
                    <p style={{ textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', padding: '16px 0', margin: 0 }}>
                      {cSearch ? 'No match found.' : 'No constituencies defined yet.'}
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {cons.map(con => (
                        <div
                          key={con.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '8px 10px', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4 }}
                        >
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{con.name}</span>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'hsl(var(--accent))', color: '#000', border: 'none', width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => { setInputValue(con.name); setEditConModal({ id: con.id, name: con.name, regionName: region.name }) }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
                            </button>
                            <button
                              className="btn btn-dest btn-sm"
                              style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setDeleteConModal({ id: con.id, name: con.name, regionName: region.name })}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Modals ── */}

      {/* Add region */}
      {addRegionModal && (
        <Modal title="Define new region" subtitle="Add an administrative region" onClose={() => setAddRegionModal(false)}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Region name</label>
          <input name="inputValue" id="input-bff317"
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddRegion()}
            placeholder="e.g. Greater Accra"
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setAddRegionModal(false)} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
            <button onClick={handleAddRegion} disabled={isSaving || !inputValue.trim()} className="btn btn-primary" style={{ flex: 1, height: 42 }}>
              {isSaving ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span> : null}
              {isSaving ? 'Saving…' : 'Create region'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit region */}
      {editRegionModal && (
        <Modal title="Edit region" subtitle={`Editing: ${editRegionModal.name}`} onClose={() => setEditRegionModal(null)}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Region name</label>
          <input name="inputValue" id="input-5066bc"
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEditRegion()}
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setEditRegionModal(null)} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
            <button onClick={handleEditRegion} disabled={isSaving || !inputValue.trim()} className="btn btn-primary" style={{ flex: 1, height: 42 }}>
              {isSaving ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span> : null}
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add constituency */}
      {addConModal && (
        <Modal title="Define constituency" subtitle={`Adding to: ${addConModal.regionName}`} onClose={() => setAddConModal(null)}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Constituency name</label>
          <input name="inputValue" id="input-fe8639"
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddConstituency()}
            placeholder="e.g. Ablekuma Central"
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setAddConModal(null)} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
            <button onClick={handleAddConstituency} disabled={isSaving || !inputValue.trim()} className="btn btn-primary" style={{ flex: 1, height: 42 }}>
              {isSaving ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span> : null}
              {isSaving ? 'Saving…' : 'Add constituency'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit constituency */}
      {editConModal && (
        <Modal title="Edit constituency" subtitle={`In: ${editConModal.regionName}`} onClose={() => setEditConModal(null)}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Constituency name</label>
          <input name="inputValue" id="input-1238ff"
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEditConstituency()}
            style={inputSt}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setEditConModal(null)} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
            <button onClick={handleEditConstituency} disabled={isSaving || !inputValue.trim()} className="btn btn-primary" style={{ flex: 1, height: 42 }}>
              {isSaving ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span> : null}
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
