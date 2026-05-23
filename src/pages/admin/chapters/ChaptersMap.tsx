import { useState } from 'react'
import type { Chapter } from '@/services/adminService'
import { REGION_PATHS, REGION_CENTERS, getChapterRegion } from '@/utils/mapUtils'

interface ChaptersMapProps {
  chapters: Chapter[]
  regionFilter: string
  onRegionFilterChange: (region: string) => void
  networkFilter: 'All' | 'Ghana' | 'Diaspora'
  onNetworkFilterChange: (network: 'All' | 'Ghana' | 'Diaspora') => void
  onPageChange: (page: number) => void
}

export function ChaptersMap({
  chapters,
  regionFilter,
  onRegionFilterChange,
  networkFilter,
  onNetworkFilterChange,
  onPageChange,
}: ChaptersMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="ph">
        <div>
          <h3>Regional chapter coverage</h3>
          <div className="meta">Where chapters exist and where gaps remain</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {regionFilter && (
            <button
              onClick={() => onRegionFilterChange('')}
              className="btn btn-outline btn-xs"
              style={{ height: 22, fontSize: 9 }}
            >
              Clear region filter
            </button>
          )}
          {[
            { color: 'hsl(var(--accent))', label: 'Selected hub' },
            { color: '#2a2a2a', label: 'Base region' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{ width: 9, height: 9, background: color, borderRadius: 2, flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + grid side-by-side */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: 20,
          padding: 0,
          overflow: 'hidden',
          alignItems: 'stretch',
          minHeight: 650,
        }}
      >
        {/* Map Column */}
        <div
          style={{
            flexShrink: 0,
            width: 420,
            minHeight: 650,
            background: 'hsl(var(--container-low))',
            padding: '24px 20px',
            borderRight: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <svg viewBox="0 0 600 900" style={{ width: '100%', height: '100%', display: 'block' }}>
            <g transform="translate(10, 10)">
              {REGION_PATHS.map((r) => {
                const regionChapters = chapters.filter((c) => getChapterRegion(c) === r.id)
                const hasActive = regionChapters.some((c) => c.status === 'Active')
                const hasPending = regionChapters.some((c) => c.status === 'Pending')
                const isActiveFilter = regionFilter.toLowerCase() === r.id.toLowerCase()

                const isSelected = isActiveFilter || hoveredRegion === r.id
                const fill = isSelected ? 'hsl(var(--accent))' : '#2a2a2a'
                const opacity = isSelected ? 1 : 0.6

                return (
                  <path
                    key={r.id}
                    d={r.d}
                    onMouseEnter={() => setHoveredRegion(r.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => {
                      const targetId = r.id
                      const isCurrentlySelected =
                        regionFilter.toLowerCase() === targetId.toLowerCase()
                      onRegionFilterChange(isCurrentlySelected ? '' : targetId)
                      onPageChange(1)
                      if (!isCurrentlySelected) {
                        onNetworkFilterChange('Ghana')
                      }
                    }}
                    style={{
                      fill,
                      fillOpacity: opacity,
                      stroke: isSelected ? 'hsl(var(--accent))' : 'rgba(255,255,255,0.1)',
                      strokeWidth: isSelected ? 3 : 0.5,
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      transition: 'all 0.2s ease-out',
                      filter: isSelected ? `drop-shadow(0 0 10px ${fill})` : 'none',
                    }}
                  >
                    <title>
                      {r.id} ·{' '}
                      {hasActive
                        ? `${regionChapters.filter((c) => c.status === 'Active').length} active chapter(s)`
                        : hasPending
                          ? 'Pending only'
                          : 'No chapter yet'}
                    </title>
                  </path>
                )
              })}

              {/* Pins for chapters */}
              {chapters.map((chapter, i) => {
                const derivedReg = getChapterRegion(chapter)
                const center = derivedReg ? REGION_CENTERS[derivedReg] : null
                if (!center) return null

                // Only show if network matches or All
                if (
                  networkFilter !== 'All' &&
                  networkFilter !== (chapter.country === 'Ghana' ? 'Ghana' : 'Diaspora')
                )
                  return null

                // Jitter logic based on index to spread pins
                const jitterX = (i % 6) * 6 - 15
                const jitterY = (Math.floor(i / 4) % 6) * 6 - 15

                return (
                  <g
                    key={chapter.id}
                    transform={`translate(${center.x + jitterX}, ${center.y + jitterY})`}
                  >
                    <circle
                      r={chapter.status === 'Active' ? 5 : 4}
                      fill={
                        chapter.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
                      }
                      stroke="#fff"
                      strokeWidth={1.5}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    />
                    {chapter.status === 'Active' && (
                      <circle
                        r={8}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={1}
                        strokeOpacity={0.3}
                      >
                        <animate
                          attributeName="r"
                          from="5"
                          to="12"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="stroke-opacity"
                          from="0.5"
                          to="0"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Coverage grid column */}
        <div
          style={{
            flex: 1,
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 2,
            alignContent: 'start',
          }}
        >
          {REGION_PATHS.map((r) => {
            const regionChapters = chapters.filter((c) => getChapterRegion(c) === r.id)
            const activeCount = regionChapters.filter((c) => c.status === 'Active').length
            const pendingCount = regionChapters.filter((c) => c.status === 'Pending').length
            const hasActive = activeCount > 0
            const hasPending = pendingCount > 0
            const dotColor = hasActive
              ? 'hsl(var(--primary))'
              : hasPending
                ? 'hsl(var(--accent))'
                : 'hsl(var(--border))'
            const label = hasActive
              ? `${activeCount} active${pendingCount > 0 ? `, ${pendingCount} pending` : ''}`
              : hasPending
                ? `${pendingCount} pending`
                : 'No chapter'
            return (
              <div
                key={r.id}
                onClick={() => {
                  const newFilter = regionFilter.toLowerCase() === r.id.toLowerCase() ? '' : r.id
                  onRegionFilterChange(newFilter)
                  onPageChange(1)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 4,
                  background:
                    regionFilter.toLowerCase() === r.id.toLowerCase() || hoveredRegion === r.id
                      ? 'hsl(var(--container-low))'
                      : 'transparent',
                  transition: 'all 0.1s',
                  cursor: 'pointer',
                  border:
                    regionFilter.toLowerCase() === r.id.toLowerCase()
                      ? '1px solid hsl(var(--primary))'
                      : '1px solid transparent',
                }}
                onMouseEnter={() => setHoveredRegion(r.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 2,
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontFamily: "'Public Sans', sans-serif",
                      color:
                        regionFilter.toLowerCase() === r.id.toLowerCase()
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--on-surface))',
                    }}
                  >
                    {r.id}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: hasActive
                      ? 'hsl(var(--primary))'
                      : hasPending
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
