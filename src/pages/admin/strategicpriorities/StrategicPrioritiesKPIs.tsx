import { TacticalKPI } from '@/components/admin/TacticalKPI'
import type { DonationCampaign } from '@/types/admin'

interface StrategicPrioritiesKPIsProps {
  campaigns: DonationCampaign[]
  isMobile: boolean
}

export function StrategicPrioritiesKPIs({ campaigns, isMobile }: StrategicPrioritiesKPIsProps) {
  return (
    <div
      className="kpis"
      style={
        isMobile
          ? {
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              gap: 12,
              paddingBottom: 8,
              marginRight: -16,
              marginLeft: -16,
              paddingLeft: 16,
              paddingRight: 16,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }
          : undefined
      }
    >
      <div style={isMobile ? { flex: '0 0 240px', scrollSnapAlign: 'start' } : undefined}>
        <TacticalKPI
          label="Active priorities"
          value={campaigns.filter((c) => c.status === 'Active').length}
          description="Operational goals"
          variant="red"
        />
      </div>
      <div style={isMobile ? { flex: '0 0 240px', scrollSnapAlign: 'start' } : undefined}>
        <TacticalKPI
          label="Total Mobilized"
          value={`$${campaigns.reduce((acc, c) => acc + c.raisedAmount, 0).toLocaleString()}`}
          description="Gross resource intake"
          variant="gold"
        />
      </div>
      <div style={isMobile ? { flex: '0 0 240px', scrollSnapAlign: 'start' } : undefined}>
        <TacticalKPI
          label="Average progress"
          value={`${
            campaigns.length > 0
              ? (
                  (campaigns.reduce((acc, c) => acc + c.raisedAmount / c.targetAmount, 0) /
                    campaigns.length) *
                  100
                ).toFixed(0)
              : 0
          }%`}
          description="Mission completion"
          variant="black"
        />
      </div>
      <div style={isMobile ? { flex: '0 0 240px', scrollSnapAlign: 'start' } : undefined}>
        <TacticalKPI
          label="Upcoming deadlines"
          value={campaigns.filter((c) => new Date(c.endDate) > new Date()).length}
          description="Time-sensitive goals"
          variant="green"
        />
      </div>
    </div>
  )
}
