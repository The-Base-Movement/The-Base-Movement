import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Clock, Flag, TrendingUp } from 'lucide-react'
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
            title: 'Phase 1: National Registration Launch',
            description: 'Initialization of the member database and official portal rollout.',
            target_date: '2026-04-30',
            status: 'Completed',
            category: 'Infrastructure',
            importance_level: 'Critical'
          },
          {
            id: '2',
            title: 'Regional HQ Establishment',
            description: 'Setting up physical mobilization offices across the 16 regions of Ghana.',
            target_date: '2026-06-15',
            status: 'In Progress',
            category: 'Mobilization',
            importance_level: 'High'
          }
        ])
      }
      setLoading(false)
    }
    fetchMilestones()
  }, [])

  if (loading) return null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
            <Flag className="w-5 h-5 text-[var(--brand-red)]" />
            National Strategic Roadmap
          </h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Our journey to building the Ghana we deserve.</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-100 sm:left-1/2 sm:-translate-x-1/2" />

        <div className="space-y-12">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className={cn(
              "relative flex flex-col sm:flex-row items-start sm:items-center gap-8",
              index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
            )}>
              {/* Timeline Node */}
              <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 z-10">
                <div className={cn(
                  "w-8 h-8 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all duration-500",
                  milestone.status === 'Completed' ? "bg-[var(--brand-green)] scale-110" : 
                  milestone.status === 'In Progress' ? "bg-[var(--brand-gold)] animate-pulse" : "bg-stone-200"
                )}>
                  {milestone.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  {milestone.status === 'In Progress' && <Clock className="w-4 h-4 text-white" />}
                  {milestone.status === 'Upcoming' && <Circle className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Content Card */}
              <div className={cn(
                "flex-1 ml-12 sm:ml-0 w-full",
                index % 2 === 0 ? "sm:pr-16 sm:text-right" : "sm:pl-16 sm:text-left"
              )}>
                <div className="bg-white p-6 border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                  <div className={cn(
                    "flex flex-col gap-2 mb-3",
                    index % 2 === 0 ? "sm:items-end" : "sm:items-start"
                  )}>
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                      milestone.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      milestone.status === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-stone-50 text-stone-400 border-stone-100"
                    )}>
                      {milestone.status}
                    </span>
                    <h4 className="text-sm font-black uppercase tracking-tight text-stone-900 group-hover:text-[var(--brand-red)] transition-colors">
                      {milestone.title}
                    </h4>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed mb-4">
                    {milestone.description}
                  </p>
                  <div className={cn(
                    "flex items-center gap-4 text-[9px] font-bold text-stone-400 uppercase tracking-widest",
                    index % 2 === 0 ? "sm:justify-end" : "sm:justify-start"
                  )}>
                    <span>{milestone.category}</span>
                    <span className="w-1 h-1 bg-stone-200 rounded-full" />
                    <span>Target: {new Date(milestone.target_date).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
                    {milestone.forecasted_date && (
                      <>
                        <span className="w-1 h-1 bg-stone-200 rounded-full" />
                        <span className="text-[var(--brand-green)] flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Forecast: {new Date(milestone.forecasted_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Spacer for the other side */}
              <div className="hidden sm:block flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
