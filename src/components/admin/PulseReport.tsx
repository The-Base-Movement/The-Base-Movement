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
        <h3 className="text-lg font-black font-meta uppercase tracking-tighter flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--brand-red)]" />
          Movement Pulse Report
        </h3>
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest border border-stone-100 px-2 py-1 bg-stone-50">
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 p-6 shadow-sm hover:border-[var(--brand-red)] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-4 h-4 text-stone-400 group-hover:text-[var(--brand-red)]" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+{pulse.nationalGrowth}%</span>
          </div>
          <div className="text-3xl font-black text-stone-900 leading-none mb-1">{pulse.nationalGrowth}%</div>
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">National Growth Wave</div>
        </div>

        <div className="bg-white border border-stone-200 p-6 shadow-sm hover:border-[var(--brand-red)] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-4 h-4 text-stone-400 group-hover:text-[var(--brand-red)]" />
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Live</span>
          </div>
          <div className="text-3xl font-black text-stone-900 leading-none mb-1">{pulse.activeChapters}</div>
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Chapters</div>
        </div>

        <div className="bg-white border border-stone-200 p-6 shadow-sm hover:border-[var(--brand-red)] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <MapIcon className="w-4 h-4 text-stone-400 group-hover:text-[var(--brand-red)]" />
            <span className="text-[10px] font-black text-[var(--brand-gold)] uppercase tracking-widest">Peak</span>
          </div>
          <div className="text-xl font-black text-stone-900 leading-none mb-1 truncate">{pulse.topPerformingRegion}</div>
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Top Performing Region</div>
        </div>

        <div className="bg-white border border-stone-200 p-6 shadow-sm hover:border-[var(--brand-red)] transition-all group">
          <div className="flex items-center justify-between mb-4">
            <ShieldCheck className="w-4 h-4 text-stone-400 group-hover:text-[var(--brand-red)]" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{pulse.logisticsHealth}%</span>
          </div>
          <div className="text-3xl font-black text-stone-900 leading-none mb-1">{pulse.logisticsHealth}%</div>
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Logistics Health</div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Regional Activation Matrix</span>
          <span className="text-[10px] font-bold text-stone-400 uppercase">Fidelity: High</span>
        </div>
        <div className="divide-y divide-stone-100">
          {pulse.regionalPulse.map((region) => (
            <div key={region.name} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-colors group cursor-default">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  region.status === 'Ascending' ? "bg-emerald-500 animate-pulse" : "bg-stone-300"
                )} />
                <span className="text-xs font-black uppercase tracking-tight text-stone-800">{region.name}</span>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="hidden md:block">
                  <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Activity Index</div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          region.activity > 90 ? "bg-[var(--brand-red)]" : "bg-[var(--brand-black)]"
                        )}
                        style={{ width: `${region.activity}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-stone-600">{region.activity}%</span>
                  </div>
                </div>

                <div className="text-right w-24">
                  <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Weekly Growth</div>
                  <div className={cn(
                    "text-[10px] font-black",
                    region.growth > 0 ? "text-emerald-500" : "text-stone-400"
                  )}>
                    +{region.growth}%
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
