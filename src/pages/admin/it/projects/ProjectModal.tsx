import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Project, ProjectStatus } from './types'
import { COLUMNS } from './types'

interface ProjectModalProps {
  editing?: Project
  onClose: () => void
  onSaved: () => void
}

export function ProjectModal({ editing, onClose, onSaved }: ProjectModalProps) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(editing?.status ?? 'ongoing')
  const [startDate, setStartDate] = useState(editing?.start_date?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(editing?.end_date?.slice(0, 10) ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
      }
      if (editing) {
        const { error } = await supabase.from('it_projects').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Project updated')
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const { error } = await supabase
          .from('it_projects')
          .insert({ ...payload, created_by: user?.id })
        if (error) throw error
        toast.success('Project created')
      }
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 38,
    padding: '0 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 13,
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    boxSizing: 'border-box',
    outline: 'none',
  }
  const labelSt: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'hsl(var(--on-surface-muted))',
    marginBottom: 6,
  }

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
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {editing ? 'Edit Project' : 'Create Project'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              IT Department project tracker
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelSt}>
              Title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project name…"
              style={inputSt}
              autoFocus
            />
          </div>

          <div>
            <label style={labelSt}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project…"
              rows={3}
              style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelSt}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              style={inputSt}
            >
              {COLUMNS.map((c) => (
                <option key={c.status} value={c.status}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputSt}
              />
            </div>
            <div>
              <label style={labelSt}>End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputSt}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={saving || !title.trim()}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
