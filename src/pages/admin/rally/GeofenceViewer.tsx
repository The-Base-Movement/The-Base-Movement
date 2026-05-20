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
      {/* Dot grid bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at center, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Header bar */}
      <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: 'hsl(var(--destructive))' }}>location_on</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900 }}>Geo-fence verification</h3>
            <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
              {selectedAction.location_name}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 2 }}>
          {selectedAction.geofence_radius_meters}m radius
        </span>
      </div>

      {/* Visualization */}
      <div style={{ height: 'calc(100% - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(255,255,255,0.05)' }}>explore</span>
          <p style={{ margin: '12px 0 0', fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>
            Satellite Engagement Visualization
          </p>
        </div>
        {/* Pulse ring */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px dashed rgba(206, 17, 38, 0.2)', animation: 'ping 3s infinite' }} />
        {/* Center dot */}
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(var(--destructive))', boxShadow: '0 0 20px hsl(var(--destructive))' }} />
      </div>
    </div>
  )
}
