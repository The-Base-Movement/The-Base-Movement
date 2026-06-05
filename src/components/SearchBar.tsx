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
        id="search-bar-input"
        name="search-bar-input"
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
          border: `1px solid ${isDashboard ? 'hsl(var(--border))' : '#e5e7eb'}`,
          borderRadius: 'var(--radius-sm)',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: isDashboard ? 12 : 13,
          color: isDashboard ? 'hsl(var(--on-surface))' : '#1c1c1c',
          background: isDashboard ? 'hsl(var(--background))' : '#fff',
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
