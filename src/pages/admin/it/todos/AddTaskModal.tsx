import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TodoStatus, UserOption } from './types'
import { STATUS_CONFIG, ALL_STATUSES } from './types'

interface AddModalProps {
  onClose: () => void
  onSaved: () => void
}

export function AddTaskModal({ onClose, onSaved }: AddModalProps) {
  const [task, setTask] = useState('')
  const [status, setStatus] = useState<TodoStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (query.length < 2) {
      setUsers([])
      return
    }
    timer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await supabase
          .from('users')
          .select('id, full_name')
          .ilike('full_name', `%${query}%`)
          .limit(6)
        setUsers(data ?? [])
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  async function handleSave() {
    if (!task.trim()) {
      toast.error('Task description is required')
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase.from('it_todos').insert({
        task: task.trim(),
        status,
        assignee_id: selected?.id ?? null,
        due_date: dueDate || null,
        created_by: user?.id,
      })
      if (error) throw error
      toast.success('Task added')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task')
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
          background: 'hsl(var(--surface))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 460,
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
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Add Task
          </p>
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
            <label htmlFor="todo-task" style={labelSt}>
              Task <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              id="todo-task"
              name="todoTask"
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="What needs to be done?"
              style={inputSt}
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))',
              gap: 12,
            }}
          >
            <div>
              <label htmlFor="todo-status" style={labelSt}>
                Status
              </label>
              <select
                id="todo-status"
                name="todoStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TodoStatus)}
                style={inputSt}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="todo-due" style={labelSt}>
                Due date
              </label>
              <input
                id="todo-due"
                name="todoDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputSt}
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="todo-assignee-search" style={labelSt}>
              Assign to
            </label>
            {selected ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                  height: 38,
                  border: '1px solid hsl(var(--primary))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--primary) / 0.05)',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {selected.full_name}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Clear assignee"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                  >
                    close
                  </span>
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  id="todo-assignee-search"
                  name="assigneeSearch"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search team member…"
                  style={{ ...inputSt, paddingLeft: 34 }}
                />
                {(users.length > 0 || searching) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: 'hsl(var(--surface))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {searching ? (
                      <div
                        style={{
                          padding: '10px 14px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        Searching…
                      </div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelected(u)
                            setQuery('')
                          }}
                          style={{
                            padding: '9px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            borderBottom: '1px solid hsl(var(--border))',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                          >
                            person
                          </span>
                          {u.full_name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
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
            disabled={saving || !task.trim()}
            onClick={handleSave}
          >
            {saving ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
