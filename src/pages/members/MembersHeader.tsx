import { SortToggle } from '@/components/ui/SortToggle'

interface MembersHeaderProps {
  myChapter: string | null | undefined
  sortOrder: 'asc' | 'desc'
  onToggleSort: (next: 'asc' | 'desc') => void
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
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 20,
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Chapter directory
        </h2>
      </div>
      {myChapter && <SortToggle value={sortOrder} onChange={onToggleSort} />}
    </div>
  )
}
