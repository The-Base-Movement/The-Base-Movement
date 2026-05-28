import { useState } from 'react'
import type { FieldAction, RallyAttendance } from '@/types/admin'
import { format } from 'date-fns'

interface AttendanceTableProps {
  attendance: RallyAttendance[]
  selectedAction: FieldAction
  verifying: string | null
  onVerify: (id: string) => void
}

const thStyle: React.CSSProperties = {
  padding: '14px 24px',
  textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 9,
  color: 'hsl(var(--on-surface-muted))',
}

export function AttendanceTable({ attendance, verifying, onVerify }: AttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery.trim()
    ? attendance.filter((e) => e.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : attendance

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Table header: title, description, and search input */}
      <div
        className="ph"
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 11,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Attendance manifest
          </span>
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 9,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Verified check-ins via geo-fenced signals
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            aria-label="Search member"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              height: 38,
              width: 240,
              paddingLeft: 34,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              borderRadius: 4,
              outline: 'none',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
            }}
            placeholder="Search member..."
          />
        </div>
      </div>

      {/* Attendance data table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead
          style={{
            background: 'hsl(var(--container-low))',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <tr>
            <th style={thStyle}>Member</th>
            <th style={thStyle}>Signal time</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: 60,
                  textAlign: 'center',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : 'No signals detected for this action'}
              </td>
            </tr>
          ) : (
            filtered.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {/* Member column: avatar initial + name */}
                <td style={{ padding: '14px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                      }}
                    >
                      {entry.user_name?.charAt(0)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 'var(--font-weight-semibold, 600)' }}>
                      {entry.user_name}
                    </span>
                  </div>
                </td>

                {/* Check-in timestamp */}
                <td
                  style={{
                    padding: '14px 24px',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {format(new Date(entry.check_in_time), 'HH:mm:ss')}
                </td>

                {/* Verification status badge */}
                <td style={{ padding: '14px 24px' }}>
                  {entry.is_verified ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        verified_user
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 'var(--font-weight-medium, 500)' }}>
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'hsl(var(--accent))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        pending
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 'var(--font-weight-medium, 500)' }}>
                        Pending
                      </span>
                    </div>
                  )}
                </td>

                {/* Manual verify action */}
                <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                  {!entry.is_verified && (
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={verifying === entry.id}
                      onClick={() => onVerify(entry.id)}
                    >
                      {verifying === entry.id ? 'Verifying…' : 'Manual Verify'}
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
