import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type TodoStatus = 'todo' | 'in_progress' | 'done' | 'blocked'

interface Todo {
  id: string
  task: string
  status: TodoStatus
  assignee_id: string | null
  assignee_name: string | null
  due_date: string | null
  created_at: string
}

interface UserOption {
  id: string
  full_name: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TodoStatus,
  { label: string; icon: string; pill: string; color: string }
> = {
  todo: {
    label: 'To Do',
    icon: 'radio_button_unchecked',
    pill: 'pill-mute',
    color: 'hsl(var(--on-surface-muted))',
  },
  in_progress: {
    label: 'In Progress',
    icon: 'pending',
    pill: 'pill-warn',
    color: 'hsl(var(--accent))',
  },
  blocked: { label: 'Blocked', icon: 'block', pill: 'pill-err', color: 'hsl(var(--destructive))' },
  done: { label: 'Done', icon: 'check_circle', pill: 'pill-ok', color: 'hsl(var(--primary))' },
}

const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  todo: 'in_progress',
  in_progress: 'blocked',
  blocked: 'todo',
  done: 'todo',
}

const ALL_STATUSES: TodoStatus[] = ['todo', 'in_progress', 'blocked', 'done']

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function isDueSoon(iso: string | null): boolean {
  if (!iso) return false
  const diff = new Date(iso).getTime() - Date.now()
  return diff >= 0 && diff < 2 * 24 * 60 * 60 * 1000
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso).getTime() < Date.now()
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void
  onSaved: () => void
}

function AddTaskModal({ onClose, onSaved }: AddModalProps) {
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
          background: '#fff',
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
                      background: '#fff',
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

// ─── Todo Row ─────────────────────────────────────────────────────────────────

interface TodoRowProps {
  todo: Todo
  onToggleDone: () => void
  onCycleStatus: () => void
  onDelete: () => void
}

function TodoRow({ todo, onToggleDone, onCycleStatus, onDelete }: TodoRowProps) {
  const cfg = STATUS_CONFIG[todo.status]
  const done = todo.status === 'done'
  const overdue = isOverdue(todo.due_date) && !done
  const soon = isDueSoon(todo.due_date) && !done

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: done ? 'hsl(var(--container-low))' : '#fff',
        transition: 'background 0.1s',
        opacity: done ? 0.65 : 1,
      }}
      onMouseEnter={(e) => {
        if (!done) e.currentTarget.style.background = 'hsl(var(--container-low))'
      }}
      onMouseLeave={(e) => {
        if (!done) e.currentTarget.style.background = '#fff'
      }}
    >
      {/* Done toggle */}
      <button
        onClick={onToggleDone}
        title={done ? 'Mark as To Do' : 'Mark as Done'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          padding: '1px 0 0',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            transition: 'color 0.15s',
          }}
        >
          {done ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </button>

      {/* Content block — wraps on mobile */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px 10px',
        }}
      >
        {/* Task text — full width, wraps */}
        <span
          style={{
            width: '100%',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            textDecoration: done ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}
        >
          {todo.task}
        </span>

        {/* Meta row — wraps together on very small screens */}
        {todo.assignee_name && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '1px 7px',
              borderRadius: 'var(--radius-pill)',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
              person
            </span>
            {todo.assignee_name}
          </span>
        )}

        {todo.due_date && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: overdue
                ? 'hsl(var(--destructive))'
                : soon
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--on-surface-muted))',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              {overdue ? 'warning' : 'calendar_today'}
            </span>
            {fmtDate(todo.due_date)}
          </span>
        )}

        {/* Status pill */}
        <button
          onClick={onCycleStatus}
          className={`pill ${cfg.pill}`}
          style={{ cursor: 'pointer', border: 'none' }}
          title={`Cycle status (currently: ${cfg.label})`}
        >
          {cfg.label}
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        aria-label="Delete task"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          opacity: 0.35,
          paddingTop: 2,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.35')}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}
        >
          delete
        </span>
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: TodoStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Done', value: 'done' },
]

export default function ITTodos() {
  const { setCurrentLabel } = usePageLabel()
  useEffect(() => {
    setCurrentLabel('IT To-Dos')
  }, [setCurrentLabel])

  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TodoStatus | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  useITLayout(
    'Team To-Dos',
    'checklist',
    'Daily IT task list — add, assign and check off tasks.',
    <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        add
      </span>
      Add task
    </button>
  )

  // Quick-add
  const [quickTask, setQuickTask] = useState('')
  const [quickAdding, setQuickAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('it_todos')
        .select('id, task, status, assignee_id, due_date, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      const assigneeIds = [
        ...new Set((data ?? []).map((t) => t.assignee_id).filter(Boolean)),
      ] as string[]
      let nameMap: Record<string, string> = {}
      if (assigneeIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', assigneeIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      }

      setTodos(
        (data ?? []).map((t) => ({
          id: t.id,
          task: t.task,
          status: t.status as TodoStatus,
          assignee_id: t.assignee_id,
          due_date: t.due_date,
          created_at: t.created_at,
          assignee_name: t.assignee_id ? (nameMap[t.assignee_id] ?? null) : null,
        }))
      )
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggleDone(todo: Todo) {
    const next = todo.status === 'done' ? 'todo' : 'done'
    try {
      const { error } = await supabase.from('it_todos').update({ status: next }).eq('id', todo.id)
      if (error) throw error
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: next } : t)))
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function handleCycleStatus(todo: Todo) {
    const next = STATUS_CYCLE[todo.status]
    try {
      const { error } = await supabase.from('it_todos').update({ status: next }).eq('id', todo.id)
      if (error) throw error
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: next } : t)))
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      const { error } = await supabase.from('it_todos').delete().eq('id', id)
      if (error) throw error
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch {
      toast.error('Failed to delete task')
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTask.trim()) return
    setQuickAdding(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('it_todos')
        .insert({ task: quickTask.trim(), status: 'todo', created_by: user?.id })
      if (error) throw error
      setQuickTask('')
      await load()
    } catch {
      toast.error('Failed to add task')
    } finally {
      setQuickAdding(false)
    }
  }

  const displayed = filter === 'all' ? todos : todos.filter((t) => t.status === filter)

  const counts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, todos.filter((t) => t.status === s).length])
  ) as Record<TodoStatus, number>

  return (
    <div>
      {/* KPI strip */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div
              key={s}
              className="panel"
              style={{
                padding: '14px 16px 14px 20px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => setFilter(filter === s ? 'all' : s)}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: cfg.color,
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
                {cfg.label}
              </p>
              <p
                style={{
                  fontSize: 'var(--kpi-num-size)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {loading ? '—' : counts[s]}
              </p>
            </div>
          )
        })}
      </div>

      {/* Checklist panel */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.value
            const count = tab.value === 'all' ? todos.length : counts[tab.value as TodoStatus]
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  borderBottom: active ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.12s',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: 9,
                    padding: '0 5px',
                    borderRadius: 'var(--radius-pill)',
                    background: active ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--border))',
                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Quick-add bar */}
        <form
          onSubmit={handleQuickAdd}
          style={{ display: 'flex', gap: 0, borderBottom: '1px solid hsl(var(--border))' }}
        >
          <label htmlFor="quick-add-task" style={{ display: 'none' }}>
            Quick-add a task
          </label>
          <span
            className="material-symbols-outlined"
            style={{
              padding: '0 12px',
              alignSelf: 'center',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              flexShrink: 0,
            }}
          >
            add_task
          </span>
          <input
            id="quick-add-task"
            name="quickTask"
            type="text"
            value={quickTask}
            onChange={(e) => setQuickTask(e.target.value)}
            placeholder="Quick-add a task and press Enter…"
            style={{
              flex: 1,
              height: 42,
              padding: '0',
              border: 'none',
              minWidth: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--container-low))',
              outline: 'none',
            }}
          />
          {quickTask.trim() && (
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={quickAdding}
              style={{ margin: '6px 10px 6px 0', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
            >
              {quickAdding ? '…' : 'Add'}
            </button>
          )}
        </form>

        {/* Task list */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                opacity: 0.5 - i * 0.07,
              }}
            />
          ))
        ) : displayed.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: 0.2 }}
            >
              checklist
            </span>
            <p style={{ margin: 0, fontSize: 13 }}>
              {filter === 'all'
                ? 'No tasks yet — add one above.'
                : `No ${STATUS_CONFIG[filter as TodoStatus].label.toLowerCase()} tasks.`}
            </p>
          </div>
        ) : (
          displayed.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggleDone={() => handleToggleDone(todo)}
              onCycleStatus={() => handleCycleStatus(todo)}
              onDelete={() => handleDelete(todo.id)}
            />
          ))
        )}
      </div>

      {addOpen && (
        <AddTaskModal
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}
