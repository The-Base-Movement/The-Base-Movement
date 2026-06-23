/**
 * IT Notes Page Component
 * -------------------------------------------------------------
 * Component for the IT team noticeboard.
 * Supports sticky note composition, color categorizations, search filters, and detail views.
 */

import { useState, useEffect, useCallback } from 'react'
import { itService } from '@/services/itService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import { NoteCard } from './notes/NoteCard'
import { CreateNoteModal } from './notes/CreateNoteModal'
import { NoteDetailModal } from './notes/NoteDetailModal'
import type { Note, NoteColor } from './notes/types'
import { COLORS } from './notes/types'

// Main noticeboard page component
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
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [colorFilter, setColorFilter] = useState<NoteColor | ''>('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

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

  // Fetch sticky notes from Supabase database
  const loadNotes = useCallback(async () => {
    try {
      const data = await itService.getNotes()
      setNotes(data.map((n) => ({ ...n, color_theme: n.color_theme as NoteColor })))
    } catch (err) {
      toast.error('Failed to load notes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadNotes])

  const archivedCount = notes.filter((n) => n.archived_at).length
  const query = search.trim().toLowerCase()
  const displayed = notes.filter((n) => {
    if (showArchived ? !n.archived_at : n.archived_at) return false
    if (colorFilter && n.color_theme !== colorFilter) return false
    if (!query) return true
    return (
      (n.title ?? '').toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query) ||
      n.author_name.toLowerCase().includes(query)
    )
  })

  return (
    <div>
      {/* Search + colour filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={
            isMobile ? { position: 'relative', flex: 1 } : { position: 'relative', width: 240 }
          }
        >
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            style={{
              width: '100%',
              height: 32,
              padding: '0 12px 0 32px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-pill)',
              background: 'hsl(var(--card))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
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
        {/* On mobile: search + All share the first row, colour dots wrap below */}
        {isMobile && <div style={{ width: '100%', height: 0 }} />}
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
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={showArchived ? 'btn btn-sm btn-active-tab' : 'btn btn-sm btn-inactive-tab'}
          style={{ marginLeft: 'auto' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            inventory_2
          </span>
          Archived{archivedCount > 0 ? ` · ${archivedCount}` : ''}
        </button>
        {notes.length > 0 && (
          <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
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
            {query
              ? `No notes match "${search.trim()}".`
              : showArchived
                ? 'No archived notes.'
                : colorFilter
                  ? `No ${colorFilter} notes on the board.`
                  : 'The board is empty — pin the first note!'}
          </p>
          {!colorFilter && !query && !showArchived && (
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
      {editNote && (
        <CreateNoteModal
          note={editNote}
          onClose={() => setEditNote(null)}
          onSaved={() => {
            setEditNote(null)
            loadNotes()
          }}
        />
      )}
      {activeNote && (
        <NoteDetailModal
          note={activeNote}
          onClose={() => setActiveNote(null)}
          onCommentAdded={loadNotes}
          onEdit={() => {
            setEditNote(activeNote)
            setActiveNote(null)
          }}
          onMutated={() => {
            setActiveNote(null)
            loadNotes()
          }}
        />
      )}
    </div>
  )
}
