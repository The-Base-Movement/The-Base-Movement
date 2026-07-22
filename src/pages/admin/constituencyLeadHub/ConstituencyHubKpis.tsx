import { StatTile } from '@/components/admin/StatTile'

interface ConstituencyHubKpisProps {
  memberCount: number
  verifiedCount: number
  activitiesCount: number
}

export function ConstituencyHubKpis({
  memberCount,
  verifiedCount,
  activitiesCount,
}: ConstituencyHubKpisProps) {
  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      <StatTile label="Members" value={memberCount} bar="hsl(var(--primary))" />
      <StatTile label="Verified" value={verifiedCount} bar="hsl(var(--accent))" />
      <StatTile label="Activities" value={activitiesCount} bar="hsl(var(--container-low))" />
    </div>
  )
}
