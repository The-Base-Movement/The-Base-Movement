import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Users, Map as MapIcon, ShieldCheck, ChevronRight } from 'lucide-react'
import { adminService, type MovementPulse } from '@/services/adminService'
import { cn } from '@/lib/utils'

export function PulseReport() {
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPulse() {
      const data = await adminService.getMovementPulse()
      setPulse(data)
      setLoading(false)
    }
    fetchPulse()
  }, [])

  if (loading || !pulse) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-meta tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-destructive" />
          Movement pulse report
        </h3>
        <span className="text-micro font-bold text-muted-foreground/40 tracking-tight border border-border/10 px-2 py-1 bg-muted/5 rounded-lg">
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border/40 p-6 shadow-sm hover:border-destructive transition-all group rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground/40 group-hover:text-destructive" />
            <span className="text-micro font-bold text-primary tracking-tight">+{pulse.nationalGrowth}%</span>
          </div>
          <div className="text-3xl font-bold text-on-surface leading-none mb-1 tracking-tight">{pulse.nationalGrowth}%</div>
          <div className="text-micro font-bold text-muted-foreground/40 tracking-tight">National growth wave</div>
        </div>

        <div className="bg-white border border-border/40 p-6 shadow-sm hover:border-destructive transition-all group rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-4 h-4 text-muted-foreground/40 group-hover:text-destructive" />
            <span className="text-micro font-bold text-muted-foreground/40 tracking-tight">Live</span>
          </div>
          <div className="text-3xl font-bold text-on-surface leading-none mb-1 tracking-tight">{pulse.activeChapters}</div>
          <div className="text-micro font-bold text-muted-foreground/40 tracking-tight">Active chapters</div>
        </div>

        <div className="bg-white border border-border/40 p-6 shadow-sm hover:border-destructive transition-all group rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <MapIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-destructive" />
            <span className="text-micro font-bold text-accent tracking-tight">Peak</span>
          </div>
          <div className="text-xl font-bold text-on-surface leading-none mb-1 truncate tracking-tight">{pulse.topPerformingRegion}</div>
          <div className="text-micro font-bold text-muted-foreground/40 tracking-tight">Top performing region</div>
        </div>

        <div className="bg-white border border-border/40 p-6 shadow-sm hover:border-destructive transition-all group rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <ShieldCheck className="w-4 h-4 text-muted-foreground/40 group-hover:text-destructive" />
            <span className="text-micro font-bold text-primary tracking-tight">{pulse.logisticsHealth}%</span>
          </div>
          <div className="text-3xl font-bold text-on-surface leading-none mb-1 tracking-tight">{pulse.logisticsHealth}%</div>
          <div className="text-micro font-bold text-muted-foreground/40 tracking-tight">Logistics health</div>
        </div>
      </div>

      <div className="bg-white border border-border/40 shadow-sm overflow-hidden rounded-sm">
        <div className="p-4 bg-muted/5 border-b border-border/10 flex items-center justify-between">
          <span className="text-micro font-bold tracking-tight text-on-surface/60">Regional activation matrix</span>
          <span className="text-micro font-bold text-muted-foreground/40">Fidelity: High</span>
        </div>
        <div className="divide-y divide-border/10">
          {pulse.regionalPulse.map((region) => (
            <div key={region.name} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors group cursor-default">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  region.status === 'Ascending' ? "bg-primary animate-pulse" : "bg-muted-foreground/20"
                )} />
                <span className="text-xs font-bold tracking-tight text-on-surface">{region.name}</span>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="hidden md:block">
                  <div className="text-micro font-bold text-muted-foreground/40 tracking-tight mb-1">Activity index</div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-muted/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          region.activity > 90 ? "bg-destructive" : "bg-on-surface"
                        )}
                        style={{ width: `${region.activity}%` }}
                      />
                    </div>
                    <span className="text-micro font-bold text-on-surface/60 tracking-tight">{region.activity}%</span>
                  </div>
                </div>

                <div className="text-right w-24">
                  <div className="text-micro font-bold text-muted-foreground/40 tracking-tight mb-1">Weekly growth</div>
                  <div className={cn(
                    "text-micro font-bold tracking-tight",
                    region.growth > 0 ? "text-primary" : "text-muted-foreground/40"
                  )}>
                    +{region.growth}%
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-on-surface/40 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
