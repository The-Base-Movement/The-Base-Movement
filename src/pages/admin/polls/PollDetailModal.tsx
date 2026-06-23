/**
 * polls/PollDetailModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Portal modal showing full analytics for a selected poll.
 *
 * Displays:
 *  - Question text, region, time remaining (or end date), total votes
 *  - Vote breakdown: ranked options with percentage bars
 *    - Rank 1 highlighted in primary color; rank 2 in accent; rest muted
 *  - Total participation summary bar
 *  - Footer: "Delete Poll" destructive button + "Close" button
 *
 * Props:
 *  poll      — The Poll record to display (includes options[].votes)
 *  onClose   — Closes the modal (sets viewPoll = null in parent)
 *  onDelete  — Triggers delete flow for this poll
 *
 * Note: closing by clicking the backdrop is handled via onClick on the outer div.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { adminService, type Poll } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import { modalBackdrop, modalBox, modalCloseBtn } from './styles'
import { statusPill } from './statusPill'

interface PollDetailModalProps {
  poll: Poll
  onClose: () => void
  onDelete: (poll: Poll) => void
  onStatusChange: () => void
}

export function PollDetailModal({ poll, onClose, onDelete, onStatusChange }: PollDetailModalProps) {
  // Sort options by votes descending so #1 is always the leader
  const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
  const leadId = sorted[0]?.id

  const [closingPoll, setClosingPoll] = useState(false)

  // useState lazy initializer runs once on mount (not during render),
  // which is the correct way to capture Date.now() without breaking React's
  // purity rules. useMemo is still flagged because its callback CAN run
  // during render; useState's initializer is guaranteed to run only once.
  const [now] = useState<number>(() => Date.now())

  const handleClosePoll = async () => {
    setClosingPoll(true)
    try {
      const ok = await adminService.updatePollStatus(poll.id, 'Closed')
      if (!ok) {
        toast.error('Failed to close poll.')
        return
      }
      contentService.sendPushNotification({
        userIds: 'all',
        title: 'Poll closed — results are in',
        body: poll.question.slice(0, 100),
        url: '/dashboard/polls',
      })
      toast.success('Poll closed.')
      onStatusChange()
      onClose()
    } finally {
      setClosingPoll(false)
    }
  }
  const days = Math.max(0, Math.ceil((new Date(poll.endDate).getTime() - now) / 86400000))

  return createPortal(
    // Clicking backdrop closes modal
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox(580)} onClick={(e) => e.stopPropagation()}>
        {/* Header: title + status pill + close button */}
        <div className="ph">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13.5,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 15,
                color:
                  poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              }}
            >
              bar_chart
            </span>
            Poll Details
            {statusPill(poll.status)}
          </span>
          <button aria-label="Close poll details" style={modalCloseBtn} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Question + meta row */}
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.45,
                margin: '0 0 14px',
              }}
            >
              {poll.question}
            </p>
            {/* Region / time / votes meta chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                { icon: 'location_on', label: 'Region', value: poll.region },
                {
                  icon: 'schedule',
                  label:
                    poll.status === 'Active'
                      ? `Closes in ${days} day${days !== 1 ? 's' : ''}`
                      : 'End date',
                  value: poll.endDate,
                },
                { icon: 'group', label: 'Total votes', value: poll.totalVotes.toLocaleString() },
              ].map((m) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                  >
                    {m.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {m.label}:
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vote breakdown bars */}
          <div
            style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Vote Breakdown · {poll.options.length} options
            </p>
            {sorted.map((option, rank) => {
              const pct =
                poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
              const isLead = option.id === leadId
              return (
                <div key={option.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {/* Rank badge: #1 is primary colored */}
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 3,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10,
                          background:
                            rank === 0 ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                          color: rank === 0 ? '#fff' : 'hsl(var(--on-surface-muted))',
                          border: rank === 0 ? 'none' : '1px solid hsl(var(--border))',
                        }}
                      >
                        {rank + 1}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {option.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {option.votes.toLocaleString()} votes
                      </span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                          color: isLead ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                          minWidth: 36,
                          textAlign: 'right',
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar: #1=primary, #2=accent, rest=muted */}
                  <div
                    style={{
                      height: 6,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        transition: 'width 0.8s ease',
                        borderRadius: 3,
                        background:
                          rank === 0
                            ? 'hsl(var(--primary))'
                            : rank === 1
                              ? 'hsl(var(--accent))'
                              : 'hsl(var(--on-surface-muted))',
                        opacity: rank === 0 ? 1 : 0.55,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total participation summary */}
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Total participation
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--primary))',
              }}
            >
              {poll.totalVotes.toLocaleString()} votes
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
          <button
            className="btn btn-dest btn-sm"
            style={{ justifyContent: 'center' }}
            onClick={() => {
              onClose()
              onDelete(poll)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              delete
            </span>
            Delete Poll
          </button>
          {poll.status === 'Active' && (
            <button
              className="btn btn-outline-dest btn-sm"
              style={{ justifyContent: 'center' }}
              onClick={handleClosePoll}
              disabled={closingPoll}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                lock
              </span>
              {closingPoll ? 'Closing…' : 'Close Poll'}
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onClose}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
