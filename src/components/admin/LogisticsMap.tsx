import { useState, useMemo } from 'react'
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { cn } from '@/lib/utils'

// Approximate Lat/Lng for Ghana's 16 Regions
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
}

export function LogisticsMap({ data, token }: LogisticsMapProps) {
  const [viewState, setViewState] = useState({
    longitude: -1.0232,
    latitude: 7.9465,
    zoom: 6,
  })

  const markers = useMemo(() => {
    return data
      .map((item) => {
        const coords = GHANA_REGION_COORDS[item.region]
        if (!coords) return null
        return {
          ...item,
          ...coords,
        }
      })
      .filter(Boolean)
  }, [data])

  if (!token) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 text-white/40"
        style={{ height: '100%', background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
          map
        </span>
        <div className="text-center px-8">
          <p className="font-meta font-bold text-xs uppercase tracking-widest mb-2 text-white/60">
            GIS Engine Offline
          </p>
          <p className="text-sm max-w-xs mx-auto leading-relaxed">
            Mapbox API token not detected in environment. Please add
            <code className="mx-1 px-1 bg-white/10 rounded">VITE_MAPBOX_TOKEN</code>
            to your configuration to activate high-fidelity tracking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={token}
      >
        <NavigationControl position="top-right" />
        <ScaleControl />

        {markers.map((m, i) => (
          <Marker key={i} longitude={m!.lng} latitude={m!.lat} anchor="bottom">
            <div className="group relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                <div className="bg-on-surface border border-white/10 px-3 py-2 rounded shadow-2xl min-w-[140px]">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    {m!.region} Sector
                  </p>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-xs text-white/80">Fulfillment</span>
                    <span
                      className={cn(
                        'text-xs font-bold',
                        m!.fulfillment_rate >= 80 ? 'text-brand-green' : 'text-brand-gold'
                      )}
                    >
                      {m!.fulfillment_rate}%
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-1000',
                        m!.fulfillment_rate >= 80 ? 'bg-brand-green' : 'bg-brand-gold'
                      )}
                      style={{ width: `${m!.fulfillment_rate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Marker Dot */}
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125',
                  m!.fulfillment_rate >= 80 ? 'bg-brand-green' : 'bg-brand-gold'
                )}
              />
              <div className="mt-1 px-2 py-0.5 bg-on-surface/80 backdrop-blur-sm border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-tight">
                {m!.region.split(' ')[0]}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  )
}
