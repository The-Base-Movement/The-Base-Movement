/**
 * SortToggle
 * A compact A→Z / Z→A toggle button. Reusable across any list or table.
 *
 * Props:
 *   value    — current direction ('asc' | 'desc')
 *   onChange — called with the flipped direction on click
 *   label    — optional field label shown before the arrow (default: 'A–Z')
 */

interface SortToggleProps {
  value: 'asc' | 'desc'
  onChange: (next: 'asc' | 'desc') => void
  label?: string
}

export function SortToggle({ value, onChange, label = 'A–Z' }: SortToggleProps) {
  const isAsc = value === 'asc'

  return (
    <button
      type="button"
      onClick={() => onChange(isAsc ? 'desc' : 'asc')}
      title={isAsc ? 'Sorted A → Z — click for Z → A' : 'Sorted Z → A — click for A → Z'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 38,
        padding: '0 12px',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        background: isAsc ? 'hsl(var(--container-low))' : 'hsl(var(--primary))',
        color: isAsc ? 'hsl(var(--on-surface))' : '#fff',
        fontFamily: "'Public Sans', sans-serif",
        fontWeight: 'var(--font-weight-medium, 500)',
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {isAsc ? 'sort' : 'sort'}
      </span>
      {label}
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          opacity: 0.75,
          letterSpacing: '-0.5px',
        }}
      >
        {isAsc ? '↑' : '↓'}
      </span>
    </button>
  )
}
