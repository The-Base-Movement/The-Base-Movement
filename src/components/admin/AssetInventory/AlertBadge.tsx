/**
 * AlertBadge Component
 * -------------------------------------------------------------
 * Displays a small visual warning badge for assets with specific alerts
 * such as overdue return, damaged condition, or missing status.
 */

interface Props {
  type: 'overdue' | 'damaged' | 'missing'
}

const LABELS = { overdue: 'Overdue', damaged: 'Damaged', missing: 'Missing' }

/**
 * AlertBadge
 * -------------------------------------------------------------
 * Renders warning icon badge indicating the type of asset issue.
 */
export function AlertBadge({ type }: Props) {
  return (
    <span
      title={LABELS[type]}
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, color: 'hsl(var(--destructive))' }}
      >
        warning
      </span>
    </span>
  )
}
