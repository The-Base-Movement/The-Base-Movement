import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = 'ongoing' | 'on_hold' | 'cancelled' | 'completed'

interface Project {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  author_name: string
}

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS: {
  status: ProjectStatus
  label: string
  icon: string
  bar: string
  pill: string
}[] = [
  {
    status: 'ongoing',
    label: 'Ongoing',
    icon: 'autorenew',
    bar: 'hsl(var(--primary))',
    pill: 'pill-ok',
  },
  {
    status: 'on_hold',
    label: 'On Hold',
    icon: 'pause_circle',
    bar: 'hsl(var(--accent))',
    pill: 'pill-warn',
  },
  {
    status: 'cancelled',
    label: 'Cancelled',
    icon: 'cancel',
    bar: 'hsl(var(--destructive))',
    pill: 'pill-err',
  },
  {
    status: 'completed',
    label: 'Completed',
    icon: 'task_alt',
    bar: 'hsl(var(--on-surface))',
    pill: 'pill-mute',
  },
]

function colFor(s: ProjectStatus) {
  return COLUMNS.find((c) => c.status === s) ?? COLUMNS[0]
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface ProjectModalProps {
  editing?: Project
  onClose: () => void
  onSaved: () => void
}

function ProjectModal({ editing, onClose, onSaved }: ProjectModalProps) {
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
          background: '#fff',
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

// ─── Kanban Card ──────────────────────────────────────────────────────────────

interface CardProps {
  project: Project
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: ProjectStatus) => void
}

function ProjectCard({ project, onEdit, onDelete, onStatusChange }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const col = colFor(project.status)

  return (
    <div
      className="panel"
      style={{
        padding: '12px 14px 12px 18px',
        position: 'relative',
        overflow: 'visible',
        marginBottom: 10,
      }}
    >
      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: col.bar,
          borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {project.title}
          </p>
          {project.description && (
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {project.description}
            </p>
          )}
          {(project.start_date || project.end_date) && (
            <p style={{ margin: 0, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
              {fmtDate(project.start_date)}
              {project.end_date && ` → ${fmtDate(project.end_date)}`}
            </p>
          )}
        </div>

        {/* Actions menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
            >
              more_vert
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  minWidth: 170,
                  overflow: 'hidden',
                }}
              >
                {/* Move to */}
                <div
                  style={{
                    padding: '6px 12px',
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'hsl(var(--on-surface-muted))',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  Move to
                </div>
                {COLUMNS.filter((c) => c.status !== project.status).map((c) => (
                  <button
                    key={c.status}
                    onClick={() => {
                      onStatusChange(c.status)
                      setMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: c.bar }}
                    >
                      {c.icon}
                    </span>
                    {c.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                <button
                  onClick={() => {
                    onEdit()
                    setMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '9px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    edit
                  </span>
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '9px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--destructive))',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    delete
                  </span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITProjects() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()
  useEffect(() => {
    setCurrentLabel('IT Projects')
  }, [setCurrentLabel])

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [mobileFilter, setMobileFilter] = useState<ProjectStatus | 'all'>('all')

  useITLayout(
    'IT Projects',
    'folder_open',
    'Track ongoing and completed IT department projects.',
    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        add
      </span>
      Create project
    </button>
  )

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('it_projects')
        .select('id, title, description, status, start_date, end_date, created_at, created_by')
        .order('created_at', { ascending: false })
      if (error) throw error

      const creatorIds = [
        ...new Set((data ?? []).map((p) => p.created_by).filter(Boolean)),
      ] as string[]
      let nameMap: Record<string, string> = {}
      if (creatorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', creatorIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      }

      setProjects(
        (data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status as ProjectStatus,
          start_date: p.start_date,
          end_date: p.end_date,
          created_at: p.created_at,
          author_name: nameMap[p.created_by] ?? 'Unknown',
        }))
      )
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusChange(id: string, status: ProjectStatus) {
    try {
      const { error } = await supabase.from('it_projects').update({ status }).eq('id', id)
      if (error) throw error
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('it_projects').delete().eq('id', id)
      if (error) throw error
      toast.success('Project deleted')
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div>
      {/* KPI strip */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {COLUMNS.map((c) => {
          const count = projects.filter((p) => p.status === c.status).length
          return (
            <div
              key={c.status}
              className="panel"
              style={{ padding: '14px 16px 14px 20px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: c.bar,
                }}
              />
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 4px',
                }}
              >
                {c.label}
              </p>
              <p
                style={{
                  fontSize: 'var(--kpi-num-size)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {loading ? '—' : count}
              </p>
            </div>
          )
        })}
      </div>

      {/* Mobile filter */}
      {isMobile && (
        <div style={{ marginBottom: 16 }}>
          <select
            value={mobileFilter}
            onChange={(e) => setMobileFilter(e.target.value as ProjectStatus | 'all')}
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All ({projects.length})</option>
            {COLUMNS.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label} ({projects.filter((p) => p.status === c.status).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kanban — 4 columns desktop / single filtered list mobile */}
      <div
        style={
          isMobile
            ? { display: 'flex', flexDirection: 'column', gap: 10 }
            : {
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                alignItems: 'start',
              }
        }
      >
        {COLUMNS.filter(
          (col) => !isMobile || mobileFilter === 'all' || mobileFilter === col.status
        ).map((col) => {
          const colProjects = projects.filter((p) => p.status === col.status)
          return (
            <div key={col.status}>
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  padding: '0 2px',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: col.bar }}
                >
                  {col.icon}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0 6px',
                  }}
                >
                  {colProjects.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                style={{
                  minHeight: 80,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed hsl(var(--border))',
                  padding: 8,
                }}
              >
                {loading ? (
                  <div
                    style={{
                      height: 60,
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--border))',
                      opacity: 0.4,
                    }}
                  />
                ) : colProjects.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      padding: '16px 0',
                      margin: 0,
                    }}
                  >
                    No projects
                  </p>
                ) : (
                  colProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onEdit={() => setEditTarget(p)}
                      onDelete={() => handleDelete(p.id)}
                      onStatusChange={(s) => handleStatusChange(p.id, s)}
                    />
                  ))
                )}

                {/* Quick-add in Ongoing column */}
                {col.status === 'ongoing' && !loading && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      padding: '8px 10px',
                      background: 'none',
                      border: '1px dashed hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--background))'
                      e.currentTarget.style.color = 'hsl(var(--primary))'
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
                      e.currentTarget.style.borderColor = 'hsl(var(--border))'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      add
                    </span>
                    Add project
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {createOpen && (
        <ProjectModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}
      {editTarget && (
        <ProjectModal
          editing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
