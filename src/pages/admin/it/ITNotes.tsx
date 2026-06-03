import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange' | 'red' | 'teal'

interface Note {
  id: string
  title: string | null
  content: string
  color_theme: NoteColor
  author_id: string
  author_name: string
  created_at: string
  comment_count: number
}

interface Comment {
  id: string
  content: string
  author_name: string
  created_at: string
}

// ─── Color palette ────────────────────────────────────────────────────────────

const COLORS: { value: NoteColor; bg: string; border: string; pin: string; label: string }[] = [
  { value: 'yellow', bg: '#FEFCE8', border: '#FDE047', pin: '#CA8A04', label: 'Yellow' },
  { value: 'green', bg: '#F0FDF4', border: '#86EFAC', pin: '#16A34A', label: 'Green' },
  { value: 'blue', bg: '#EFF6FF', border: '#93C5FD', pin: '#2563EB', label: 'Blue' },
  { value: 'pink', bg: '#FDF2F8', border: '#F9A8D4', pin: '#DB2777', label: 'Pink' },
  { value: 'purple', bg: '#FAF5FF', border: '#D8B4FE', pin: '#9333EA', label: 'Purple' },
  { value: 'orange', bg: '#FFF7ED', border: '#FDBA74', pin: '#EA580C', label: 'Orange' },
  { value: 'red', bg: '#FFF1F2', border: '#FCA5A5', pin: '#DC2626', label: 'Red' },
  { value: 'teal', bg: '#F0FDFA', border: '#5EEAD4', pin: '#0D9488', label: 'Teal' },
]

function colorFor(v: NoteColor) {
  return COLORS.find((c) => c.value === v) ?? COLORS[0]
}

// Deterministic subtle tilt based on note id
function tiltFor(id: string): number {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return ((code % 7) - 3) * 0.4 // range: -1.2° to 1.2°
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Create Note Modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onSaved: () => void
}

function CreateNoteModal({ onClose, onSaved }: CreateModalProps) {
  const [color, setColor] = useState<NoteColor>('yellow')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!content.trim()) {
      toast.error('Note content is required')
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('it_notes').insert({
        title: title.trim() || null,
        content: content.trim(),
        color_theme: color,
        author_id: user.id,
      })
      if (error) throw error
      toast.success('Note pinned to the board')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const palette = colorFor(color)

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
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
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured top strip */}
        <div style={{ height: 6, background: palette.border }} />

        <div style={{ padding: '20px 24px' }}>
          {/* Color picker */}
          <div style={{ marginBottom: 18 }}>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Note colour
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c.bg,
                    border: `2.5px solid ${color === c.value ? c.pin : c.border}`,
                    cursor: 'pointer',
                    boxShadow: color === c.value ? `0 0 0 2px ${c.pin}44` : 'none',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    transform: color === c.value ? 'scale(1.18)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Title <span style={{ textTransform: 'none', opacity: 0.6 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this note a title…"
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: palette.bg,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Content <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on the board…"
              rows={5}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: palette.bg,
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving || !content.trim()}
              style={{ flex: 1 }}
            >
              {saving ? 'Pinning…' : 'Pin note'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Note Detail Modal ────────────────────────────────────────────────────────

interface DetailModalProps {
  note: Note
  onClose: () => void
}

function NoteDetailModal({ note, onClose }: DetailModalProps) {
  const palette = colorFor(note.color_theme)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

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
    } finally {
      setLoadingComments(false)
    }
  }, [note.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

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
          background: '#fff',
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
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.3,
                  }}
                >
                  {note.title}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {note.author_name} · {fmtDate(note.created_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
              >
                close
              </span>
            </button>
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
                background: '#fff',
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

// ─── Note Card ────────────────────────────────────────────────────────────────

function NoteCard({ note, onClick }: { note: Note; onClick: () => void }) {
  const palette = colorFor(note.color_theme)
  const tilt = tiltFor(note.id)

  return (
    <div
      onClick={onClick}
      style={{
        background: palette.bg,
        border: `1.5px solid ${palette.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 20px',
        cursor: 'pointer',
        transform: `rotate(${tilt}deg)`,
        transformOrigin: 'center top',
        transition: 'transform 0.18s, box-shadow 0.18s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        position: 'relative',
        overflow: 'hidden',
        breakInside: 'avoid',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)'
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.13), 0 0 0 2px ${palette.border}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = `rotate(${tilt}deg)`
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'
      }}
    >
      {/* Pin */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: palette.pin }}>
          push_pin
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: palette.pin,
            opacity: 0.8,
          }}
        >
          {note.color_theme}
        </span>
      </div>

      {/* Title */}
      {note.title && (
        <p
          style={{
            margin: '0 0 6px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.3,
          }}
        >
          {note.title}
        </p>
      )}

      {/* Content preview (max 5 lines) */}
      <p
        style={{
          margin: '0 0 12px',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 12,
          color: 'hsl(var(--on-surface))',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {note.content}
      </p>

      {/* Footer */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.3 }}>
          {note.author_name}
          <br />
          {fmtDate(note.created_at)}
        </span>
        {note.comment_count > 0 && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              color: palette.pin,
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              comment
            </span>
            {note.comment_count}
          </span>
        )}
      </div>

      {/* Folded corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 18px 18px',
          borderColor: `transparent transparent ${palette.border} transparent`,
          opacity: 0.6,
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITNotes() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('IT Notes')
  }, [setCurrentLabel])

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [colorFilter, setColorFilter] = useState<NoteColor | ''>('')

  useITLayout(
    'Team Noticeboard',
    'sticky_note_2',
    'Shared sticky notes for the IT team — pin ideas, reminders and updates.',
    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        add
      </span>
      New note
    </button>
  )

  const loadNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('it_notes')
        .select('id, title, content, color_theme, author_id, created_at, it_note_comments(count)')
        .order('created_at', { ascending: false })
      if (error) throw error

      const authorIds = [
        ...new Set((data ?? []).map((n) => n.author_id).filter(Boolean)),
      ] as string[]
      let nameMap: Record<string, string> = {}
      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', authorIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      }

      setNotes(
        (data ?? []).map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          color_theme: n.color_theme as NoteColor,
          author_id: n.author_id,
          author_name: nameMap[n.author_id] ?? 'Unknown',
          created_at: n.created_at,
          comment_count: Array.isArray(n.it_note_comments)
            ? ((n.it_note_comments[0] as { count?: number })?.count ?? 0)
            : 0,
        }))
      )
    } catch (err) {
      toast.error('Failed to load notes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const displayed = colorFilter ? notes.filter((n) => n.color_theme === colorFilter) : notes

  return (
    <div>
      {/* Colour filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setColorFilter('')}
          style={{
            height: 28,
            padding: '0 12px',
            border: `1.5px solid ${colorFilter === '' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            borderRadius: 'var(--radius-pill)',
            background: colorFilter === '' ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
            color: colorFilter === '' ? '#fff' : 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          All
        </button>
        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColorFilter(colorFilter === c.value ? '' : c.value)}
            title={c.label}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: c.bg,
              border: `2.5px solid ${colorFilter === c.value ? c.pin : c.border}`,
              cursor: 'pointer',
              transform: colorFilter === c.value ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.12s',
              boxShadow: colorFilter === c.value ? `0 0 0 2px ${c.pin}44` : 'none',
            }}
          />
        ))}
        {notes.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            {displayed.length} {displayed.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 160,
                borderRadius: 'var(--radius-md)',
                background: 'hsl(var(--container-low))',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, display: 'block', marginBottom: 12, opacity: 0.2 }}
          >
            sticky_note_2
          </span>
          <p style={{ margin: '0 0 16px', fontSize: 14 }}>
            {colorFilter
              ? `No ${colorFilter} notes on the board.`
              : 'The board is empty — pin the first note!'}
          </p>
          {!colorFilter && (
            <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                add
              </span>
              Pin a note
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            columns: 'auto 220px',
            columnGap: 20,
            gap: 20,
          }}
        >
          {displayed.map((note) => (
            <div key={note.id} style={{ marginBottom: 20, breakInside: 'avoid' }}>
              <NoteCard note={note} onClick={() => setActiveNote(note)} />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateNoteModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            loadNotes()
          }}
        />
      )}
      {activeNote && <NoteDetailModal note={activeNote} onClose={() => setActiveNote(null)} />}
    </div>
  )
}
