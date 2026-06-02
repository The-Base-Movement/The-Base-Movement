/**
 * polls/PollsMobileCards.tsx
 * ─────────────────────────────────────────────────────────────────
 * Mobile-only poll list rendered as swipeable cards.
 * Shown via .mobile-only class (hidden on desktop).
 *
 * States:
 *  - Loading: 3 skeleton card placeholders
 *  - Empty:   "No matching polls found." message panel
 *  - Data:    One card per filtered poll with:
 *               - Question + ID + status pill
 *               - Participant count with icon
 *               - Horizontal progress bar
 *               - End date + "Manage Campaign" / Delete buttons
 *
 * Props:
 *  polls         — Filtered polls array
 *  isLoading     — Drives skeleton state
 *  searchQuery   — Controlled search input value
 *  onSearchChange— Updates parent searchQuery state
 *  onView        — Opens PollDetailModal for selected poll
 *  onDelete      — Triggers delete confirmation for selected poll
 */

import type { Poll } from '@/services/adminService'
import { inputSt } from './styles'
import { statusPill } from './statusPill'
import { SortToggle } from '@/components/ui/SortToggle'

interface PollsMobileCardsProps {
  polls: Poll[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (v: string) => void
  sortOrder: 'asc' | 'desc'
  onSortChange: (v: 'asc' | 'desc') => void
  onView: (poll: Poll) => void
  onDelete: (poll: Poll) => void
}

export function PollsMobileCards({
  polls,
  isLoading,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  onView,
  onDelete,
}: PollsMobileCardsProps) {
  return (
    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Mobile search & sort bar */}
      <div className="panel">
        <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search polls…"
              name="searchQuery"
              id="input-2d822f"
              style={{ ...inputSt, paddingLeft: 34 }}
              placeholder="Search polls…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <SortToggle value={sortOrder} onChange={onSortChange} />
        </div>
      </div>

      {/* Skeleton loading cards */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="panel"
            style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{
                height: 14,
                background: 'hsl(var(--container-low))',
                borderRadius: 3,
                width: '75%',
              }}
            />
            <div
              style={{
                height: 10,
                background: 'hsl(var(--container-low))',
                borderRadius: 3,
                width: '50%',
              }}
            />
            <div style={{ height: 34, background: 'hsl(var(--container-low))', borderRadius: 4 }} />
          </div>
        ))
      ) : polls.length === 0 ? (
        // Empty state
        <div
          className="panel"
          style={{
            padding: 40,
            textAlign: 'center',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No matching polls found.
        </div>
      ) : (
        // Poll cards
        polls.map((poll) => (
          <div
            key={poll.id}
            className="panel"
            style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Title + status pill */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.4,
                    marginBottom: 3,
                  }}
                >
                  {poll.question}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {poll.id}
                </div>
              </div>
              {statusPill(poll.status)}
            </div>

            {/* Participation count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                >
                  group
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Field participants
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {poll.totalVotes.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: 'hsl(var(--border))',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%',
                  background:
                    poll.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                  transition: 'width 1s',
                }}
              />
            </div>

            {/* Meta row: verified label + expiry date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                HQ Verified
              </span>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Expires
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {poll.endDate}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: 'hsl(var(--accent))',
                  color: '#fff',
                }}
                onClick={() => onView(poll)}
              >
                Manage Campaign
              </button>
              <button
                className="btn btn-dest"
                style={{ width: 44, padding: 0, justifyContent: 'center' }}
                onClick={() => onDelete(poll)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  delete
                </span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
