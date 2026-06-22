/**
 * SearchBar Component
 * -------------------------------------------------------------
 * Accessible, controlled search input with a leading search icon and an inline
 * clear (×) button that appears when the field is non-empty.
 *
 * Variants:
 * - `dashboard` (default): 36 px height, 12 px font, CSS-variable colours.
 *   Suitable for admin / member dashboard filter bars.
 * - `public`: 40 px height, 13 px font, static grey colours.
 *   Suitable for light-background public pages.
 *
 * Generates a unique `inputId` via React's `useId()` to ensure label/input
 * associations are correct when multiple SearchBars are rendered on one page.
 */

import { useId } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 'dashboard' uses design-system CSS vars; 'public' uses plain colours for light bg pages */
  variant?: 'dashboard' | 'public'
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  variant = 'dashboard',
}: SearchBarProps) {
  const isDashboard = variant === 'dashboard'
  const uniqueId = useId()
  const inputId = `search-bar-${uniqueId}`

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 16,
          color: isDashboard ? 'hsl(var(--on-surface-muted))' : '#9ca3af',
          pointerEvents: 'none',
        }}
      >
        search
      </span>
      <input
        id={inputId}
        name={inputId}
        autoComplete="off"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: isDashboard ? 36 : 40,
          paddingLeft: 34,
          paddingRight: value ? 32 : 12,
          border: `1px solid hsl(var(--border))`,
          borderRadius: 'var(--radius-sm)',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: isDashboard ? 12 : 13,
          color: 'hsl(var(--on-surface))',
          background: isDashboard ? 'hsl(var(--background))' : 'hsl(var(--card))',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: isDashboard ? 'hsl(var(--on-surface-muted))' : '#9ca3af',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            close
          </span>
        </button>
      )}
    </div>
  )
}
