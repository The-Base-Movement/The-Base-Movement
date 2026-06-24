import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useMediaHubLayout } from './MediaHubContext'
import { mediaHubService, type Assignment } from '@/services/mediaHubService'
import { adminService } from '@/services/adminService'
import { discordService } from '@/services/discordService'
import { toast } from 'sonner'

const LEADER_ROLES = ['CHIEF_EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN', 'FOUNDER']

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'draft', label: 'Draft' },
  { key: 'in_review', label: 'In Review' },
  { key: 'published', label: 'Published' },
  { key: 'cancelled', label: 'Cancelled' },
] as const

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

const PRIORITY_COLORS: Record<string, string> = {
  low: 'hsl(var(--on-surface-muted))',
  normal: 'hsl(var(--primary))',
  high: 'hsl(var(--accent))',
  urgent: 'hsl(var(--destructive))',
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pill-warn',
  draft: 'pill-mute',
  in_review: 'pill-warn',
  published: 'pill-ok',
  cancelled: 'pill-err',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  draft: 'Draft',
  in_review: 'In Review',
  published: 'Published',
  cancelled: 'Cancelled',
}

// Forward-only transitions for non-leaders
const FORWARD_TRANSITIONS: Record<string, string[]> = {
  pending: ['draft'],
  draft: ['in_review'],
  in_review: [],
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)' as string,
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
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
}

export default function MediaAssignments() {
  const user = adminService.getCurrentUser()
  const isLeader = user ? LEADER_ROLES.includes(user.role) : false

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([])
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  // Create form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAssignee, setFormAssignee] = useState('')
  const [formPriority, setFormPriority] = useState<(typeof PRIORITIES)[number]>('normal')
  const [formDeadline, setFormDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const actionsNode = isLeader ? (
    <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
        add
      </span>
      New Assignment
    </button>
  ) : undefined

  useMediaHubLayout(
    'Assignments',
    'assignment',
    'Story assignments and status tracking.',
    actionsNode
  )

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [a, members] = await Promise.all([
          mediaHubService.getAssignments(),
          mediaHubService.getMediaTeamMembers(),
        ])
        if (!cancelled) {
          setAssignments(a)
          setTeamMembers(members)
        }
      } catch {
        if (!cancelled) toast.error('Failed to load assignments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () =>
      statusFilter === 'all' ? assignments : assignments.filter((a) => a.status === statusFilter),
    [assignments, statusFilter]
  )

  const handleStatusChange = async (assignment: Assignment, newStatus: string) => {
    setStatusMenuId(null)
    const ok = await mediaHubService.updateAssignmentStatus(assignment.id, newStatus)
    if (ok) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id ? { ...a, status: newStatus as Assignment['status'] } : a
        )
      )
      discordService.assignmentStatusChanged(assignment.title, newStatus, user?.name ?? 'Unknown')
      toast.success(`Status updated to ${STATUS_LABELS[newStatus] ?? newStatus}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  const getAvailableStatuses = (assignment: Assignment): string[] => {
    if (isLeader) return Object.keys(STATUS_LABELS).filter((s) => s !== assignment.status)
    // Assignees can only move forward
    if (user && assignment.assigned_to === user.id) {
      return FORWARD_TRANSITIONS[assignment.status] ?? []
    }
    return []
  }

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formAssignee) {
      toast.error('Please select an assignee')
      return
    }
    setSubmitting(true)
    try {
      const created = await mediaHubService.createAssignment({
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        assigned_to: formAssignee,
        priority: formPriority,
        deadline: formDeadline || undefined,
        briefing_id: undefined,
      })
      if (created) {
        const assigneeName = teamMembers.find((m) => m.id === formAssignee)?.name ?? 'Unknown'
        discordService.assignmentCreated(
          formTitle.trim(),
          assigneeName,
          user?.name ?? 'Unknown',
          formDeadline || undefined
        )
        toast.success('Assignment created')
        setShowCreate(false)
        setFormTitle('')
        setFormDesc('')
        setFormAssignee('')
        setFormPriority('normal')
        setFormDeadline('')
        mediaHubService
          .getAssignments()
          .then(setAssignments)
          .catch(() => {})
      } else {
        toast.error('Failed to create assignment')
      }
    } catch {
      toast.error('Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div>
      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            className={
              statusFilter === t.key ? 'btn btn-active-tab btn-sm' : 'btn btn-inactive-tab btn-sm'
            }
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Assignment cards */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 40,
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          Loading assignments…
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 36, color: 'hsl(var(--on-surface-muted))', marginBottom: 8 }}
          >
            assignment
          </span>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 13, margin: 0 }}>
            {statusFilter === 'all'
              ? 'No assignments yet'
              : `No ${STATUS_LABELS[statusFilter] ?? statusFilter} assignments`}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {filtered.map((a) => {
            const statuses = getAvailableStatuses(a)
            return (
              <div
                key={a.id}
                className="panel"
                style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    className={`pill ${STATUS_PILL[a.status] ?? 'pill-mute'}`}
                    style={
                      a.status === 'in_review'
                        ? { background: 'hsl(210 60% 92%)', color: 'hsl(210 60% 35%)' }
                        : undefined
                    }
                  >
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                  {/* Priority badge */}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)' as string,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: PRIORITY_COLORS[a.priority] ?? 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {a.priority}
                  </span>
                </div>

                {/* Title */}
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)' as string,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {a.title}
                </p>

                {/* Description preview */}
                {a.description && (
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {a.description}
                  </p>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 'auto',
                    paddingTop: 8,
                    borderTop: '1px solid hsl(var(--border))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                    >
                      person
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {a.assignee_name ?? 'Unassigned'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {a.deadline && (
                      <span
                        style={{
                          fontSize: 11,
                          color: isOverdue(a.deadline)
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          schedule
                        </span>
                        {new Date(a.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {/* Status change dropdown */}
                    {statuses.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: 3 }}
                          onClick={() => setStatusMenuId((v) => (v === a.id ? null : a.id))}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            more_vert
                          </span>
                        </button>
                        {statusMenuId === a.id && (
                          <>
                            <div
                              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                              onClick={() => setStatusMenuId(null)}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 4px)',
                                zIndex: 50,
                                background: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                minWidth: 140,
                                padding: '4px 0',
                              }}
                            >
                              {statuses.map((s) => (
                                <button
                                  key={s}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '7px 14px',
                                    fontSize: 12,
                                    fontFamily: "'Public Sans', sans-serif",
                                    color: 'hsl(var(--on-surface))',
                                    background: 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => {
                                    ;(e.target as HTMLElement).style.background =
                                      'hsl(var(--container-low))'
                                  }}
                                  onMouseLeave={(e) => {
                                    ;(e.target as HTMLElement).style.background = 'transparent'
                                  }}
                                  onClick={() => handleStatusChange(a, s)}
                                >
                                  {STATUS_LABELS[s] ?? s}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Assignment modal */}
      {showCreate &&
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
            onClick={() => setShowCreate(false)}
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
              {/* Modal header */}
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
                    fontWeight: 'var(--font-weight-medium, 500)' as string,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  New Assignment
                </h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowCreate(false)}
                  style={{ padding: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                  </span>
                </button>
              </div>

              {/* Title */}
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Assignment title"
                style={inputStyle}
              />

              {/* Description */}
              <label style={labelStyle}>Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description of the assignment"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              {/* Assign to */}
              <label style={labelStyle}>Assign To *</label>
              <select
                value={formAssignee}
                onChange={(e) => setFormAssignee(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select team member</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>

              {/* Priority */}
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    className={
                      formPriority === p ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
                    }
                    style={{
                      flex: 1,
                      textTransform: 'capitalize',
                      fontSize: 12,
                      ...(formPriority === p && p === 'urgent'
                        ? {
                            background: 'hsl(var(--destructive))',
                            borderColor: 'hsl(var(--destructive))',
                          }
                        : {}),
                      ...(formPriority === p && p === 'high'
                        ? { background: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent))' }
                        : {}),
                    }}
                    onClick={() => setFormPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Deadline */}
              <label style={labelStyle}>Deadline</label>
              <input
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
                style={inputStyle}
              />

              {/* Submit */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 4 }}
                disabled={submitting}
                onClick={handleCreate}
              >
                {submitting ? 'Creating…' : 'Create Assignment'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
