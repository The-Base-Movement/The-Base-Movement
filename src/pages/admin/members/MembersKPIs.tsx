import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface MembersKPIsProps {
  isLoading: boolean
  total: number
  recentJoins: number
  active: number
  pending: number
  regions: number
}

export function MembersKPIs({
  isLoading,
  total,
  recentJoins,
  active,
  pending,
  regions,
}: MembersKPIsProps) {
  return (
    <div className="kpis">
      <TacticalKPI
        label="Intelligence"
        value={isLoading ? '—' : total.toLocaleString()}
        variant="black"
        description="Verified citizens registered nationwide in the movement database"
        trend={{
          direction: recentJoins > 0 ? 'up' : 'neutral',
          value:
            recentJoins > 0
              ? `${recentJoins.toLocaleString()} joined in last 24h`
              : 'No new members in last 24h',
        }}
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
