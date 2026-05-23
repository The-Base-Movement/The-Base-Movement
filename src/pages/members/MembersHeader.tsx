interface MembersHeaderProps {
  myChapter: string | null | undefined
  sortOrder: 'asc' | 'desc'
  onToggleSort: () => void
}

export function MembersHeader({ myChapter, sortOrder, onToggleSort }: MembersHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 500,
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              display: 'inline-block',
              animation: 'pulse 1.4s infinite',
            }}
          />
          {myChapter ? myChapter : 'Your chapter'}
        </div>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Chapter directory
        </h2>
      </div>
      {myChapter && (
        <button className="btn btn-outline btn-sm" onClick={onToggleSort}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            swap_vert
          </span>
          <span className="desktop-only">{sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
        </button>
      )}
    </div>
  )
}
