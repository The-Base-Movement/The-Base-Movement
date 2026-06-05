import { useState } from 'react'
import type {
  HelpdeskTicket,
  HelpdeskComment,
  HelpdeskAttachment,
  TicketPriority,
  TicketStatus,
} from './types'

const PRIORITY_PILL: Record<TicketPriority, string> = {
  urgent: 'pill pill-err',
  high: 'pill pill-err',
  medium: 'pill pill-warn',
  low: 'pill pill-mute',
}
const STATUS_PILL: Record<TicketStatus, string> = {
  open: 'pill pill-err',
  'in-progress': 'pill pill-warn',
  resolved: 'pill pill-ok',
  closed: 'pill pill-mute',
}
const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

type Tab = 'thread' | 'details'

interface Props {
  ticket: HelpdeskTicket
  comments: HelpdeskComment[]
  attachments: HelpdeskAttachment[]
  loading: boolean
  canWrite: boolean
  handlers: { id: string; full_name: string }[]
  onClose: () => void
  onUpdateStatus: (status: TicketStatus) => Promise<boolean>
  onUpdatePriority: (priority: TicketPriority) => Promise<boolean>
  onAssign: (userId: string | null) => Promise<boolean>
  onPostComment: (body: string, isInternal: boolean) => Promise<boolean>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TicketDetailPanel({
  ticket,
  comments,
  attachments,
  loading,
  canWrite,
  handlers,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onAssign,
  onPostComment,
}: Props) {
  const [tab, setTab] = useState<Tab>('thread')
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [posting, setPosting] = useState(false)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'thread', label: `Thread (${comments.length})` },
    { id: 'details', label: 'Details' },
  ]

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setPosting(true)
    const ok = await onPostComment(commentBody.trim(), isInternal)
    setPosting(false)
    if (ok) {
      setCommentBody('')
      setIsInternal(false)
    }
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 80 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 500,
          background: 'hsl(var(--background))',
          zIndex: 81,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                flex: 1,
                lineHeight: 1.4,
              }}
            >
              {ticket.subject}
            </p>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={PRIORITY_PILL[ticket.priority]}>{ticket.priority}</span>
            <span className={STATUS_PILL[ticket.status]}>{STATUS_LABEL[ticket.status]}</span>
            <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 3 }}
              >
                inventory_2
              </span>
              {ticket.department_name}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '0 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'btn-active-tab' : 'btn-inactive-tab'}
              style={{
                padding: '10px 14px',
                fontSize: 12,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
              }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        ) : tab === 'thread' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Description */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid hsl(var(--border))',
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Description
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ticket.description}
              </p>
            </div>
            {/* Comments */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {comments.length === 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontStyle: 'italic',
                  }}
                >
                  No comments yet.
                </p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: c.is_internal
                      ? 'hsl(var(--accent) / 0.06)'
                      : 'hsl(var(--container-low))',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    border: c.is_internal
                      ? '1px solid hsl(var(--accent) / 0.2)'
                      : '1px solid hsl(var(--border))',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {c.author_name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.is_internal && (
                        <span
                          style={{
                            fontSize: 9,
                            background: 'hsl(var(--accent))',
                            color: '#fff',
                            borderRadius: 'var(--radius-pill)',
                            padding: '1px 6px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Internal
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
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
              ))}
            </div>
            {/* Comment input */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid hsl(var(--border))',
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={handlePostComment}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={
                    isInternal ? 'Internal note (not visible to submitter)…' : 'Add a reply…'
                  }
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    background: isInternal ? 'hsl(var(--accent) / 0.04)' : undefined,
                  }}
                />
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {canWrite && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        style={{ accentColor: 'hsl(var(--accent))' }}
                      />
                      Internal note
                    </label>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={posting || !commentBody.trim()}
                  >
                    {posting ? 'Posting…' : 'Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Details tab */
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Status */}
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Status
              </p>
              {canWrite ? (
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdateStatus(e.target.value as TicketStatus)}
                  style={inputStyle}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              ) : (
                <span className={STATUS_PILL[ticket.status]}>{STATUS_LABEL[ticket.status]}</span>
              )}
            </div>
            {/* Priority */}
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Priority
              </p>
              {canWrite ? (
                <select
                  value={ticket.priority}
                  onChange={(e) => onUpdatePriority(e.target.value as TicketPriority)}
                  style={inputStyle}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              ) : (
                <span className={PRIORITY_PILL[ticket.priority]}>{ticket.priority}</span>
              )}
            </div>
            {/* Assign */}
            {canWrite && (
              <div>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Assigned To
                </p>
                <select
                  value={ticket.assigned_to ?? ''}
                  onChange={(e) => onAssign(e.target.value || null)}
                  style={inputStyle}
                >
                  <option value="">Unassigned</option>
                  {handlers.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Meta */}
            {[
              { label: 'Submitted by', value: ticket.submitter_name },
              { label: 'Department', value: ticket.department_name },
              { label: 'Created', value: formatDate(ticket.created_at) },
              { label: 'Last updated', value: formatDate(ticket.updated_at) },
            ].map((row) => (
              <div key={row.label}>
                <p
                  style={{
                    margin: '0 0 2px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {row.label}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                  {row.value}
                </p>
              </div>
            ))}
            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Attachments
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        background: 'hsl(var(--container-low))',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        color: 'hsl(var(--on-surface))',
                        fontSize: 12,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                      >
                        attach_file
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.file_name}
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        open_in_new
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
