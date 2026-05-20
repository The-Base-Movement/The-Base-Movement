import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface BroadcastKPIsProps {
  isLoading: boolean
  totalCount: number
  urgentCount: number
}

export function BroadcastKPIs({ isLoading, totalCount, urgentCount }: BroadcastKPIsProps) {
  return (
    <div className="kpis">
      <TacticalKPI
        label="Communication"
        value={isLoading ? '—' : totalCount}
        description="Total deployments"
        trend={{ direction: 'neutral', value: 'Vault' }}
      />
      <TacticalKPI
        label="Priority"
        value={isLoading ? '—' : urgentCount}
        description="Urgent alerts"
        trend={{ direction: 'down', value: 'Critical' }}
      />
      <TacticalKPI
        label="Saturation"
        value="100%"
        description="Member reach"
        trend={{ direction: 'up', value: 'Pulse' }}
      />
      <TacticalKPI
        label="HQ Connection"
        value="24/7"
        description="Direct uplink"
        trend={{ direction: 'up', value: 'Online' }}
      />
    </div>
  )
}
