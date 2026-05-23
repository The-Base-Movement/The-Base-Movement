import type { Region } from '@/services/adminService'
import { inputSt, type ConEntry, type ConMap } from './utils'

interface RegionsListProps {
  filteredRegions: Region[]
  conMap: ConMap
  expandedRegions: number[]
  toggleRegion: (id: number) => void
  constituencySearch: Record<number, string>
  setConstituencySearch: React.Dispatch<React.SetStateAction<Record<number, string>>>
  isLoading: boolean
  setInputValue: (v: string) => void
  setEditRegionModal: (m: { id: number; name: string } | null) => void
  setDeleteRegionModal: (m: { id: number; name: string } | null) => void
  setAddConModal: (m: { regionId: number; regionName: string } | null) => void
  setEditConModal: (m: { id: string; name: string; regionName: string } | null) => void
  setDeleteConModal: (m: { id: string; name: string; regionName: string } | null) => void
}

export function RegionsList({
  filteredRegions,
  conMap,
  expandedRegions,
  toggleRegion,
  constituencySearch,
  setConstituencySearch,
  isLoading,
  setInputValue,
  setEditRegionModal,
  setDeleteRegionModal,
  setAddConModal,
  setEditConModal,
  setDeleteConModal,
}: RegionsListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel" style={{ padding: '16px 20px' }}>
            <div
              style={{
                height: 14,
                background: 'hsl(var(--border))',
                borderRadius: 4,
                width: 140,
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (filteredRegions.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px dashed hsl(var(--border))',
          borderRadius: 6,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 13,
        }}
      >
        No matching geographical data found.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {filteredRegions.map((region) => {
        const isExpanded = expandedRegions.includes(region.id)
        const cSearch = constituencySearch[region.id] || ''
        const cons: ConEntry[] = (conMap[region.id] || [])
          .filter((c) => c.name.toLowerCase().includes(cSearch.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name))

        return (
          <div key={region.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Region header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
              }}
              onClick={() => toggleRegion(region.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: isExpanded ? 'hsl(var(--on-surface))' : 'hsl(var(--container-low))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 16,
                      color: isExpanded ? '#fff' : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    location_on
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    {region.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '2px 0 0',
                    }}
                  >
                    {(conMap[region.id] || []).length} constituencies
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-sm"
                  style={{
                    background: 'hsl(var(--accent))',
                    color: '#000',
                    border: 'none',
                    width: 32,
                    height: 32,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInputValue(region.name)
                    setEditRegionModal({ id: region.id, name: region.name })
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    edit
                  </span>
                </button>
                <button
                  className="btn btn-dest btn-sm"
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteRegionModal({ id: region.id, name: region.name })
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    delete
                  </span>
                </button>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: 'hsl(var(--on-surface-muted))',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                  }}
                >
                  chevron_right
                </span>
              </div>
            </div>

            {/* Expanded: constituency grid */}
            {isExpanded && (
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  padding: '14px 16px',
                }}
              >
                {/* Controls row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        left: 9,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 14,
                        color: 'hsl(var(--on-surface-muted))',
                        pointerEvents: 'none',
                      }}
                    >
                      search
                    </span>
                    <input
                      name="cSearch"
                      id="input-c34fe2"
                      value={cSearch}
                      onChange={(e) =>
                        setConstituencySearch((prev) => ({
                          ...prev,
                          [region.id]: e.target.value,
                        }))
                      }
                      placeholder="Filter constituencies…"
                      style={{ ...inputSt, paddingLeft: 30, height: 34, fontSize: 12 }}
                    />
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setInputValue('')
                      setAddConModal({ regionId: region.id, regionName: region.name })
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      add
                    </span>
                    Define constituency
                  </button>
                </div>

                {/* Constituency grid */}
                {cons.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      padding: '16px 0',
                      margin: 0,
                    }}
                  >
                    {cSearch ? 'No match found.' : 'No constituencies defined yet.'}
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 8,
                    }}
                  >
                    {cons.map((con) => (
                      <div
                        key={con.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          padding: '8px 10px',
                          background: '#fff',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 4,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {con.name}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            className="btn btn-sm"
                            style={{
                              background: 'hsl(var(--accent))',
                              color: '#000',
                              border: 'none',
                              width: 26,
                              height: 26,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() => {
                              setInputValue(con.name)
                              setEditConModal({
                                id: con.id,
                                name: con.name,
                                regionName: region.name,
                              })
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              edit
                            </span>
                          </button>
                          <button
                            className="btn btn-dest btn-sm"
                            style={{
                              width: 26,
                              height: 26,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onClick={() =>
                              setDeleteConModal({
                                id: con.id,
                                name: con.name,
                                regionName: region.name,
                              })
                            }
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              delete
                            </span>
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
  )
}
