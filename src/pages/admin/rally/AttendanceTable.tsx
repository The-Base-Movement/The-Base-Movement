/**
 * AttendanceTable.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full attendance manifest table for the currently selected field action.
 *
 * Columns:
 *  - Member       — Avatar initial + full name
 *  - Signal time  — Check-in timestamp formatted as HH:mm:ss
 *  - Status       — "Verified" (green) or "Pending" (amber) badge
 *  - Actions      — "Manual Verify" button for unverified entries
 *
 * The search input is currently UI-only (no filter logic wired yet).
 * To enable filtering, lift `searchQuery` state up or manage locally.
 *
 * Props:
 *  attendance     — Array of attendance records for the selected action
 *  selectedAction — The active FieldAction (used for context/display)
 *  verifying      — ID of the record currently being verified (drives loading state)
 *  onVerify       — Callback to trigger manual verification for a record by ID
 *
 * Data source: public.rally_attendance (via adminService.getFieldActionAttendance)
 * Mutation:    adminService.verifyRallyAttendance → sets is_verified = true
 */

import type { FieldAction, RallyAttendance } from '@/types/admin'
import { format } from 'date-fns'

interface AttendanceTableProps {
  attendance: RallyAttendance[]
  selectedAction: FieldAction
  verifying: string | null
  onVerify: (id: string) => void
}

/** Shared th cell style to avoid repetition across column headers */
const thStyle: React.CSSProperties = {
  padding: '14px 24px',
  textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 900,
  fontSize: 9,
  color: 'hsl(var(--on-surface-muted))',
}

export function AttendanceTable({ attendance, verifying, onVerify }: AttendanceTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Table header: title, description, and search input */}
      <div className="ph" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))' }}>
            Attendance manifest
          </span>
          <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))' }}>
            Verified check-ins via geo-fenced signals
          </p>
        </div>

        {/* Search input — TODO: wire up filter logic to filter attendance rows */}
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>
            search
          </span>
          <input
            aria-label="Search member"
            name="name-66c057"
            id="input-66c057"
            style={{ height: 38, width: 240, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12 }}
            placeholder="Search member..."
          />
        </div>
      </div>

      {/* Attendance data table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
          <tr>
            <th style={thStyle}>Member</th>
            <th style={thStyle}>Signal time</th>
            <th style={thStyle}>Status</th>
            {/* Right-aligned for the action button */}
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Empty state — shown when no check-ins exist for this action */}
          {attendance.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 60, textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                No signals detected for this action
              </td>
            </tr>
          ) : (
            attendance.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>

                {/* Member column: avatar initial + name */}
                <td style={{ padding: '14px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar: first letter of user_name as initials placeholder */}
                    <div style={{ width: 32, height: 32, borderRadius: 4, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                      {entry.user_name?.charAt(0)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{entry.user_name}</span>
                  </div>
                </td>

                {/* Check-in timestamp */}
                <td style={{ padding: '14px 24px', fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
                  {format(new Date(entry.check_in_time), 'HH:mm:ss')}
                </td>

                {/* Verification status badge */}
                <td style={{ padding: '14px 24px' }}>
                  {entry.is_verified ? (
                    // Verified: green icon + label
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--primary))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                      <span style={{ fontSize: 9, fontWeight: 900 }}>Verified</span>
                    </div>
                  ) : (
                    // Pending: amber hourglass + label
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--accent))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hourglass_empty</span>
                      <span style={{ fontSize: 9, fontWeight: 900 }}>Pending</span>
                    </div>
                  )}
                </td>

                {/* Manual verify CTA — only shown for unverified entries */}
                <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                  {!entry.is_verified && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onVerify(entry.id)}
                      disabled={verifying === entry.id} // Disable while this specific row is being verified
                    >
                      {verifying === entry.id ? 'Verifying...' : 'Manual Verify'}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
