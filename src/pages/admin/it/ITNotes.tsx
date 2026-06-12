import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { NoteCard } from './notes/NoteCard'
import { CreateNoteModal } from './notes/CreateNoteModal'
import { NoteDetailModal } from './notes/NoteDetailModal'
import type { Note, NoteColor } from './notes/types'
import { COLORS } from './notes/types'

export default function ITNotes() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()

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
            gridTemplateColumns: isMobile
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: isMobile ? 10 : 20,
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
            columns: isMobile ? 2 : 'auto 220px',
            columnGap: isMobile ? 10 : 20,
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
      {activeNote && (
        <NoteDetailModal
          note={activeNote}
          onClose={() => setActiveNote(null)}
          onCommentAdded={loadNotes}
        />
      )}
    </div>
  )
}
