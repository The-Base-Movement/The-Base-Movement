import { useState, useMemo } from 'react'
import Map, { Marker, NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox'
import type { LinePaint } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const CENTRAL_HUB = { lng: -0.1869, lat: 5.6037, name: 'Greater Accra' }

const GHANA_REGION_COORDS: Record<string, { lng: number; lat: number }> = {
  Northern: { lng: -0.8393, lat: 9.4007 },
  Ashanti: { lng: -1.6244, lat: 6.6666 },
  'Bono East': { lng: -1.0232, lat: 7.9465 },
  Bono: { lng: -2.3333, lat: 7.5833 },
  Eastern: { lng: -0.25, lat: 6.1667 },
  'Upper West': { lng: -2.1667, lat: 10.3333 },
  Savannah: { lng: -1.8167, lat: 9.1 },
  Oti: { lng: 0.2833, lat: 7.8 },
  'Western North': { lng: -2.8, lat: 6.3 },
  Western: { lng: -1.7554, lat: 4.8876 },
  Volta: { lng: 0.45, lat: 6.55 },
  Central: { lng: -1.25, lat: 5.2 },
  'North East': { lng: -0.4, lat: 10.3 },
  'Upper East': { lng: -0.85, lat: 10.75 },
  Ahafo: { lng: -2.5, lat: 6.9 },
  'Greater Accra': { lng: -0.1869, lat: 5.6037 },
}

interface LogisticsMapProps {
  data: { region: string; fulfillment_rate: number }[]
  token?: string
  routes?: { region: string; count: number }[]
  inventory?: { region: string; total_stock: number }[]
}

export function LogisticsMap({ data, token, routes = [], inventory = [] }: LogisticsMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null)

  const [viewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 6,
  })

  const markers = useMemo(
    () =>
      data
        .map((item) => {
          const coords = GHANA_REGION_COORDS[item.region]
          if (!coords) return null
          return { ...item, ...coords }
        })
        .filter(Boolean),
    [data]
  )

  const inventoryByRegion = useMemo(() => {
    const map: Record<string, number> = {}
    inventory.forEach((i) => {
      map[i.region] = i.total_stock
    })
    return map
  }, [inventory])

  const routeGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: routes
        .map((r) => {
          const dest = GHANA_REGION_COORDS[r.region]
          if (!dest) return null
          return {
            type: 'Feature' as const,
            properties: { count: r.count },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [CENTRAL_HUB.lng, CENTRAL_HUB.lat],
                [dest.lng, dest.lat],
              ],
            },
          }
        })
        .filter((f): f is NonNullable<typeof f> => f !== null),
    }),
    [routes]
  )

  const routeLinePaint = {
    'line-color': '#DAA520',
    'line-width': 1.5,
    'line-opacity': 0.55,
    'line-dasharray': [3, 2],
  }

  if (!token) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: 'rgba(0,0,0,0.2)',
          color: 'rgba(255,255,255,0.4)',
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
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              maxWidth: 280,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Mapbox API token not detected. Add{' '}
            <code
              style={{
                margin: '0 4px',
                padding: '1px 5px',
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
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Map
        initialViewState={viewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={token}
      >
        {/* Active dispatch routes */}
        {routes.length > 0 && (
          <Source id="dispatch-routes" type="geojson" data={routeGeoJSON}>
            <Layer
              id="dispatch-route-lines"
              type="line"
              paint={routeLinePaint as unknown as LinePaint}
            />
          </Source>
        )}

        <NavigationControl position="top-right" />
        <ScaleControl />

        {/* Central hub marker */}
        <Marker longitude={CENTRAL_HUB.lng} latitude={CENTRAL_HUB.lat}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
            }}
            onMouseEnter={() => setHoveredMarker('__hub')}
            onMouseLeave={() => setHoveredMarker(null)}
          >
            {hoveredMarker === '__hub' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  marginBottom: 6,
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-xs)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 2px',
                  }}
                >
                  Central Hub
                </p>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: '#fff',
                    margin: 0,
                  }}
                >
                  {routes.length} active route{routes.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                border: '2px solid #fff',
                boxShadow: '0 0 0 4px rgba(34,197,94,0.25)',
              }}
            />
          </div>
        </Marker>

        {/* Regional fulfillment + inventory markers */}
        {markers.map((m, i) => {
          const stock = inventoryByRegion[m!.region]
          const stockColor =
            stock === undefined
              ? 'rgba(255,255,255,0.3)'
              : stock > 50
                ? 'hsl(var(--primary))'
                : stock > 20
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--destructive))'

          return (
            <Marker key={i} longitude={m!.lng} latitude={m!.lat}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredMarker(m!.region)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {hoveredMarker === m!.region && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      marginBottom: 6,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.85)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius-xs)',
                      minWidth: 140,
                      zIndex: 10,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 9,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        margin: '0 0 6px',
                      }}
                    >
                      {m!.region}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Fulfillment
                      </span>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color:
                            m!.fulfillment_rate >= 80
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--accent))',
                        }}
                      >
                        {m!.fulfillment_rate}%
                      </span>
                    </div>
                    {stock !== undefined && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          Stock
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: stockColor,
                          }}
                        >
                          {stock} units
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: 6,
                        height: 2,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${m!.fulfillment_rate}%`,
                          height: '100%',
                          background:
                            m!.fulfillment_rate >= 80
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--accent))',
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Fulfillment dot */}
                <div
                  style={{
                    width: m!.fulfillment_rate >= 80 ? 10 : 8,
                    height: m!.fulfillment_rate >= 80 ? 10 : 8,
                    borderRadius: '50%',
                    background:
                      m!.fulfillment_rate >= 80 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />

                {/* Inventory indicator dot (bottom-right of fulfillment dot) */}
                {stock !== undefined && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: stockColor,
                      border: '1px solid rgba(0,0,0,0.4)',
                    }}
                  />
                )}

                <div
                  style={{
                    marginTop: 2,
                    padding: '1px 5px',
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-xs)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 8,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m!.region.split(' ')[0]}
                </div>
              </div>
            </Marker>
          )
        })}
      </Map>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {[
          { color: 'hsl(var(--primary))', label: 'Fulfillment ≥ 80%' },
          { color: 'hsl(var(--accent))', label: 'Fulfillment < 80%' },
          { color: '#DAA520', label: 'Active dispatch route', dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {dashed ? (
              <div
                style={{ width: 18, height: 1, borderTop: `2px dashed ${color}`, opacity: 0.8 }}
              />
            ) : (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 9,
                color: 'rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
