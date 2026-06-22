/**
 * TicketFilters Component
 * -------------------------------------------------------------
 * Render filters block for support tickets, including tabbed selectors for status
 * with item counts, and dropdown filter options for priority levels.
 */

import type { TicketFiltersState, TicketStatus, TicketPriority } from './types'

const STATUSES: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

interface Props {
  filters: TicketFiltersState
  onChange: (f: TicketFiltersState) => void
  counts: Record<string, number>
}

/**
 * TicketFilters
 * -------------------------------------------------------------
 * Displays status filters with counts and priority level dropdown filter options.
 */
export function TicketFilters({ filters, onChange, counts }: Props) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
    >
      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            className={filters.status === s.value ? 'btn-active-tab' : 'btn-inactive-tab'}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: "'Public Sans', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            onClick={() => onChange({ ...filters, status: s.value })}
          >
            {s.label}
            {s.value !== 'all' && counts[s.value] != null && (
              <span
                style={{
                  fontSize: 10,
                  background:
                    filters.status === s.value
                      ? 'rgba(255,255,255,0.25)'
                      : 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-pill)',
                  padding: '1px 6px',
                }}
              >
                {counts[s.value]}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) =>
          onChange({ ...filters, priority: e.target.value as TicketPriority | 'all' })
        }
        style={{
          padding: '6px 10px',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          fontFamily: "'Public Sans', sans-serif",
          background: 'hsl(var(--background))',
          color: 'hsl(var(--on-surface))',
        }}
      >
        <option value="all">All priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  )
}
