/**
 * OperationalMetrics.tsx
 * ─────────────────────────────────────────────────────────────────
 * 3-column metric cards for the currently selected field action.
 *
 * Cards:
 *  1. Verified Strength   — Count of attendance records with is_verified = true
 *  2. Check-in Velocity   — Total attendance signals received (verified + pending)
 *  3. Target Achievement  — % of target_attendance filled (e.g. 45/100 = 45%)
 *
 * Props:
 *  selectedAction — The active FieldAction (used for target_attendance and context)
 *  attendance     — Attendance records for the selected action
 *
 * Internal:
 *  MetricCard — Reusable card sub-component (label, icon, value, sub-text)
 */

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

/** Reusable metric card: top label + icon, large value, small sub-label */
function MetricCard({ label, icon, value, sub }: MetricCardProps) {
  return (
    <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Label and icon row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, color: 'hsl(var(--on-surface-muted))' }}>
          {label}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>
          {icon}
        </span>
      </div>

      {/* Main numeric value + sub-label */}
      <div>
        <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 9, fontWeight: 900, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>{sub}</p>
      </div>
    </div>
  )
}

export function OperationalMetrics({ selectedAction, attendance }: OperationalMetricsProps) {
  // Number of attendance entries that have been verified
  const verifiedCount = attendance.filter((a) => a.is_verified).length

  // Percentage of the target_attendance goal that has been reached
  const targetAchievement = Math.round((attendance.length / (selectedAction.target_attendance || 1)) * 100)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
      {/* How many confirmed patriots are on the ground */}
      <MetricCard
        label="Verified strength"
        icon="verified"
        value={verifiedCount}
        sub="Confirmed field personnel"
      />

      {/* Total check-in signals received (includes pending) */}
      <MetricCard
        label="Check-in velocity"
        icon="timer"
        value={attendance.length}
        sub="Total signals received"
      />

      {/* % of the attendance target reached for this action */}
      <MetricCard
        label="Target achievement"
        icon="flag"
        value={`${targetAchievement}%`}
        sub={`Goal: ${selectedAction.target_attendance}`}
      />
    </div>
  )
}
