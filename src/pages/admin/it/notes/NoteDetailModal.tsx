import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Note, Comment } from './types'
import { colorFor, fmtDate, NOTE_INK } from './types'

interface DetailModalProps {
  note: Note
  onClose: () => void
  onCommentAdded?: () => void
  /** Called after the note is archived, unarchived or deleted */
  onMutated?: () => void
  /** Open the editor for this note */
  onEdit?: () => void
}

export function NoteDetailModal({
  note,
  onClose,
  onCommentAdded,
  onMutated,
  onEdit,
}: DetailModalProps) {
  const palette = colorFor(note.color_theme)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [mutating, setMutating] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('it_note_comments')
        .select('id, content, created_at, author_id')
        .eq('note_id', note.id)
        .order('created_at', { ascending: true })
      if (error) throw error

      const authorIds = [
        ...new Set((data ?? []).map((c) => c.author_id).filter(Boolean)),
      ] as string[]
      let nameMap: Record<string, string> = {}
      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', authorIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      }

      setComments(
        (data ?? []).map((c) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          author_name: nameMap[c.author_id] ?? 'Unknown',
        }))
      )
    } catch (err: unknown) {
      console.error('Failed to load comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }, [note.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadComments()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadComments])

  async function handleArchiveToggle() {
    setMutating(true)
    try {
      // .select() reveals whether RLS actually matched the row — an update the
      // caller isn't allowed to make succeeds silently with zero rows
      const { data, error } = await supabase
        .from('it_notes')
        .update({ archived_at: note.archived_at ? null : new Date().toISOString() })
        .eq('id', note.id)
        .select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Only the author or an admin can archive this note')
      toast.success(note.archived_at ? 'Note restored to the board' : 'Note archived')
      onMutated?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update note')
    } finally {
      setMutating(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setMutating(true)
    try {
      const { data, error } = await supabase
        .from('it_notes')
        .delete()
        .eq('id', note.id)
        .select('id')
      if (error) throw error
      if (!data?.length) throw new Error('Only the author or an admin can delete this note')
      toast.success('Note deleted')
      onMutated?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete note')
      setConfirmDelete(false)
    } finally {
      setMutating(false)
    }
  }

  async function handlePostComment() {
    if (!newComment.trim()) return
    setPosting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('it_note_comments').insert({
        note_id: note.id,
        author_id: user.id,
        content: newComment.trim(),
      })
      if (error) throw error
      setNewComment('')
      await loadComments()
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--surface))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured header band */}
        <div
          style={{
            background: palette.bg,
            borderBottom: `3px solid ${palette.border}`,
            padding: '18px 24px 16px',
            flexShrink: 0,
            color: NOTE_INK.body,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Pin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: palette.pin }}
                >
                  push_pin
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: palette.pin,
                  }}
                >
                  {note.color_theme} note
                </span>
              </div>
              {note.title && (
                <p
                  style={{
                    margin: '0 0 4px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 17,
                    color: NOTE_INK.title,
                    lineHeight: 1.3,
                  }}
                >
                  {note.title}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: NOTE_INK.muted }}>
                {note.author_name} · {fmtDate(note.created_at)}
                {note.archived_at ? ' · Archived' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {onEdit && !note.archived_at && (
                <button
                  onClick={onEdit}
                  title="Edit note"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: 4,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 19, color: NOTE_INK.muted }}
                  >
                    edit
                  </span>
                </button>
              )}
              <button
                onClick={handleArchiveToggle}
                disabled={mutating}
                title={note.archived_at ? 'Restore to board' : 'Archive note'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: mutating ? 'wait' : 'pointer',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 19, color: NOTE_INK.muted }}
                >
                  {note.archived_at ? 'unarchive' : 'inventory_2'}
                </span>
              </button>
              <button
                onClick={handleDelete}
                disabled={mutating}
                title={confirmDelete ? 'Click again to permanently delete' : 'Delete note'}
                style={{
                  background: confirmDelete ? 'hsl(var(--destructive))' : 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: mutating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: confirmDelete ? '4px 8px' : 4,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 19,
                    color: confirmDelete ? '#fff' : 'hsl(var(--destructive))',
                  }}
                >
                  delete
                </span>
                {confirmDelete && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: '#fff',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Confirm?
                  </span>
                )}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: NOTE_INK.muted }}
                >
                  close
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Body: note content + comments */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Note content */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {note.content}
            </p>
          </div>

          {/* Comments */}
          <div style={{ flex: 1, padding: '16px 24px' }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {comments.length > 0
                ? `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}`
                : 'No replies yet'}
            </p>

            {loadingComments ? (
              <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                Loading…
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: palette.bg,
                        border: `1.5px solid ${palette.border}`,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, color: palette.pin }}
                      >
                        person
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: 'hsl(var(--container-low))',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {c.author_name}
                        </span>
                        <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                          {fmtDate(c.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment()
              }}
              placeholder="Add a reply… (Ctrl+Enter to send)"
              rows={2}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--surface))',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'none',
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePostComment}
              disabled={posting || !newComment.trim()}
              style={{ flexShrink: 0, alignSelf: 'flex-end' }}
            >
              {posting ? (
                '…'
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  send
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
