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
}

/**
 * ChatBubble
 * -------------------------------------------------------------
 * A styled text balloon presenting a single chat message.
 */
export function ChatBubble({ content, isSelf, timestamp, senderName }: ChatBubbleProps) {
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
    </div>
  )
}
