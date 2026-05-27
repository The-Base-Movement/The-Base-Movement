import { useState, useMemo, useEffect, useRef } from 'react'
import type { Chapter } from '@/services/adminService'
import {
  REGION_PATHS,
  GHANA_REGION_COORDS,
  getChapterRegion,
  getDiasporaCoords,
} from '@/utils/mapUtils'
import Map, { Marker, NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox'
import type { MapMouseEvent, MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

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
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const mapRef = useRef<MapRef>(null)

  const [viewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 5.5,
  })

  useEffect(() => {
    if (regionFilter) {
      const ghanaCoords = GHANA_REGION_COORDS[regionFilter]
      const diasporaCoords = getDiasporaCoords({
        city_or_region: regionFilter,
        country: regionFilter,
      })

      if (ghanaCoords) {
        mapRef.current?.flyTo({
          center: [ghanaCoords.lng, ghanaCoords.lat],
          zoom: 7.5,
          duration: 1500,
        })
      } else if (diasporaCoords) {
        mapRef.current?.flyTo({
          center: [diasporaCoords.lng, diasporaCoords.lat],
          zoom: 6,
          duration: 1500,
        })
      }
    } else {
      if (networkFilter === 'Diaspora' || networkFilter === 'All') {
        mapRef.current?.flyTo({ center: [10, 20], zoom: 1.5, duration: 1500 })
      } else {
        mapRef.current?.flyTo({ center: [-1.0232, 7.9465], zoom: 5.5, duration: 1500 })
      }
    }
  }, [networkFilter, regionFilter])

  const chapterMarkers = useMemo(() => {
    return chapters
      .map((chapter, i) => {
        let baseCoords: { lat: number; lng: number } | null = null

        if (chapter.latitude !== undefined && chapter.longitude !== undefined) {
          baseCoords = { lat: chapter.latitude, lng: chapter.longitude }
        } else {
          if (chapter.country === 'Ghana') {
            const derivedReg = getChapterRegion(chapter)
            if (derivedReg) {
              baseCoords = GHANA_REGION_COORDS[derivedReg]
            }
          } else {
            baseCoords = getDiasporaCoords(chapter)
          }
        }

        if (!baseCoords) return null

        if (
          networkFilter !== 'All' &&
          networkFilter !== (chapter.country === 'Ghana' ? 'Ghana' : 'Diaspora')
        )
          return null

        const jitterLng = (i % 6) * 0.08 - 0.2
        const jitterLat = (Math.floor(i / 4) % 6) * 0.08 - 0.2

        return {
          ...chapter,
          lng: baseCoords.lng + jitterLng,
          lat: baseCoords.lat + jitterLat,
        }
      })
      .filter(Boolean)
  }, [chapters, networkFilter])

  const gridLocations = useMemo(() => {
    const ghanaLocs = REGION_PATHS.map((r) => ({ id: r.id, label: r.id, type: 'ghana' }))
    const diasporaChapters = chapters.filter((c) => c.country !== 'Ghana')
    const uniqueDiaspora = Array.from(
      new Set(diasporaChapters.map((c) => c.city_or_region || c.country))
    )
      .filter(Boolean)
      .sort()
    const diasporaLocs = uniqueDiaspora.map((loc) => ({ id: loc, label: loc, type: 'diaspora' }))

    if (networkFilter === 'Diaspora') return diasporaLocs
    if (networkFilter === 'Ghana') return ghanaLocs
    return [...ghanaLocs, ...diasporaLocs]
  }, [chapters, networkFilter])

  const onMouseMove = (event: MapMouseEvent) => {
    const feature = event.features && event.features[0]
    if (feature && feature.properties && feature.properties.region) {
      setHoveredRegion(feature.properties.region)
    } else {
      setHoveredRegion(null)
    }
  }

  const onMapClick = (event: MapMouseEvent) => {
    const feature = event.features && event.features[0]
    if (feature && feature.properties && feature.properties.region) {
      const targetId = feature.properties.region
      const isCurrentlySelected = regionFilter.toLowerCase() === targetId.toLowerCase()
      onRegionFilterChange(isCurrentlySelected ? '' : targetId)
      onPageChange(1)
      if (!isCurrentlySelected) {
        onNetworkFilterChange('Ghana')
      }
    }
  }

  const fillPaint = {
    'fill-color': [
      'case',
      ['==', ['get', 'region'], regionFilter || ''],
      '#DAA520',
      ['==', ['get', 'region'], hoveredRegion || ''],
      '#DAA520',
      '#2a2a2a',
    ],
    'fill-opacity': [
      'case',
      ['==', ['get', 'region'], regionFilter || ''],
      0.8,
      ['==', ['get', 'region'], hoveredRegion || ''],
      0.6,
      0.3,
    ],
  }

  const linePaint = {
    'line-color': [
      'case',
      ['==', ['get', 'region'], regionFilter || ''],
      '#DAA520',
      ['==', ['get', 'region'], hoveredRegion || ''],
      '#DAA520',
      'rgba(255,255,255,0.1)',
    ],
    'line-width': [
      'case',
      ['==', ['get', 'region'], regionFilter || ''],
      2,
      ['==', ['get', 'region'], hoveredRegion || ''],
      2,
      0.5,
    ],
  }

  const title =
    networkFilter === 'Diaspora'
      ? 'Diaspora chapter coverage'
      : networkFilter === 'Ghana'
        ? 'Regional chapter coverage'
        : 'Global chapter coverage'

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      {/* Panel header — title, meta, and legend each on their own row */}
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <h3>{title}</h3>
          <div className="meta">Where chapters exist and where gaps remain</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { color: 'hsl(var(--accent))', label: 'Selected hub' },
            { color: '#2a2a2a', label: 'Base region' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  background: color,
                  borderRadius: 'var(--radius-xs)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}
              </span>
            </div>
          ))}
          {regionFilter && (
            <button
              onClick={() => onRegionFilterChange('')}
              className="btn btn-outline btn-xs"
              style={{ height: 22, fontSize: 9 }}
            >
              Clear region filter
            </button>
          )}
        </div>
      </div>

      {/* Map + coverage grid — stacks on mobile via .chapters-density-split CSS */}
      <div
        className="chapters-density-split"
        style={{ display: 'flex', overflow: 'hidden', alignItems: 'stretch' }}
      >
        {/* Map column */}
        <div
          style={{
            flexShrink: 0,
            width: 400,
            minHeight: 380,
            background: 'hsl(var(--container-low))',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {mapboxToken ? (
            <div
              style={{
                flex: 1,
                minHeight: 320,
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Map
                ref={mapRef}
                initialViewState={viewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={mapboxToken}
                interactiveLayerIds={['ghana-regions-fill']}
                onMouseMove={onMouseMove}
                onClick={onMapClick}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <Source id="ghana-regions" type="geojson" data="/data/ghana_regions.geojson">
                  <Layer
                    id="ghana-regions-fill"
                    type="fill"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    paint={fillPaint as any}
                  />
                  <Layer
                    id="ghana-regions-line"
                    type="line"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    paint={linePaint as any}
                  />
                </Source>

                <NavigationControl position="top-right" />
                <ScaleControl />

                {chapterMarkers.map((m) => (
                  <Marker key={m!.id} longitude={m!.lng} latitude={m!.lat}>
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setHoveredMarkerId(m!.id)}
                      onMouseLeave={() => setHoveredMarkerId(null)}
                    >
                      <div
                        style={{
                          width: m!.status === 'Active' ? 10 : 8,
                          height: m!.status === 'Active' ? 10 : 8,
                          borderRadius: '50%',
                          background:
                            m!.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                      />
                      {hoveredMarkerId === m!.id && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            marginTop: 4,
                            padding: '2px 8px',
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 9,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontFamily: "'Public Sans', sans-serif",
                            color: '#fff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                          }}
                        >
                          {m!.city_or_region}
                        </div>
                      )}
                    </div>
                  </Marker>
                ))}
              </Map>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                flex: 1,
                minHeight: 280,
                color: 'rgba(255,255,255,0.4)',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                map
              </span>
              <div style={{ textAlign: 'center', padding: '0 32px' }}>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 8,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  GIS Engine Offline
                </p>
                <p
                  style={{
                    fontSize: 13,
                    maxWidth: 280,
                    margin: '0 auto',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Mapbox API token not detected in environment. Please add{' '}
                  <code
                    style={{
                      margin: '0 4px',
                      padding: '0 4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    VITE_MAPBOX_TOKEN
                  </code>{' '}
                  to activate high-fidelity tracking.
                </p>
              </div>
            </div>
          )}
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
            maxHeight: 500,
            overflowY: 'auto',
          }}
        >
          {gridLocations.map((loc) => {
            const regionChapters = chapters.filter((c) => {
              if (loc.type === 'diaspora') {
                return (
                  c.country !== 'Ghana' && (c.city_or_region === loc.id || c.country === loc.id)
                )
              }
              return getChapterRegion(c) === loc.id
            })
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
                key={`${loc.type}-${loc.id}`}
                onClick={() => {
                  const newFilter =
                    regionFilter.toLowerCase() === loc.id.toLowerCase() ? '' : loc.id
                  onRegionFilterChange(newFilter)
                  onPageChange(1)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background:
                    regionFilter.toLowerCase() === loc.id.toLowerCase() || hoveredRegion === loc.id
                      ? 'hsl(var(--container-low))'
                      : 'transparent',
                  transition: 'all 0.1s',
                  cursor: 'pointer',
                  border:
                    regionFilter.toLowerCase() === loc.id.toLowerCase()
                      ? '1px solid hsl(var(--primary))'
                      : '1px solid transparent',
                }}
                onMouseEnter={() => loc.type === 'ghana' && setHoveredRegion(loc.id)}
                onMouseLeave={() => loc.type === 'ghana' && setHoveredRegion(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 'var(--radius-xs)',
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: "'Public Sans', sans-serif",
                      color:
                        regionFilter.toLowerCase() === loc.id.toLowerCase()
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--on-surface))',
                    }}
                  >
                    {loc.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
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
