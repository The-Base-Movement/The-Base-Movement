import type { FieldAction, RallyAttendance } from '@/types/admin'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface RallyKPIsProps {
  actions: FieldAction[]
  attendance: RallyAttendance[]
}

export function RallyKPIs({ actions, attendance }: RallyKPIsProps) {
  const verifiedCount = attendance.filter((a) => a.is_verified).length
  const verifiedRate = attendance.length > 0
    ? Math.round((verifiedCount / attendance.length) * 100)
    : 0

  return (
    <div className="kpis">
      <TacticalKPI
        label="Field Actions"
        value={actions.length}
        description="Scheduled & live"
        variant="black"
      />
      <TacticalKPI
        label="Live Now"
        value={actions.filter((a) => a.status === 'Live').length}
        description="Active points"
        variant="red"
      />
      <TacticalKPI
        label="Attendance"
        value={attendance.length}
        description="Manifested patriots"
        variant="gold"
      />
      <TacticalKPI
        label="Verified"
        value={`${verifiedRate}%`}
        description="Identity match rate"
        variant="green"
      />
    </div>
  )
}
