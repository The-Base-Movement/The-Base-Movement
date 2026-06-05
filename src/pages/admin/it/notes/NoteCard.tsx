import type { Note } from './types'
import { colorFor, tiltFor, fmtDate } from './types'

interface NoteCardProps {
  note: Note
  onClick: () => void
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const palette = colorFor(note.color_theme)
  const tilt = tiltFor(note.id)

  return (
    <div
      onClick={onClick}
      style={{
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 20px',
        cursor: 'pointer',
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'center top',
        transition: 'transform 0.18s, box-shadow 0.18s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        position: 'relative',
        overflow: 'hidden',
        breakInside: 'avoid',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.13), 0 0 0 2px ${palette.border}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'
      }}
    >
      {/* Pin */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: palette.pin }}>
          push_pin
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: palette.pin,
            opacity: 0.8,
          }}
        >
          {note.color_theme}
        </span>
      </div>

      {/* Title */}
      {note.title && (
        <p
          style={{
            margin: '0 0 6px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.3,
          }}
        >
          {note.title}
        </p>
      )}

      {/* Content preview (max 5 lines) */}
      <p
        style={{
          margin: '0 0 12px',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 12,
          color: 'hsl(var(--on-surface))',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {note.content}
      </p>

      {/* Footer */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.3 }}>
          {note.author_name}
          <br />
          {fmtDate(note.created_at)}
        </span>
        {note.comment_count > 0 && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              color: palette.pin,
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              comment
            </span>
            {note.comment_count}
          </span>
        )}
      </div>

      {/* Folded corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 18px 18px',
          borderColor: `transparent transparent ${palette.border} transparent`,
          opacity: 0.6,
        }}
      />
    </div>
  )
}
