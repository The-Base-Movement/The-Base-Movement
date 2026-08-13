/**
 * ChatBubble Component
 * -------------------------------------------------------------
 * Renders an individual chat bubble item.
 * Supports bubble styling variations (left/right alignment, container color)
 * based on whether the message was sent by the current user.
 *
 * Message actions are reachable two ways, matching what people expect from a
 * chat app: swipe the bubble right to reply, or long-press (right-click on
 * desktop) to open reply / react / edit / recall / delete.
 */

import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { REACTION_EMOJIS, type ReactionEmoji, type ReactionSummary } from '@/types/admin'
import { VoiceNotePlayer } from './VoiceNotePlayer'

interface ChatBubbleProps {
  content: string
  isSelf: boolean // true when this bubble belongs to the current logged-in user
  timestamp: string
  senderName?: string // shown above the bubble when isSelf is false
  /** Avatar shown alongside every bubble, self included. Falls back to an initial. */
  senderAvatarUrl?: string | null
  onReport?: () => void // when set, shows a report control (open rooms only)
  isFlagged?: boolean // already reported — control becomes a static marker
  /** Quoted message this one is replying to. */
  replyPreview?: { senderName: string; content: string } | null
  reactions?: ReactionSummary[]
  isEdited?: boolean
  isRecalled?: boolean
  /** Set for a voice note. The path is null once the audio is purged or recalled. */
  audioPath?: string | null
  audioDurationSeconds?: number | null
  /** Author-only actions; omit to hide them from the menu. */
  canEdit?: boolean
  onReply?: () => void
  onReact?: (emoji: ReactionEmoji) => void
  /** Tapping a reaction chip shows who reacted, rather than toggling silently. */
  onViewReactions?: () => void
  onEdit?: () => void
  onRecall?: () => void
  onDeleteForMe?: () => void
  /** Jump to the quoted message when the preview is tapped. */
  onJumpToReply?: () => void
}

const SWIPE_REPLY_THRESHOLD = 56
const LONG_PRESS_MS = 450

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
  senderAvatarUrl,
  onReport,
  isFlagged,
  replyPreview,
  reactions,
  isEdited,
  isRecalled,
  audioPath,
  audioDurationSeconds,
  canEdit,
  onReply,
  onReact,
  onViewReactions,
  onEdit,
  onRecall,
  onDeleteForMe,
  onJumpToReply,
}: ChatBubbleProps) {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragX, setDragX] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const swiped = useRef(false)

  const hasActions = Boolean(onReply || onReact || onEdit || onRecall || onDeleteForMe || onReport)

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRecalled) return
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    swiped.current = false
    if (hasActions) {
      longPressTimer.current = setTimeout(() => {
        setMenuOpen(true)
        cancelLongPress()
      }, LONG_PRESS_MS)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y

    // Any real movement means this is a swipe or a scroll, not a long press.
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelLongPress()

    // Only track a mostly-horizontal rightward drag, so vertical scrolling still works.
    if (onReply && dx > 0 && Math.abs(dx) > Math.abs(dy)) {
      setDragX(Math.min(dx, SWIPE_REPLY_THRESHOLD + 16))
      if (dx > SWIPE_REPLY_THRESHOLD) swiped.current = true
    }
  }

  const handleTouchEnd = () => {
    cancelLongPress()
    if (swiped.current && onReply) onReply()
    swiped.current = false
    touchStart.current = null
    setDragX(0)
  }

  const closeMenu = () => setMenuOpen(false)
  const runAction = (fn?: () => void) => () => {
    closeMenu()
    fn?.()
  }

  const initial = (senderName || (isSelf ? 'You' : '?')).trim().charAt(0).toUpperCase()

  const avatar = (
    <div
      aria-hidden="true"
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        background: senderAvatarUrl ? 'transparent' : 'hsl(var(--container-low))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {senderAvatarUrl ? (
        <img
          src={senderAvatarUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {initial}
        </span>
      )}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        flexDirection: isSelf ? 'row-reverse' : 'row',
        maxWidth: '82%',
        alignSelf: isSelf ? 'flex-end' : 'flex-start',
      }}
    >
      {avatar}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSelf ? 'flex-end' : 'flex-start',
          gap: 2,
          minWidth: 0,
          position: 'relative',
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: dragX ? undefined : 'transform 0.18s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          if (!hasActions || isRecalled) return
          e.preventDefault()
          setMenuOpen(true)
        }}
      >
        {/* Reply affordance revealed by the swipe */}
        {dragX > 12 && (
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: -34,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: 'hsl(var(--primary))',
              opacity: Math.min(dragX / SWIPE_REPLY_THRESHOLD, 1),
            }}
          >
            reply
          </span>
        )}

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
            background: isRecalled
              ? 'transparent'
              : isSelf
                ? 'hsl(var(--primary))'
                : 'hsl(var(--container-low))',
            border: isRecalled ? '1px dashed hsl(var(--border))' : undefined,
            color: isRecalled
              ? 'hsl(var(--on-surface-muted))'
              : isSelf
                ? 'hsl(var(--card))'
                : 'hsl(var(--on-surface))',
            fontSize: 13.5,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontStyle: isRecalled ? 'italic' : undefined,
            lineHeight: 1.5,
            wordBreak: 'break-word',
            boxShadow: isRecalled ? 'none' : '0 1px 2px rgba(0,0,0,.06)',
          }}
        >
          {isRecalled ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                do_not_disturb_on
              </span>
              This message was deleted
            </span>
          ) : (
            <>
              {replyPreview && (
                <button
                  onClick={onJumpToReply}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    cursor: onJumpToReply ? 'pointer' : 'default',
                    marginBottom: 6,
                    padding: '6px 8px',
                    borderLeft: `3px solid ${isSelf ? 'hsl(var(--card))' : 'hsl(var(--primary))'}`,
                    borderRadius: 'var(--radius-xs)',
                    background: isSelf ? 'rgba(255,255,255,.16)' : 'hsl(var(--card))',
                    color: 'inherit',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      opacity: 0.9,
                    }}
                  >
                    {replyPreview.senderName}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      opacity: 0.8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {replyPreview.content}
                  </span>
                </button>
              )}
              {audioDurationSeconds ? (
                <VoiceNotePlayer
                  audioPath={audioPath ?? null}
                  durationSeconds={audioDurationSeconds}
                  isSelf={isSelf}
                />
              ) : (
                content
              )}
            </>
          )}
        </div>

        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={onViewReactions}
                disabled={!onViewReactions}
                aria-label={`${r.emoji} ${r.count} — see who reacted`}
                title="See who reacted"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '1px 7px',
                  fontSize: 11,
                  lineHeight: 1.6,
                  cursor: onViewReactions ? 'pointer' : 'default',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${r.reactedByMe ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  background: r.reactedByMe ? 'hsl(var(--container-low))' : 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                <span>{r.emoji}</span>
                <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                  {r.count}
                </span>
              </button>
            ))}
          </div>
        )}

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
            {isEdited && !isRecalled && ' · edited'}
          </span>

          {!isRecalled && hasActions && (
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Message actions"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'hsl(var(--on-surface-muted))',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                more_horiz
              </span>
            </button>
          )}

          {isFlagged && !isRecalled && (
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
          )}
        </div>

        {/* Action menu */}
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={closeMenu} />
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                [isSelf ? 'right' : 'left']: 0,
                marginBottom: 6,
                zIndex: 50,
                minWidth: 168,
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,.14)',
                overflow: 'hidden',
              }}
            >
              {onReact && (
                <div
                  style={{
                    display: 'flex',
                    gap: 2,
                    padding: '8px 8px',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={runAction(() => onReact(emoji))}
                      aria-label={`React ${emoji}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 17,
                        lineHeight: 1,
                        padding: '3px 4px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {(
                [
                  { label: 'Reply', icon: 'reply', fn: onReply, show: Boolean(onReply) },
                  { label: 'Edit', icon: 'edit', fn: onEdit, show: Boolean(onEdit && canEdit) },
                  {
                    label: 'Delete for me',
                    icon: 'visibility_off',
                    fn: onDeleteForMe,
                    show: Boolean(onDeleteForMe),
                  },
                  {
                    label: 'Delete for everyone',
                    icon: 'delete',
                    fn: onRecall,
                    show: Boolean(onRecall),
                    danger: true,
                  },
                  {
                    label: 'Report',
                    icon: 'flag',
                    fn: onReport,
                    show: Boolean(onReport) && !isFlagged,
                    danger: true,
                  },
                ] as const
              )
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.label}
                    onClick={runAction(item.fn)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color:
                        'danger' in item && item.danger
                          ? 'hsl(var(--destructive))'
                          : 'hsl(var(--on-surface))',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
