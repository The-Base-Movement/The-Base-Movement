import { useState, useEffect } from 'react'
import { adminService, type Region } from '@/services/adminService'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const inputSt: React.CSSProperties = { width: '100%', height: 36, padding: '0 10px 0 32px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }

export default function AdminRegions() {
  const [regions, setRegions] = useState<Region[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<number[]>([])
  const [constituencySearch, setConstituencySearch] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const data = await adminService.getRegions()
      setRegions(data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const totalConstituencies = regions.reduce((acc, r) => acc + (r.constituencies?.length || 0), 0)

  const toggleRegion = (id: number) => {
    setExpandedRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const filteredRegions = regions.filter(region => {
    const rName = region.name || ''
    const rConstituencies = region.constituencies || []
    return rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rConstituencies.some(c => c?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const handleAction = (action: string, region: string, constituency?: string) => {
    const resource = constituency ? `REGIONS/${region}/CONSTITUENCIES/${constituency}` : `REGIONS/${region}`
    adminService.logAction(action, resource, 'Success')
    toast.success(`${action.replace('_', ' ')} recorded in Audit Vault for ${constituency || region}`)
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>location_on</span>
            Regions &amp; constituencies
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Manage administrative regions and regional jurisdictions.</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
          Define new region
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI label="Regions" value="16" description="Ghana administrative zones" trend={{ direction: 'neutral', value: 'National' }} />
        <TacticalKPI label="Constituencies" value={totalConstituencies} description="Electoral jurisdictions" trend={{ direction: 'up', value: 'Sync' }} />
        <TacticalKPI label="Avg. per region" value={Math.round(totalConstituencies / 16)} description="Constituency density" />
        <TacticalKPI label="Sync status" value="Active" description="Geographical data live" trend={{ direction: 'up', value: 'Elite' }} />
      </div>

      {/* Global search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
        <input
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
            <div key={i} className="panel" style={{ padding: '16px 24px', animation: 'pulse 2s infinite' }}>
              <div style={{ height: 16, background: 'hsl(var(--border))', borderRadius: 4, width: 120 }} />
            </div>
          ))
        ) : filteredRegions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 6, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13 }}>
            No matching geographical data found.
          </div>
        ) : (
          filteredRegions.map((region) => {
            const isExpanded = expandedRegions.includes(region.id)
            const cSearch = constituencySearch[region.id] || ''
            const visibleConstituencies = (region.constituencies || []).filter(c =>
              c?.toLowerCase().includes(cSearch.toLowerCase())
            )

            return (
              <div key={region.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Region header row */}
                <div
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => toggleRegion(region.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 4, background: isExpanded ? 'hsl(var(--on-surface))' : 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17, color: isExpanded ? '#fff' : 'hsl(var(--on-surface-muted))' }}>location_on</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{region.name}</div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>{region.constituencies.length} constituencies</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'hsl(var(--accent))', color: '#fff', border: 'none', width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleAction('REGION_EDIT', region.name) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button
                      className="btn btn-dest btn-sm"
                      style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleAction('REGION_DELETE', region.name) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
                  </div>
                </div>

                {/* Expanded: constituency grid */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                        <input
                          value={cSearch}
                          onChange={e => setConstituencySearch(prev => ({ ...prev, [region.id]: e.target.value }))}
                          placeholder="Filter constituencies…"
                          style={inputSt}
                        />
                      </div>
                      <button className="btn btn-primary btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                        Define constituency
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                      {visibleConstituencies.map(con => (
                        <div
                          key={con}
                          className="group"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '8px 12px', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4 }}
                        >
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{con}</span>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'hsl(var(--accent))', color: '#fff', border: 'none', width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            onClick={() => handleAction('CONSTITUENCY_EDIT', region.name, con)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                          </button>
                        </div>
                      ))}
                      {visibleConstituencies.length === 0 && (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', padding: '16px 0' }}>No match found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
