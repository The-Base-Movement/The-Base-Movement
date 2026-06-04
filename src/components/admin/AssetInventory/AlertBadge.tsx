interface Props {
  type: 'overdue' | 'damaged' | 'missing'
}

const LABELS = { overdue: 'Overdue', damaged: 'Damaged', missing: 'Missing' }

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
