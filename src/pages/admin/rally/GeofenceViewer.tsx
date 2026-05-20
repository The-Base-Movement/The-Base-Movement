/**
 * GeofenceViewer.tsx
 * ─────────────────────────────────────────────────────────────────
 * Dark geo-fence visualization panel for the selected field action.
 *
 * Displays:
 *  - Action location name and geofence radius (from selectedAction)
 *  - Animated pulse ring (CSS `ping` animation) to simulate live monitoring
 *  - A center dot representing the geo-fence anchor point
 *  - A dot-grid background for a tactical map aesthetic
 *
 * This is currently a visual mock — it does NOT render a real map.
 * To integrate a real map (e.g. Google Maps, Mapbox, Leaflet):
 *  1. Add the map library to the project
 *  2. Replace the inner visualization div with a map component
 *  3. Use selectedAction.latitude / selectedAction.longitude as the center
 *  4. Draw a circle with radius = selectedAction.geofence_radius_meters
 *
 * Props:
 *  selectedAction — The active FieldAction (provides location_name and geofence_radius_meters)
 */

import type { FieldAction } from '@/types/admin'

interface GeofenceViewerProps {
  selectedAction: FieldAction
}

export function GeofenceViewer({ selectedAction }: GeofenceViewerProps) {
  return (
    <div
      className="panel"
      style={{ background: 'hsl(var(--on-surface))', color: '#fff', position: 'relative', overflow: 'hidden', height: 320 }}
    >
      {/* Dot grid decorative background — pure CSS, no images */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at center, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Panel header: location name + radius badge */}
      <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: 'hsl(var(--destructive))' }}>location_on</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900 }}>Geo-fence verification</h3>
            {/* Location name pulled from the selected field action */}
            <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
              {selectedAction.location_name}
            </p>
          </div>
        </div>
        {/* Radius badge — shows the geo-fence radius in metres */}
        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 2 }}>
          {selectedAction.geofence_radius_meters}m radius
        </span>
      </div>

      {/* Visualization area — replace this with a real map when ready */}
      <div style={{ height: 'calc(100% - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

        {/* Placeholder label (hidden in actual map integration) */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(255,255,255,0.05)' }}>explore</span>
          <p style={{ margin: '12px 0 0', fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>
            Satellite Engagement Visualization
          </p>
        </div>

        {/* Animated pulse ring — represents the geo-fence boundary */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px dashed rgba(206, 17, 38, 0.2)', animation: 'ping 3s infinite' }} />

        {/* Center anchor dot — represents the geo-fence center point */}
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(var(--destructive))', boxShadow: '0 0 20px hsl(var(--destructive))' }} />
      </div>
    </div>
  )
}
