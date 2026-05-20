import type { FieldAction, RallyAttendance } from '@/types/admin'

interface OperationalMetricsProps {
  selectedAction: FieldAction
  attendance: RallyAttendance[]
}

interface MetricCardProps {
  label: string
  icon: string
  value: string | number
  sub: string
}

function MetricCard({ label, icon, value, sub }: MetricCardProps) {
  return (
    <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, color: 'hsl(var(--on-surface-muted))' }}>
          {label}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>
          {icon}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 9, fontWeight: 900, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>{sub}</p>
      </div>
    </div>
  )
}

export function OperationalMetrics({ selectedAction, attendance }: OperationalMetricsProps) {
  const verifiedCount = attendance.filter((a) => a.is_verified).length
  const targetAchievement = Math.round((attendance.length / (selectedAction.target_attendance || 1)) * 100)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
      <MetricCard
        label="Verified strength"
        icon="verified"
        value={verifiedCount}
        sub="Confirmed field personnel"
      />
      <MetricCard
        label="Check-in velocity"
        icon="timer"
        value={attendance.length}
        sub="Total signals received"
      />
      <MetricCard
        label="Target achievement"
        icon="flag"
        value={`${targetAchievement}%`}
        sub={`Goal: ${selectedAction.target_attendance}`}
      />
    </div>
  )
}
