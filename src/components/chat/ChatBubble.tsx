/**
 * ChatBubble Component
 * -------------------------------------------------------------
 * Renders an individual chat bubble item.
 * Supports bubble styling variations (left/right alignment, container color)
 * based on whether the message was sent by the current user.
 */

import { formatDistanceToNow } from 'date-fns'

interface ChatBubbleProps {
  content: string
  isSelf: boolean // true when this bubble belongs to the current logged-in user
  timestamp: string
  senderName?: string // shown above the bubble when isSelf is false
  onReport?: () => void // when set, shows a report control (open rooms only)
  isFlagged?: boolean // already reported — control becomes a static marker
}

/**
 * ChatBubble
 * -------------------------------------------------------------
 * A styled text balloon presenting a single chat message.
 */
export function ChatBubble({
  content,
  isSelf,
  timestamp,
  senderName,
  onReport,
  isFlagged,
}: ChatBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isSelf ? 'flex-end' : 'flex-start',
        gap: 2,
        maxWidth: '72%',
        alignSelf: isSelf ? 'flex-end' : 'flex-start',
      }}
    >
      {senderName && !isSelf && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            paddingLeft: 4,
          }}
        >
          {senderName}
        </span>
      )}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: isSelf
            ? 'var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)'
            : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs)',
          background: isSelf ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
          color: isSelf ? 'hsl(var(--card))' : 'hsl(var(--on-surface))',
          fontSize: 13.5,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        }}
      >
        {content}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            paddingLeft: isSelf ? 0 : 4,
            paddingRight: isSelf ? 4 : 0,
          }}
        >
          {timeAgo}
        </span>
        {isFlagged ? (
          <span
            style={{
              fontSize: 10,
              color: 'hsl(var(--destructive))',
              fontFamily: "'Public Sans', sans-serif",
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              flag
            </span>
            Reported
          </span>
        ) : (
          onReport && (
            <button
              onClick={onReport}
              aria-label="Report this message"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                flag
              </span>
              Report
            </button>
          )
        )}
      </div>
    </div>
  )
}
