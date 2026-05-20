import { useState } from 'react'
import type { RegionalStat } from '@/types/admin'
import { REGION_PATHS } from '@/utils/mapUtils'

const REGION_COORDS: Record<string, { x: string; y: string }> = {
  'Upper West': { x: '22%', y: '15%' },
  'Upper East': { x: '55%', y: '10%' },
  'North East': { x: '60%', y: '15%' },
  Northern: { x: '50%', y: '25%' },
  Savannah: { x: '25%', y: '30%' },
  Bono: { x: '20%', y: '52%' },
  'Bono East': { x: '40%', y: '50%' },
  Oti: { x: '70%', y: '50%' },
  Ahafo: { x: '20%', y: '62%' },
  Ashanti: { x: '35%', y: '60%' },
  Eastern: { x: '50%', y: '70%' },
  Volta: { x: '75%', y: '70%' },
  'Western North': { x: '15%', y: '72%' },
  Western: { x: '20%', y: '85%' },
  Central: { x: '45%', y: '85%' },
  'Greater Accra': { x: '60%', y: '80%' },
}

interface WarRoomMapProps {
  regionalStats: RegionalStat[]
}

export function WarRoomMap({ regionalStats }: WarRoomMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<RegionalStat | null>(null)

  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(17,22,18,.5)',
        border: '1px solid #1c221e',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1c221e',
        }}
      >
        <h3
          style={{
            fontWeight: 800,
            fontSize: 12.5,
            color: 'white',
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Ghana · live ground game
        </h3>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.4)' }}>
          {regionalStats.length} regions tracked
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 450,
          background: 'radial-gradient(ellipse at center, #1c2620 0%, #0a0d0b 70%)',
        }}
      >
        <svg
          viewBox="0 0 400 500"
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet"
          stroke="#ffffff11"
          strokeWidth="0.5"
        >
          <g transform="scale(0.55) translate(45, 20)">
            {REGION_PATHS.map((r) => {
              const stat = regionalStats.find((s) => s.region.trim() === r.id)
              const fillColor = stat
                ? stat.performance === 'High'
                  ? 'rgba(0,107,63,0.3)'
                  : stat.performance === 'Medium'
                    ? 'rgba(218,165,32,0.3)'
                    : 'rgba(206,17,38,0.3)'
                : 'rgba(255,255,255,0.03)'
              return (
                <path
                  key={`path-${r.id}`}
                  id={r.id}
                  d={r.d}
                  fill={fillColor}
                  className="war-room-district"
                  onMouseEnter={() =>
                    setHoveredRegion(
                      stat || {
                        region: r.id,
                        memberCount: 0,
                        chapters: 0,
                        activePolls: 0,
                        performance: 'Low',
                        color: '',
                      }
                    )
                  }
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              )
            })}
          </g>
          <text
            x="200"
            y="240"
            textAnchor="middle"
            fontFamily="Public Sans"
            fontSize="12"
            fontWeight="800"
            fill="rgba(255,255,255,.08)"
          >
            Ghana
          </text>
        </svg>

        {/* Animated pins for regions */}
        {(() => {
          const seen = new Set()
          return regionalStats
            .filter((r) => REGION_COORDS[r.region])
            .filter((r) => {
              const rName = r.region.trim()
              if (seen.has(rName)) return false
              seen.add(rName)
              return true
            })
            .map((r) => {
              const coords = REGION_COORDS[r.region]
              const color =
                r.performance === 'High'
                  ? 'hsl(var(--primary))'
                  : r.performance === 'Medium'
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--destructive))'
              return (
                <div
                  key={r.region}
                  style={{
                    position: 'absolute',
                    left: coords.x,
                    top: coords.y,
                    transform: 'translate(-50%,-50%)',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        position: 'absolute',
                        background: color,
                        boxShadow: `0 0 0 2px rgba(0,0,0,.6), 0 0 12px ${color}`,
                      }}
                    />
                    {r.performance === 'Low' && (
                      <div
                        className="animate-ping"
                        style={{
                          position: 'absolute',
                          borderRadius: '50%',
                          border: '1px solid currentColor',
                          inset: -8,
                          color: color,
                          opacity: 0.6,
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: -10,
                        color: 'white',
                        fontSize: 8,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        padding: '2px 6px',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,.8)',
                        borderColor: '#1c221e',
                      }}
                    >
                      <span style={{ color }}>{r.region}</span> · {r.memberCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })
        })()}

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            display: 'flex',
            gap: 14,
            padding: '10px 12px',
            fontSize: 9.5,
            fontWeight: 800,
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,.7)',
            background: 'rgba(0,0,0,.6)',
            borderColor: '#1c221e',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                display: 'inline-block',
                background: 'hsl(var(--primary))',
              }}
            />
            Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                display: 'inline-block',
                background: 'hsl(var(--accent))',
              }}
            />
            Below target
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                display: 'inline-block',
                background: 'hsl(var(--destructive))',
              }}
            />
            Alert
          </span>
        </div>

        {/* Hover Tooltip */}
        {hoveredRegion && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              padding: 12,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.8)',
              zIndex: 50,
              pointerEvents: 'none',
              minWidth: 140,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 4,
              }}
            >
              {hoveredRegion.region}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'white',
                marginBottom: 8,
                lineHeight: 1,
              }}
            >
              {hoveredRegion.memberCount.toLocaleString()}{' '}
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                patriots
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  Chapters
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>
                  {hoveredRegion.chapters}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                  Pulse
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color:
                      hoveredRegion.performance === 'High'
                        ? 'hsl(var(--primary))'
                        : hoveredRegion.performance === 'Medium'
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--destructive))',
                  }}
                >
                  {hoveredRegion.performance}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
