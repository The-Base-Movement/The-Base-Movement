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
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
  const mapRef = useRef<MapRef>(null)

  const [viewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 5.5,
  })

  // Automatically adjust map view based on network filter and selected region
  useEffect(() => {
    if (regionFilter) {
      // Find coordinates for the selected region
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
      // Fallback to overview if no region selected
      if (networkFilter === 'Diaspora' || networkFilter === 'All') {
        mapRef.current?.flyTo({ center: [10, 20], zoom: 1.5, duration: 1500 })
      } else {
        mapRef.current?.flyTo({ center: [-1.0232, 7.9465], zoom: 5.5, duration: 1500 })
      }
    }
  }, [networkFilter, regionFilter])

  // Pre-calculate chapter markers with jitter
  const chapterMarkers = useMemo(() => {
    return chapters
      .map((chapter, i) => {
        let baseCoords: { lat: number; lng: number } | null = null

        // Priority 1: Exact coordinates from database
        if (chapter.latitude !== undefined && chapter.longitude !== undefined) {
          baseCoords = { lat: chapter.latitude, lng: chapter.longitude }
        } else {
          // Priority 2: Fallback dictionaries
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

        // Add small jitter to latitude/longitude so pins don't perfectly overlap
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

  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="ph">
        <div>
          <h3>
            {networkFilter === 'Diaspora'
              ? 'Diaspora chapter coverage'
              : networkFilter === 'Ghana'
                ? 'Regional chapter coverage'
                : 'Global chapter coverage'}
          </h3>
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
          {mapboxToken ? (
            <div className="relative w-full h-full rounded-md overflow-hidden border border-white/5">
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
                      className="group relative flex flex-col items-center"
                      style={{ cursor: 'pointer' }}
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
                      <div className="mt-1 px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                        {m!.city_or_region}
                      </div>
                    </div>
                  </Marker>
                ))}
              </Map>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/40 h-full bg-black/20 rounded-md border border-white/5">
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                map
              </span>
              <div className="text-center px-8">
                <p className="font-meta font-bold text-xs uppercase tracking-widest mb-2 text-white/60">
                  GIS Engine Offline
                </p>
                <p className="text-sm max-w-xs mx-auto leading-relaxed">
                  Mapbox API token not detected in environment. Please add{' '}
                  <code className="mx-1 px-1 bg-white/10 rounded">VITE_MAPBOX_TOKEN</code> to
                  activate high-fidelity tracking.
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
                  borderRadius: 4,
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
