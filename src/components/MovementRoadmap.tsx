import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, Flag, TrendingUp, Target, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminService, type Milestone } from '@/services/adminService'

export function MovementRoadmap() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMilestones() {
      const data = await adminService.getRoadmapForecast()
      if (data && data.length > 0) {
        setMilestones(data)
      } else {
        // Fallback to strategic defaults if table is empty
        setMilestones([
          {
            id: '1',
            title: 'Phase 1: National Portal Rollout',
            description: 'Initialization of the member database and official portal activation for all sixteen regions.',
            target_date: '2026-04-30',
            status: 'Completed',
            category: 'Infrastructure',
            importance_level: 'Critical'
          },
          {
            id: '2',
            title: 'Phase 2: Regional Chapter Offices',
            description: 'Establishing physical community centers and mobilization offices across the sixteen regions.',
            target_date: '2026-06-15',
            status: 'In Progress',
            category: 'Mobilization',
            importance_level: 'High'
          },
          {
            id: '3',
            title: 'Phase 3: National Policy Summit',
            description: 'A collaborative gathering of grassroots leaders to finalize our economic and civic blueprints.',
            target_date: '2026-08-20',
            status: 'Upcoming',
            category: 'Policy',
            importance_level: 'High'
          },
          {
            id: '4',
            title: 'Phase 4: Community Outreach Expansion',
            description: 'Onboarding and supporting 100,000 certified community organizers for local engagement.',
            target_date: '2026-10-10',
            status: 'Upcoming',
            category: 'Mobilization',
            importance_level: 'Critical'
          }
        ])
      }
      setLoading(false)
    }
    fetchMilestones()
  }, [])

  if (loading) return null

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-on-surface flex items-center gap-3 m-0">
            <span className="p-2 bg-[var(--brand-red)]/10 rounded-none">
              <Flag className="w-6 h-6 text-[var(--brand-red)]" />
            </span>
            National Strategic <span className="text-[var(--brand-green)]">Roadmap</span>
          </h2>
          <p className="text-xs font-bold text-on-surface/40 mt-3 ml-12">
            The architected path to building the Ghana we deserve.
          </p>
        </div>
        <div className="flex items-center gap-4 ml-12 md:ml-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--brand-green-rgb))' }} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgb(var(--brand-green-rgb))' }}>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--brand-gold-rgb))' }} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgb(var(--brand-gold-rgb))' }}>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(var(--brand-red-rgb))' }} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'rgb(var(--brand-red-rgb))' }}>Future</span>
          </div>
        </div>
      </div>

      <div className="relative pt-8 pb-12">
        {/* Solid Gradient Connection Line */}
        <div className="absolute left-6 top-0 bottom-0 w-[4px] sm:left-1/2 sm:-translate-x-1/2 overflow-hidden bg-stone-100 rounded-full">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-green-full)] via-[var(--brand-gold-full)] to-[var(--brand-red-full)]" />
        </div>

        <div className="space-y-24">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className={cn(
              "relative flex flex-col sm:flex-row items-start sm:items-center gap-12",
              index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
            )}>
              {/* Strategic Node with High Visibility */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 z-20">
                <div 
                  className={cn(
                    "w-14 h-14 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all duration-700 relative z-10",
                    milestone.status === 'In Progress' && "animate-pulse shadow-[0_0_40px_rgba(var(--brand-gold-rgb),0.6)]"
                  )}
                  style={{
                    backgroundColor: index === 0 ? 'rgb(var(--brand-green-rgb))' : 
                                     index === milestones.length - 1 ? 'rgb(var(--brand-red-rgb))' : 
                                     'rgb(var(--brand-gold-rgb))'
                  }}
                >
                  <div className="relative z-20">
                    {milestone.status === 'Completed' && <CheckCircle2 className="w-7 h-7 text-white stroke-[4px]" />}
                    {milestone.status === 'In Progress' && <Clock className="w-7 h-7 text-white stroke-[4px]" />}
                    {milestone.status === 'Upcoming' && <Target className="w-7 h-7 text-white stroke-[4px]" />}
                  </div>
                  
                  {milestone.status === 'In Progress' && (
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                  )}
                </div>
              </div>

              {/* Information Portal Card with Movement Gradient Border */}
              <div className={cn(
                "flex-1 ml-20 sm:ml-0 w-full group",
                index % 2 === 0 ? "sm:pr-24 sm:text-right" : "sm:pl-24 sm:text-left"
              )}>
                <div className="bg-white p-8 border-t-[5px] border-t-transparent relative shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Top Gradient Border Overlay */}
                  <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
                  
                  {/* Strategic Watermark */}
                  <div className="absolute top-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <TrendingUp className="w-24 h-24 rotate-[-15deg]" />
                  </div>

                  <div className={cn(
                    "flex flex-col gap-3 mb-6",
                    index % 2 === 0 ? "sm:items-end" : "sm:items-start"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em]",
                        milestone.status === 'Completed' ? "bg-[var(--brand-green)] text-white" : 
                        milestone.status === 'In Progress' ? "bg-[var(--brand-gold)] text-white" : "bg-stone-800 text-white"
                      )}>
                        {milestone.status}
                      </span>
                      <span className="text-[9px] font-black text-on-surface/20 uppercase tracking-widest">{milestone.category}</span>
                    </div>
                    <h4 className="text-lg font-black italic tracking-tighter text-on-surface group-hover:text-[var(--brand-red)] transition-colors leading-tight">
                      {milestone.title}
                    </h4>
                  </div>

                  <p className="text-sm text-on-surface/60 leading-relaxed font-medium mb-6">
                    {milestone.description}
                  </p>

                  <div className={cn(
                    "flex flex-wrap items-center gap-4 pt-6 border-t border-stone-50 text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.1em]",
                    index % 2 === 0 ? "sm:justify-end" : "sm:justify-start"
                  )}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[var(--brand-red)]" />
                      <span>Launch: {new Date(milestone.target_date).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    {milestone.forecasted_date && (
                      <>
                        <div className="w-1 h-1 bg-stone-200 rounded-full" />
                        <div className="flex items-center gap-2 text-[var(--brand-green)] bg-[var(--brand-green)]/5 px-2 py-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Fulfillment: {new Date(milestone.forecasted_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Structural Balance Spacer */}
              <div className="hidden sm:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



