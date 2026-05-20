/**
 * polls/PollsTable.tsx
 * ─────────────────────────────────────────────────────────────────
 * Desktop-only polls data table for the Engagement Hub.
 *
 * Columns: Campaign title | Responses (with mini bar) | Region | Status | End date | Actions
 *
 * States:
 *  - Loading: renders 5 skeleton rows
 *  - Empty:   shows "No matching polls found" message
 *  - Data:    renders a row per filtered poll with hover highlight
 *
 * Row actions:
 *  - Delete icon button → calls onDelete(poll)
 *  - More/manage button → calls onView(poll) to open the detail modal
 *
 * Props:
 *  polls     — Filtered array of Poll records to display
 *  isLoading — Drives skeleton state
 *  onDelete  — Handler for deleting a poll
 *  onView    — Handler for viewing/managing a poll (opens PollDetailModal)
 *  searchQuery      — Controlled search value
 *  onSearchChange   — Callback to update parent searchQuery state
 *
 * Data source: public.polls (via adminService.getPolls)
 */

import type { Poll } from '@/services/adminService'
import { thSt, tdSt, inputSt } from './styles'
import { statusPill } from './statusPill'

interface PollsTableProps {
  polls: Poll[]
  isLoading: boolean
  onDelete: (poll: Poll) => void
  onView: (poll: Poll) => void
  searchQuery: string
  onSearchChange: (v: string) => void
}

export function PollsTable({ polls, isLoading, onDelete, onView, searchQuery, onSearchChange }: PollsTableProps) {
  return (
    <div className="panel desktop-only">
      {/* Panel header with search */}
      <div className="ph">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}>bar_chart</span>
          Campaign Management
          {!isLoading && (
            <span className="meta">{polls.length} record{polls.length !== 1 ? 's' : ''}</span>
          )}
        </span>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>
            search
          </span>
          <input
            aria-label="Search polls…"
            name="searchQuery"
            id="input-91cd45"
            style={{ ...inputSt, paddingLeft: 34, width: 210, height: 34 }}
            placeholder="Search polls…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Campaign title</th>
              <th style={{ ...thSt, textAlign: 'center' }}>Responses</th>
              <th style={thSt}>Region</th>
              <th style={thSt}>Status</th>
              <th style={thSt}>End date</th>
              <th style={{ ...thSt, textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {/* Skeleton loading rows */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))', width: '75%' }} /></td>
                  <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                  <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                  <td style={tdSt}><div style={{ height: 22, borderRadius: 3, background: 'hsl(var(--container-low))', width: 60 }} /></td>
                  <td style={tdSt}><div style={{ height: 13, borderRadius: 3, background: 'hsl(var(--container-low))' }} /></td>
                  <td style={{ ...tdSt, textAlign: 'right' }}><div style={{ height: 30, width: 70, borderRadius: 4, background: 'hsl(var(--container-low))', marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : polls.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                  No matching polls found in the campaign hub.
                </td>
              </tr>
            ) : (
              // Data rows
              polls.map((poll) => (
                <tr
                  key={poll.id}
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  {/* Title + ID */}
                  <td style={tdSt}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--on-surface))', lineHeight: 1.4 }}>
                      {poll.question}
                    </div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
                      {poll.id}
                    </div>
                  </td>

                  {/* Responses with mini progress bar */}
                  <td style={{ ...tdSt, textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                      {poll.totalVotes.toLocaleString()}
                    </div>
                    <div style={{ width: 80, height: 3, background: 'hsl(var(--border))', borderRadius: 2, margin: '6px auto 0', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%',
                        background: poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                        transition: 'width 1s',
                      }} />
                    </div>
                  </td>

                  {/* Region */}
                  <td style={tdSt}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                      {poll.region}
                    </span>
                  </td>

                  {/* Status with dot indicator */}
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }} />
                      {statusPill(poll.status)}
                    </div>
                  </td>

                  {/* End date */}
                  <td style={tdSt}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                      {poll.endDate}
                    </div>
                  </td>

                  {/* Row actions */}
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-dest btn-sm" style={{ width: 34, padding: 0, justifyContent: 'center' }} onClick={() => onDelete(poll)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                      <button className="btn btn-sm" style={{ background: 'hsl(var(--accent))', color: '#fff', width: 34, padding: 0, justifyContent: 'center' }} onClick={() => onView(poll)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>more_vert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
