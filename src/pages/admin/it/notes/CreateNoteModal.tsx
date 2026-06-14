import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Note, NoteColor } from './types'
import { COLORS, colorFor, NOTE_INK } from './types'

interface CreateModalProps {
  /** When provided, the modal edits this note instead of creating a new one. */
  note?: Note
  onClose: () => void
  onSaved: () => void
}

export function CreateNoteModal({ note, onClose, onSaved }: CreateModalProps) {
  const isEdit = !!note
  const [color, setColor] = useState<NoteColor>(note?.color_theme ?? 'yellow')
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!content.trim()) {
      toast.error('Note content is required')
      return
    }
    setSaving(true)
    try {
      if (isEdit && note) {
        // .select() reveals whether RLS matched — an update the caller isn't
        // allowed to make would otherwise succeed silently with zero rows.
        const { data, error } = await supabase
          .from('it_notes')
          .update({
            title: title.trim() || null,
            content: content.trim(),
            color_theme: color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', note.id)
          .select('id')
        if (error) throw error
        if (!data?.length) throw new Error('Only the author or an admin can edit this note')
        toast.success('Note updated')
      } else {
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
      }
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
          background: 'hsl(var(--surface))',
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
                color: NOTE_INK.title,
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
                color: NOTE_INK.body,
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
              {saving ? (isEdit ? 'Saving…' : 'Pinning…') : isEdit ? 'Save changes' : 'Pin note'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
