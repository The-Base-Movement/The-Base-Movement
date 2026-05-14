import { useState, useEffect } from 'react'
import { adminService, type MovementPulse } from '@/services/adminService'
import { cn } from '@/lib/utils'

export function PulseReport() {
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPulse() {
      try {
        const data = await adminService.getMovementPulse()
        setPulse(data)
      } catch (error) {
        console.error('[PULSE] Data fetch failed:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPulse()
  }, [])

  if (loading || !pulse) {
    return (
      <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
        <span className="material-symbols-outlined animate-spin" style={{ color: 'hsl(var(--primary))' }}>refresh</span>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>
          Synchronizing pulse telemetry...
        </p>
      </div>
    )
  }

  const kpis = [
    { label: 'National Growth', value: `${pulse.nationalGrowth}%`, change: `+${pulse.nationalGrowth}%`, trend: 'up', icon: 'trending_up' },
    { label: 'Active Chapters', value: pulse.activeChapters.toString(), change: 'Live', trend: 'neutral', icon: 'groups' },
    { label: 'Top Region', value: pulse.topPerformingRegion, change: 'Peak', trend: 'up', icon: 'star' },
    { label: 'Logistics Health', value: `${pulse.logisticsHealth}%`, change: 'Stable', trend: 'neutral', icon: 'shield_with_heart' }
  ]

  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3>Movement Pulse</h3>
          <div className="meta">Real-time mobilization telemetry · Updated {new Date().toLocaleDateString()}</div>
        </div>
        <button className="btn btn-outline btn-sm">
          Detailed Analysis
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((stat) => (
            <div key={stat.label} className="panel" style={{ padding: '16px', background: 'hsl(var(--container-low))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: 'hsl(var(--primary))', fontSize: '20px' }}>
                  {stat.icon}
                </span>
                <span className={cn(
                  "pill",
                  stat.trend === 'up' ? "pill-ok" : stat.trend === 'down' ? "pill-dest" : "pill-mute"
                )}>
                  {stat.change}
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Public Sans', letterSpacing: '-0.02em', color: 'hsl(var(--on-surface))' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Regional Activation Matrix
            </span>
            <span className="pill pill-mute">Fidelity: High</span>
          </div>
          
          <div className="space-y-4">
            {pulse.regionalPulse.map((region) => (
              <div key={region.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      region.activity > 80 ? "bg-primary animate-pulse" : "bg-muted-foreground/20"
                    )} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--on-surface))' }}>{region.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'hsl(var(--primary))' }}>+{region.growth}% growth</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>{region.activity}% velocity</span>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'hsl(var(--container-low))', borderRadius: '2px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${region.activity}%`, 
                      background: region.activity > 90 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', 
                      transition: 'width 1s ease' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
