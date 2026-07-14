import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useMediaHubLayout } from './MediaHubContext'
import { mediaHubService, type Briefing, type BriefingComment } from '@/services/mediaHubService'
import { adminService } from '@/services/adminService'
import { discordService } from '@/services/discordService'
import { toast } from 'sonner'

const LEADER_ROLES = ['CHIEF_EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN', 'FOUNDER']

const PRIORITY_BAR: Record<string, string> = {
  routine: 'hsl(var(--on-surface-muted))',
  important: 'hsl(var(--accent))',
  urgent: 'hsl(var(--destructive))',
}

type Audience = 'team' | 'media' | 'mobilization' | 'both'

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'team', label: 'Team only' },
  { value: 'media', label: 'Media members' },
  { value: 'mobilization', label: 'Mobilization members' },
  { value: 'both', label: 'Media + Mobilization' },
]

const AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCE_OPTIONS.map((o) => [o.value, o.label])
)

const FILTERS = ['all', 'routine', 'important', 'urgent'] as const
type Filter = (typeof FILTERS)[number]

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

export default function MediaWall() {
  const user = adminService.getCurrentUser()
  const isLeader = user ? LEADER_ROLES.includes(user.role) : false

  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<BriefingComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Compose form
  const [compTitle, setCompTitle] = useState('')
  const [compBody, setCompBody] = useState('')
  const [compPriority, setCompPriority] = useState<'routine' | 'important' | 'urgent'>('routine')
  const [compAudience, setCompAudience] = useState<Audience>('team')
  const [compPublishBy, setCompPublishBy] = useState('')
  const [compPinned, setCompPinned] = useState(false)

  const actionsNode = useMemo(
    () =>
      isLeader ? (
        <button className="btn btn-primary btn-sm" onClick={() => setShowCompose(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
            add
          </span>
          New Briefing
        </button>
      ) : undefined,
    [isLeader]
  )

  useMediaHubLayout(
    'The Wall',
    'newsmode',
    'Internal briefing board for the media team.',
    actionsNode
  )

  // Load briefings
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await mediaHubService.getBriefings()
        if (!cancelled) setBriefings(data)
      } catch {
        toast.error('Failed to load briefings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Load comments when expanding
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
      // Mark as read
      await mediaHubService.markAsRead(expandedId)
      if (!cancelled) {
        setBriefings((prev) => prev.map((b) => (b.id === expandedId ? { ...b, is_read: true } : b)))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [expandedId])

  const filtered = useMemo(() => {
    const list = filter === 'all' ? briefings : briefings.filter((b) => b.priority === filter)
    // Pinned first, then by date
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [briefings, filter])

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

  const handleTogglePin = useCallback(async (b: Briefing) => {
    const ok = await mediaHubService.togglePin(b.id, !b.pinned)
    if (ok) {
      setBriefings((prev) => prev.map((x) => (x.id === b.id ? { ...x, pinned: !x.pinned } : x)))
      toast.success(b.pinned ? 'Unpinned' : 'Pinned')
    } else {
      toast.error('Failed to update pin')
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this briefing?')) return
    const ok = await mediaHubService.deleteBriefing(id)
    if (ok) {
      setBriefings((prev) => prev.filter((x) => x.id !== id))
      setExpandedId(null)
      toast.success('Briefing deleted')
    } else {
      toast.error('Failed to delete')
    }
  }, [])

  const handleCompose = useCallback(async () => {
    if (!compTitle.trim() || !compBody.trim()) {
      toast.error('Title and body are required')
      return
    }
    setSubmitting(true)
    try {
      const id = await mediaHubService.createBriefing({
        title: compTitle.trim(),
        body: compBody.trim(),
        priority: compPriority,
        audience: compAudience,
        pinned: compPinned,
        publish_by: compPublishBy || undefined,
      })
      if (id) {
        discordService.briefingPosted(compTitle.trim(), user?.name || 'Unknown', compPriority)
        toast.success('Briefing published')
        setShowCompose(false)
        setCompTitle('')
        setCompBody('')
        setCompPriority('routine')
        setCompAudience('team')
        setCompPublishBy('')
        setCompPinned(false)
        // Reload
        const data = await mediaHubService.getBriefings()
        setBriefings(data)
      } else {
        toast.error('Failed to create briefing')
      }
    } finally {
      setSubmitting(false)
    }
  }, [compTitle, compBody, compPriority, compAudience, compPinned, compPublishBy, user?.name])

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize', fontSize: 13 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Briefing list */}
      {loading ? (
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            padding: 20,
            textAlign: 'center',
          }}
        >
          Loading briefings...
        </p>
      ) : filtered.length === 0 ? (
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
          No briefings yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b) => {
            const isExpanded = expandedId === b.id
            return (
              <div
                key={b.id}
                className="panel"
                style={{
                  padding: '14px 16px 14px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => handleExpand(b.id)}
              >
                {/* Priority bar */}
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

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        push_pin
                      </span>
                      Pinned
                    </span>
                  )}
                  {!b.is_read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'hsl(var(--primary))',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    className={`pill ${b.audience === 'team' ? 'pill-mute' : 'pill-ok'}`}
                    style={{ fontSize: 10, marginLeft: 'auto' }}
                  >
                    {AUDIENCE_LABEL[b.audience] ?? 'Team only'}
                  </span>
                </div>

                {/* Title */}
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 4px',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {b.title}
                </p>

                {/* Body preview */}
                {!isExpanded && (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 10px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {b.body}
                  </p>
                )}

                {/* Full body + comments (expanded) */}
                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                        margin: '0 0 14px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {b.body}
                    </p>

                    {/* Leader actions */}
                    {isLeader && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleTogglePin(b)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, marginRight: 4 }}
                          >
                            push_pin
                          </span>
                          {b.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          className="btn btn-outline-dest btn-sm"
                          onClick={() => handleDelete(b.id)}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, marginRight: 4 }}
                          >
                            delete
                          </span>
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Comments */}
                    <div
                      style={{
                        borderTop: '1px solid hsl(var(--border))',
                        paddingTop: 12,
                        marginTop: 4,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          margin: '0 0 8px',
                        }}
                      >
                        Comments ({comments.length})
                      </p>
                      {comments.length === 0 && (
                        <p
                          style={{
                            fontSize: 12,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: '0 0 10px',
                          }}
                        >
                          No comments yet
                        </p>
                      )}
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '8px 0',
                            borderBottom: '1px solid hsl(var(--border))',
                          }}
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

                      {/* Add comment */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <input
                          type="text"
                          placeholder="Add a comment..."
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
                  </div>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: isExpanded ? 0 : undefined,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span>{b.author_name ?? 'Unknown'}</span>
                  <span>{timeAgo(b.created_at)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      visibility
                    </span>
                    {b.read_count ?? 0}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      comment
                    </span>
                    {b.comment_count ?? 0}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Compose modal */}
      {showCompose &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowCompose(false)}
          >
            <div
              style={{
                background: 'hsl(var(--card))',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                width: '100%',
                maxWidth: 520,
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  New Briefing
                </h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowCompose(false)}
                  style={{ padding: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>

              {/* Title */}
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={compTitle}
                onChange={(e) => setCompTitle(e.target.value)}
                placeholder="Briefing title"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 14,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              />

              {/* Body */}
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                }}
              >
                Body
              </label>
              <textarea
                value={compBody}
                onChange={(e) => setCompBody(e.target.value)}
                placeholder="Write the briefing content..."
                style={{
                  width: '100%',
                  minHeight: 200,
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  marginBottom: 14,
                  fontFamily: "'Public Sans', sans-serif",
                  lineHeight: 1.6,
                }}
              />

              {/* Priority */}
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                Priority
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['routine', 'important', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    className={compPriority === p ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
                    onClick={() => setCompPriority(p)}
                    style={{ textTransform: 'capitalize', fontSize: 12 }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Audience */}
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                }}
              >
                Share with
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                {AUDIENCE_OPTIONS.map((a) => (
                  <button
                    key={a.value}
                    className={
                      compAudience === a.value ? 'btn btn-active-tab' : 'btn btn-inactive-tab'
                    }
                    onClick={() => setCompAudience(a.value)}
                    style={{ fontSize: 12 }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 14px',
                }}
              >
                {compAudience === 'team'
                  ? 'Internal only — stays inside the media team.'
                  : 'Also shown to tagged members on their Comms Hub.'}
              </p>

              {/* Publish by */}
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 4,
                }}
              >
                Publish by (optional)
              </label>
              <input
                type="date"
                value={compPublishBy}
                onChange={(e) => setCompPublishBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 14,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              />

              {/* Pin */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 20,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={compPinned}
                  onChange={(e) => setCompPinned(e.target.checked)}
                  style={{ accentColor: 'hsl(var(--primary))' }}
                />
                Pin this briefing
              </label>

              {/* Submit */}
              <button
                className="btn btn-primary"
                onClick={handleCompose}
                disabled={submitting}
                style={{ width: '100%', fontSize: 13 }}
              >
                {submitting ? 'Publishing...' : 'Publish Briefing'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
