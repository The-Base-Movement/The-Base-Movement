import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface SentimentKPIsProps {
  nationalScore: number
  feedbackLength: number
  criticalAlerts: number
  projectedReach: number
}

export function SentimentKPIs({
  nationalScore,
  feedbackLength,
  criticalAlerts,
  projectedReach,
}: SentimentKPIsProps) {
  return (
    <div className="kpis">
      <TacticalKPI
        label="National Score"
        value={(nationalScore * 100).toFixed(1)}
        description="Average sentiment"
        variant="black"
      />
      <TacticalKPI
        label="Total Intercepts"
        value={feedbackLength}
        description="Member feedback"
        variant="gold"
      />
      <TacticalKPI
        label="Critical Alerts"
        value={criticalAlerts}
        description="Requires attention"
        variant="red"
      />
      <TacticalKPI
        label="Projected Reach"
        value={projectedReach.toLocaleString()}
        description="30-day forecast"
        variant="green"
      />
    </div>
  )
}
