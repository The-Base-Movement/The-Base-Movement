import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface MembersKPIsProps {
  isLoading: boolean
  total: number
  active: number
  pending: number
  regions: number
}

export function MembersKPIs({ isLoading, total, active, pending, regions }: MembersKPIsProps) {
  return (
    <div className="kpis">
      <TacticalKPI
        label="Intelligence"
        value={isLoading ? '—' : total.toLocaleString()}
        variant="black"
        description="Verified citizens registered nationwide in the movement database"
      />
      <TacticalKPI
        label="Members"
        value={isLoading ? '—' : active.toLocaleString()}
        variant="gold"
        description="Active mobilization personnel with verified administrative status"
      />
      <TacticalKPI
        label="Verification"
        value={isLoading ? '—' : pending.toLocaleString()}
        variant="green"
        description="Members currently awaiting strategic identity validation"
      />
      <TacticalKPI
        label="Coverage"
        value={isLoading ? '—' : regions.toLocaleString()}
        variant="gold"
        description="Operational presence across all administrative regions of Ghana"
      />
    </div>
  )
}
