import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useMemberHelpdesk } from '@/components/admin/Helpdesk/useHelpdesk'
import { SubmitTicketModal } from './SubmitTicketModal'
import type {
  HelpdeskTicket,
  TicketPriority,
  TicketStatus,
} from '@/components/admin/Helpdesk/types'

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MyTickets() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => setUserRole(data?.role ?? null))
  }, [userId])

  const {
    tickets,
    departments,
    loading,
    detail,
    loadDetail,
    closeDetail,
    submitTicket,
    postComment,
  } = useMemberHelpdesk(userId ?? '')

  if (!userId) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    )
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

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 18,
            color: 'hsl(var(--on-surface))',
          }}
        >
          My Tickets
        </h2>
        <button
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => setShowSubmit(true)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            add
          </span>
          Submit Ticket
        </button>
      </div>

      {loading ? (
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          Loading tickets…
        </div>
      ) : tickets.length === 0 ? (
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 40,
              color: 'hsl(var(--on-surface-muted))',
              display: 'block',
              marginBottom: 12,
            }}
          >
            confirmation_number
          </span>
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            No tickets yet
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            Submit a ticket and we'll get back to you.
          </p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Subject', 'Department', 'Priority', 'Status', 'Last Updated'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => {
                      loadDetail(t.id)
                      setSelectedTicket(t)
                    }}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.subject}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          {t.department_icon}
                        </span>
                        {t.department_name}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={PRIORITY_PILL[t.priority]}>{t.priority}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={STATUS_PILL[t.status]}>{STATUS_LABEL[t.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'hsl(var(--on-surface-muted))' }}>
                      {relativeTime(t.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket detail slide-out (member read-only view) */}
      {detail && selectedTicket && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 80 }}
            onClick={() => {
              closeDetail()
              setSelectedTicket(null)
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 480,
              background: 'hsl(var(--background))',
              zIndex: 81,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.4,
                  }}
                >
                  {detail.ticket.subject}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={PRIORITY_PILL[detail.ticket.priority]}>
                    {detail.ticket.priority}
                  </span>
                  <span className={STATUS_PILL[detail.ticket.status]}>
                    {STATUS_LABEL[detail.ticket.status]}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  closeDetail()
                  setSelectedTicket(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>
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
              <div>
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
                  {detail.ticket.description}
                </p>
              </div>
              {detail.comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'hsl(var(--container-low))',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
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
                    <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                      {new Date(c.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
              ))}
              {detail.attachments.length > 0 && (
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
                  {detail.attachments.map((a) => (
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
                        marginBottom: 6,
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
                    </a>
                  ))}
                </div>
              )}
            </div>
            {detail.ticket.status !== 'closed' && (
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid hsl(var(--border))',
                  flexShrink: 0,
                }}
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!commentBody.trim()) return
                    setPosting(true)
                    await postComment(detail.ticket.id, commentBody.trim())
                    setPosting(false)
                    setCommentBody('')
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Add a reply…"
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={posting || !commentBody.trim()}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {posting ? 'Posting…' : 'Reply'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {showSubmit && (
        <SubmitTicketModal
          departments={departments}
          userRole={userRole}
          onClose={() => setShowSubmit(false)}
          onSubmit={submitTicket}
        />
      )}
    </div>
  )
}
