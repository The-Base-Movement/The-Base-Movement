/**
 * ActionList.tsx
 * ─────────────────────────────────────────────────────────────────
 * Left sidebar scrollable list of field actions for Rally Command.
 *
 * Each item displays:
 *  - Status pill (e.g. "Live" in red, others muted)
 *  - Formatted start time (MMM dd, HH:mm)
 *  - Action title
 *  - Location name with pin icon
 *
 * The currently selected action is highlighted with a red left border
 * and a light container background.
 *
 * Props:
 *  actions        — All FieldAction records fetched from the DB
 *  selectedAction — The currently active/focused action (or null)
 *  onSelect       — Callback fired when user clicks an action row
 *
 * Data source: public.field_actions (via adminService.getFieldActions)
 */

import type { FieldAction } from '@/types/admin'
import { format } from 'date-fns'

interface ActionListProps {
  actions: FieldAction[]
  selectedAction: FieldAction | null
  onSelect: (action: FieldAction) => void
}

export function ActionList({ actions, selectedAction, onSelect }: ActionListProps) {
  return (
    <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Panel header */}
        <div className="ph" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11 }}>
            Field actions
          </span>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>
            bolt
          </span>
        </div>

        {/* Scrollable action list — max height keeps it contained */}
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => onSelect(action)}
              style={{
                padding: 24,
                cursor: 'pointer',
                // Red left border indicates the currently selected action
                borderLeft: `4px solid ${selectedAction?.id === action.id ? 'hsl(var(--destructive))' : 'transparent'}`,
                background: selectedAction?.id === action.id ? 'hsl(var(--container-low))' : 'transparent',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              {/* Status pill + start time row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span
                  className="pill"
                  style={{
                    background: action.status === 'Live' ? 'rgba(206, 17, 38, 0.1)' : 'hsl(var(--container-low))',
                    color: action.status === 'Live' ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
                    fontSize: 8,
                    fontWeight: 900,
                  }}
                >
                  {action.status}
                </span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))' }}>
                  {format(new Date(action.start_time), 'MMM dd, HH:mm')}
                </span>
              </div>

              {/* Action title */}
              <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))', margin: 0 }}>
                {action.title}
              </h3>

              {/* Location name with pin icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
                  location_on
                </span>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {action.location_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
