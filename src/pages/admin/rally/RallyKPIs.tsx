/**
 * RallyKPIs.tsx
 * ─────────────────────────────────────────────────────────────────
 * Top-level KPI stats strip for the Rally Command page.
 *
 * Displays 4 TacticalKPI cards:
 *  1. Field Actions  — Total number of field actions (scheduled + live)
 *  2. Live Now       — Actions currently in 'Live' status
 *  3. Attendance     — Total check-ins in the currently selected action's manifest
 *  4. Verified       — % of check-ins that have been geo-verified or manually verified
 *
 * Props:
 *  actions    — Full list of FieldAction records from public.field_actions
 *  attendance — Attendance records for the currently selected action
 *
 * Depends on: TacticalKPI (src/components/admin/TacticalKPI.tsx)
 */

import type { FieldAction, RallyAttendance } from '@/types/admin'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

interface RallyKPIsProps {
  actions: FieldAction[]
  attendance: RallyAttendance[]
}

export function RallyKPIs({ actions, attendance }: RallyKPIsProps) {
  // Derive verified attendance count and percentage
  const verifiedCount = attendance.filter((a) => a.is_verified).length
  const verifiedRate =
    attendance.length > 0 ? Math.round((verifiedCount / attendance.length) * 100) : 0

  return (
    <div className="kpis">
      {/* Total field actions across all statuses */}
      <TacticalKPI
        label="Field Actions"
        value={actions.length}
        description="Scheduled & live"
        variant="black"
      />

      {/* Count of actions currently marked as 'Live' */}
      <TacticalKPI
        label="Live Now"
        value={actions.filter((a) => a.status === 'Live').length}
        description="Active points"
        variant="red"
      />

      {/* Total check-ins for the selected action */}
      <TacticalKPI
        label="Attendance"
        value={attendance.length}
        description="Manifested compatriots"
        variant="gold"
      />

      {/* Percentage of check-ins that are verified */}
      <TacticalKPI
        label="Verified"
        value={`${verifiedRate}%`}
        description="Identity match rate"
        variant="green"
      />
    </div>
  )
}
