import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { itService } from '@/services/itService'
import { toast } from 'sonner'
import type { ITTicket, TicketPriority, TicketStatus } from './ITTickets'
import { relativeTime } from './itTicketUtils'

interface Comment {
  id: string
  body: string
  created_at: string
  author_id: string
  users: { full_name: string } | null
}

interface Props {
  ticket: ITTicket
  currentUserId: string
  isItStaff: boolean
  onClose: () => void
  onUpdated: () => void
}

const priorityPill: Record<TicketPriority, string> = {
  high: 'pill pill-err',
  medium: 'pill pill-warn',
  low: 'pill pill-mute',
}

const statusPill: Record<TicketStatus, string> = {
  open: 'pill pill-err',
  'in-progress': 'pill pill-warn',
  resolved: 'pill pill-ok',
}

export function ITTicketPanel({ ticket, currentUserId, isItStaff, onClose, onUpdated }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingCmts, setLoadingCmts] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const canComment = isItStaff || ticket.submitted_by === currentUserId

  useEffect(() => {
    let cancelled = false
    async function fetchComments() {
      setLoadingCmts(true)
      const data = await itService.getTicketComments(ticket.id)
      if (!cancelled) {
        setComments(data as unknown as Comment[])
        setLoadingCmts(false)
      }
    }
    fetchComments()
    return () => {
      cancelled = true
    }
  }, [ticket.id])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const postComment = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setPosting(true)
    try {
      await itService.addTicketComment({
        ticket_id: ticket.id,
        author_id: currentUserId,
        body: trimmed,
      })
      setBody('')
      const data = await itService.getTicketComments(ticket.id)
      setComments(data as unknown as Comment[])
      onUpdated()
    } catch {
      toast.error('Failed to post comment')
    }
    setPosting(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100vw',
          background: 'hsl(var(--card))',
          borderLeft: '1px solid hsl(var(--border))',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          fontFamily: "'Public Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                flex: 1,
                lineHeight: 1.4,
              }}
            >
              {ticket.title}
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--on-surface-muted))',
                flexShrink: 0,
                display: 'flex',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
            <span className={statusPill[ticket.status]}>{ticket.status}</span>
          </div>
        </div>

        {/* Meta */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          {[
            { icon: 'person', label: 'Submitted by', value: ticket.submitter_name },
            {
              icon: 'engineering',
              label: 'Assigned to',
              value: ticket.assignee_name ?? 'Unassigned',
            },
            { icon: 'schedule', label: 'Created', value: relativeTime(ticket.created_at) },
          ].map((row) => (
            <div
              key={row.label}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
              >
                {row.icon}
              </span>
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', width: 80 }}>
                {row.label}
              </span>
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface))' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Description
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {ticket.description}
          </p>
        </div>

        {/* Comments thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Comments
          </p>
          {loadingCmts ? (
            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Loading…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>
              No comments yet.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {c.users?.full_name ?? 'Unknown'}
                  </span>
                  <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                    {relativeTime(c.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {c.body}
                </p>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input */}
        <div
          style={{ padding: '14px 20px', borderTop: '1px solid hsl(var(--border))', flexShrink: 0 }}
        >
          {canComment ? (
            <>
              <textarea
                id="ticket-comment"
                name="ticketComment"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add a comment…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--container-low))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={posting || !body.trim()}
                onClick={postComment}
              >
                {posting ? 'Posting…' : 'Add comment'}
              </button>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Only IT staff and the ticket submitter can comment.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
