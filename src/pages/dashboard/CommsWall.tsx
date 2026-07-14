import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { commsWallService } from '@/services/commsWallService'
import {
  mediaHubService,
  type Briefing,
  type BriefingComment,
  type CommsRole,
} from '@/services/mediaHubService'

const PRIORITY_BAR: Record<string, string> = {
  routine: 'hsl(var(--on-surface-muted))',
  important: 'hsl(var(--accent))',
  urgent: 'hsl(var(--destructive))',
}

const ROLE_LABEL: Record<CommsRole, string> = {
  MEDIA: 'Media',
  MOBILIZATION: 'Mobilization',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function CommsWall() {
  const [roles, setRoles] = useState<CommsRole[] | null>(null)
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<BriefingComment[]>([])
  const [commentText, setCommentText] = useState('')

  // Link submission box
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const myRoles = await commsWallService.getMyRoles()
        if (cancelled) return
        setRoles(myRoles)
        if (myRoles.length) {
          const data = await commsWallService.getWallBriefings(myRoles)
          if (!cancelled) setBriefings(data)
        }
      } catch {
        if (!cancelled) toast.error('Failed to load communications')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Load comments when a briefing is expanded
  useEffect(() => {
    if (!expandedId) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await mediaHubService.getComments(expandedId)
        if (!cancelled) setComments(data)
      } catch {
        /* silent */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [expandedId])

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }, [])

  const handleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    setCommentText('')
  }, [])

  const handleAddComment = useCallback(async () => {
    if (!expandedId || !commentText.trim()) return
    const result = await mediaHubService.addComment(expandedId, commentText.trim())
    if (result) {
      setComments((prev) => [...prev, result])
      setCommentText('')
      setBriefings((prev) =>
        prev.map((b) =>
          b.id === expandedId ? { ...b, comment_count: (b.comment_count ?? 0) + 1 } : b
        )
      )
    } else {
      toast.error('Failed to add comment')
    }
  }, [expandedId, commentText])

  const handleSubmitLink = useCallback(async () => {
    if (!link.trim()) {
      toast.error('Paste a link first')
      return
    }
    setSubmitting(true)
    try {
      const ok = await commsWallService.submitLink(link, note)
      if (ok) {
        toast.success('Sent to the media team')
        setLink('')
        setNote('')
      } else {
        toast.error('Could not send the link')
      }
    } finally {
      setSubmitting(false)
    }
  }, [link, note])

  // Access gate — should not normally render (nav is hidden), but guards direct URL access.
  if (!loading && roles !== null && roles.length === 0) {
    return (
      <div
        className="panel"
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, marginBottom: 8, display: 'block' }}
        >
          lock
        </span>
        This area is for Media and Mobilization team members. Ask a coordinator to enable it for
        your account.
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Header + role badges */}
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          Comms Hub
        </h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
          Approved messaging from the media team. Copy it, share it, and send back anything worth
          amplifying.
        </p>
        {roles && roles.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {roles.map((r) => (
              <span key={r} className="pill pill-ok" style={{ fontSize: 11 }}>
                {ROLE_LABEL[r]} member
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Link submission box */}
      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
            margin: '0 0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add_link
          </span>
          Send a link to the media team
        </p>
        <input
          type="url"
          placeholder="Paste a video or post link (https://…)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: 13,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--container-low))',
            color: 'hsl(var(--on-surface))',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 10,
            fontFamily: "'Public Sans', sans-serif",
          }}
        />
        <textarea
          placeholder="Add a short note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{
            width: '100%',
            minHeight: 60,
            padding: '9px 12px',
            fontSize: 13,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--container-low))',
            color: 'hsl(var(--on-surface))',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'vertical',
            marginBottom: 12,
            fontFamily: "'Public Sans', sans-serif",
            lineHeight: 1.5,
          }}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSubmitLink} disabled={submitting}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
            send
          </span>
          {submitting ? 'Sending…' : 'Send to media team'}
        </button>
      </div>

      {/* Briefing feed */}
      {loading ? (
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            padding: 20,
            textAlign: 'center',
          }}
        >
          Loading communications…
        </p>
      ) : briefings.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, marginBottom: 8, display: 'block' }}
          >
            campaign
          </span>
          No communications yet. Anything the media team shares with your team will show here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {briefings.map((b) => {
            const isExpanded = expandedId === b.id
            return (
              <div
                key={b.id}
                className="panel"
                style={{
                  padding: '14px 16px 14px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: PRIORITY_BAR[b.priority] ?? PRIORITY_BAR.routine,
                  }}
                />

                {b.pinned && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: 10,
                      color: 'hsl(var(--accent))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      push_pin
                    </span>
                    Pinned
                  </span>
                )}

                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 6px',
                  }}
                >
                  {b.title}
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 12px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    ...(isExpanded
                      ? {}
                      : {
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }),
                  }}
                >
                  {b.body}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleCopy(b.body)}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15, marginRight: 4 }}
                    >
                      content_copy
                    </span>
                    Copy text
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleExpand(b.id)}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15, marginRight: 4 }}
                    >
                      comment
                    </span>
                    {isExpanded ? 'Hide comments' : `Comments (${b.comment_count ?? 0})`}
                  </button>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid hsl(var(--border))',
                      paddingTop: 12,
                      marginTop: 12,
                    }}
                  >
                    {comments.length === 0 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '0 0 10px',
                        }}
                      >
                        No comments yet. Ask a question if anything is unclear.
                      </p>
                    )}
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--border))' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {c.author_name ?? 'Unknown'}
                          </span>
                          <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                            {timeAgo(c.created_at)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {c.body}
                        </p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        type="text"
                        placeholder="Add a comment…"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment()
                        }}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          fontSize: 13,
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius-sm)',
                          background: 'hsl(var(--container-low))',
                          color: 'hsl(var(--on-surface))',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      />
                      <button className="btn btn-primary btn-sm" onClick={handleAddComment}>
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 10,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span>{b.author_name ?? 'The Base team'}</span>
                  <span>{timeAgo(b.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
