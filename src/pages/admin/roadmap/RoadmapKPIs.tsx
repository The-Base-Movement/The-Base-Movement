import type { Milestone } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface RoadmapKPIsProps {
  milestones: Milestone[]
}

export function RoadmapKPIs({ milestones }: RoadmapKPIsProps) {
  const completedCount = milestones.filter((m) => m.status === 'Completed').length
  const inProgressCount = milestones.filter((m) => m.status === 'In Progress').length
  const upcomingCount = milestones.filter((m) => m.status === 'Upcoming').length
  const completionRate = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : 0

  return (
    <div className="kpis">
      <TacticalKPI
        label="Total Milestones"
        value={milestones.length}
        description="Strategic objectives"
        trend={{ direction: 'neutral', value: 'Live' }}
      />
      <TacticalKPI
        label="Completion Rate"
        value={`${completionRate}%`}
        description="Verified achieved"
        trend={{ direction: 'up', value: 'Optimal' }}
      />
      <TacticalKPI
        label="Active Operations"
        value={inProgressCount}
        description="In mobilization"
        trend={{ direction: 'up', value: 'Active' }}
      />
      <TacticalKPI label="Upcoming Phases" value={upcomingCount} description="Strategic pipeline" />
    </div>
  )
}
