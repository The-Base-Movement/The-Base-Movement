/**
 * CommentSection Component
 * -------------------------------------------------------------
 * Full-featured comment system for blog post detail pages.
 * Supports:
 * - Authenticated member comment posting
 * - Threaded replies (one level deep, with reply_to_name tracking)
 * - Relative timestamp display (refreshed every 60 s)
 * - Comment flagging (sends admin notification via `notifications` table)
 * - Non-member guest state (prompts sign-in)
 *
 * Data is persisted to the `blog_comments` Supabase table.
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'

interface Comment {
  id: string
  author: string
  createdAt: Date
  content: string
  avatar?: string
  initials?: string
  replyTo?: string
  parentId?: string
  flagged?: boolean
}

interface DBComment {
  id: string
  author_name: string
  author_avatar: string | null
  content: string
  reply_to_name: string | null
  parent_id: string | null
  flagged: boolean
  created_at: string
}

const COMMENT_SELECT =
  'id, author_name, author_avatar, content, reply_to_name, parent_id, flagged, created_at'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

async function notifyAdmins(title: string, message: string, type: 'Info' | 'Alert' = 'Info') {
  try {
    const { data: admins } = await supabase.from('admins').select('id')
    if (!admins || admins.length === 0) return
    const rows = admins.map((a: { id: string }) => ({ user_id: a.id, title, message, type }))
    await supabase.from('notifications').insert(rows)
  } catch {
    // non-critical
  }
}

function dbToComment(row: DBComment): Comment {
  return {
    id: row.id,
    author: row.author_name,
    createdAt: new Date(row.created_at),
    content: row.content,
    avatar: row.author_avatar ?? undefined,
    initials: getInitials(row.author_name),
    replyTo: row.reply_to_name ?? undefined,
    parentId: row.parent_id ?? undefined,
    flagged: row.flagged,
  }
}

function CommentAvatar({ avatar, initials }: { avatar?: string; initials?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'hsl(var(--brand-green) / 0.08)',
        border: '1px solid hsl(var(--brand-green) / 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initials ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--brand-green))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {initials}
        </span>
      ) : (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--brand-green))' }}
        >
          person
        </span>
      )}
    </div>
  )
}

export function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())
  const [currentUser] = useState<{ id: string; name: string; avatar?: string } | null>(() => {
    const user = authService.getUser()
    if (!user) return null
    return {
      id: user.id,
      name: user.user_metadata?.full_name || 'Member',
      avatar: user.user_metadata?.avatar_url,
    }
  })
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!postId) return
    void (async () => {
      setLoadingComments(true)
      const { data, error } = await supabase
        .from('blog_comments')
        .select(COMMENT_SELECT)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (!error && data) {
        setComments((data as DBComment[]).map(dbToComment))
        const flaggedIds = (data as DBComment[]).filter((r) => r.flagged).map((r) => r.id)
        if (flaggedIds.length) setFlagged(new Set(flaggedIds))
      }
      setLoadingComments(false)
    })()
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return
    setSaving(true)
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        member_id: currentUser.id,
        author_name: currentUser.name,
        author_avatar: currentUser.avatar ?? null,
        content: newComment.trim(),
      })
      .select(COMMENT_SELECT)
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error('Failed to post comment.')
      return
    }
    setComments((prev) => [dbToComment(data as DBComment), ...prev])
    setNewComment('')
    void notifyAdmins(
      'New comment posted',
      `${currentUser.name} commented: "${newComment.slice(0, 100)}"`,
      'Info'
    )
  }

  const handleReplySubmit = async (parentId: string, parentAuthor: string) => {
    if (!replyText.trim() || !currentUser) return
    setSaving(true)
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        member_id: currentUser.id,
        author_name: currentUser.name,
        author_avatar: currentUser.avatar ?? null,
        content: replyText.trim(),
        parent_id: parentId,
        reply_to_name: parentAuthor,
      })
      .select(COMMENT_SELECT)
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error('Failed to post reply.')
      return
    }
    const newReply = dbToComment(data as DBComment)
    setComments((prev) => [...prev, newReply])
    setCollapsedThreads((prev) => {
      if (!prev.has(parentId)) return prev
      const next = new Set(prev)
      next.delete(parentId)
      return next
    })
    setReplyText('')
    setReplyingTo(null)
    void notifyAdmins(
      'Reply posted',
      `${currentUser.name} replied to ${parentAuthor}: "${replyText.slice(0, 100)}"`,
      'Info'
    )
    toast.success('Reply posted.')
  }

  const handleFlag = async (comment: Comment) => {
    if (flagged.has(comment.id)) return
    setFlagged((prev) => new Set([...prev, comment.id]))
    await supabase.from('blog_comments').update({ flagged: true }).eq('id', comment.id)
    await notifyAdmins(
      'Comment flagged',
      `A comment by "${comment.author}" was flagged for review: "${comment.content.slice(0, 100)}"`,
      'Alert'
    )
    toast.success('Comment flagged. Our team will review it shortly.')
  }

  const toggleThread = (parentId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  const topLevelComments = comments.filter((c) => !c.parentId)
  const repliesByParent = new Map<string, Comment[]>()
  for (const c of comments) {
    if (!c.parentId) continue
    const list = repliesByParent.get(c.parentId) ?? []
    list.push(c)
    repliesByParent.set(c.parentId, list)
  }

  const renderCommentRow = (comment: Comment, isReply: boolean) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <CommentAvatar avatar={comment.avatar} initials={comment.initials} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                letterSpacing: '-0.01em',
              }}
            >
              {comment.author}
            </span>
            {comment.replyTo && (
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                ↩ {comment.replyTo}
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
            }}
          >
            {relativeTime(comment.createdAt)}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.6,
            margin: '0 0 8px',
          }}
        >
          {comment.content}
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {currentUser && !isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color:
                  replyingTo === comment.id
                    ? 'hsl(var(--brand-green))'
                    : 'hsl(var(--on-surface-muted))',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              {replyingTo === comment.id ? 'Cancel' : 'Reply'}
            </button>
          )}
          <button
            onClick={() => void handleFlag(comment)}
            disabled={flagged.has(comment.id)}
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: flagged.has(comment.id)
                ? 'hsl(var(--on-surface-muted) / 0.6)'
                : 'hsl(var(--on-surface-muted))',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: flagged.has(comment.id) ? 'default' : 'pointer',
            }}
          >
            {flagged.has(comment.id) ? 'Flagged' : 'Flag'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderReplyForm = (comment: Comment) => (
    <div
      style={{
        marginLeft: 52,
        marginTop: 12,
        background: 'hsl(var(--container-low))',
        border: '1px solid hsl(var(--border))',
        padding: '14px',
      }}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <CommentAvatar
          avatar={currentUser?.avatar}
          initials={getInitials(currentUser?.name ?? '')}
        />
        <textarea
          autoFocus
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Reply to ${comment.author}…`}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            padding: '10px 12px',
            fontSize: 12,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 500,
            color: 'hsl(var(--on-surface))',
            outline: 'none',
            minHeight: 72,
            resize: 'vertical',
            boxSizing: 'border-box',
            lineHeight: 1.5,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => void handleReplySubmit(comment.id, comment.author)}
          disabled={!replyText.trim() || saving}
          style={{
            background: 'hsl(var(--brand-green))',
            color: 'hsl(var(--primary-foreground, 0 0% 100%))',
            border: 'none',
            height: 34,
            padding: '0 20px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            letterSpacing: '0.04em',
            cursor: replyText.trim() && !saving ? 'pointer' : 'default',
            opacity: replyText.trim() && !saving ? 1 : 0.5,
          }}
        >
          {saving ? 'Posting…' : 'Post reply'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ marginTop: 96, paddingTop: 48, borderTop: '1px solid hsl(var(--border))' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 10px',
          marginBottom: 32,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: 'hsl(var(--brand-green))' }}
        >
          chat_bubble
        </span>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 18,
            color: 'hsl(var(--on-surface))',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Community Discussion
        </h2>
        <span
          style={{
            background: 'hsl(var(--container-low))',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 2,
          }}
        >
          {loadingComments ? '…' : `${comments.length} comments`}
        </span>
      </div>

      {/* Comment Form */}
      {currentUser ? (
        <div
          style={{
            marginBottom: 48,
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            padding: '20px',
          }}
        >
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <CommentAvatar avatar={currentUser.avatar} initials={getInitials(currentUser.name)} />
              <textarea
                name="newComment"
                id="textarea-comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Join the conversation..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  padding: '12px 14px',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  minHeight: 96,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!newComment.trim() || saving}
                style={{
                  background: 'hsl(var(--brand-green))',
                  color: 'hsl(var(--primary-foreground, 0 0% 100%))',
                  border: 'none',
                  height: 38,
                  padding: '0 24px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  cursor: newComment.trim() && !saving ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: newComment.trim() && !saving ? 1 : 0.5,
                }}
              >
                {saving ? 'Posting…' : 'Post comment'}
                {!saving && (
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    send
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p
          style={{
            marginBottom: 48,
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Sign in to join the discussion.
        </p>
      )}

      {/* Comments List */}
      {loadingComments ? (
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Loading comments…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {topLevelComments.map((comment) => {
            const replies = repliesByParent.get(comment.id) ?? []
            const isCollapsed = collapsedThreads.has(comment.id)
            return (
              <div key={comment.id}>
                {renderCommentRow(comment, false)}

                {replyingTo === comment.id && currentUser && renderReplyForm(comment)}

                {replies.length > 0 && (
                  <div style={{ marginLeft: 52, marginTop: 12 }}>
                    <button
                      onClick={() => toggleThread(comment.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--brand-green))',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {isCollapsed ? 'expand_more' : 'expand_less'}
                      </span>
                      {isCollapsed
                        ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                        : `Hide ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                    </button>

                    {!isCollapsed && (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}
                      >
                        {replies.map((reply) => (
                          <div key={reply.id}>{renderCommentRow(reply, true)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
