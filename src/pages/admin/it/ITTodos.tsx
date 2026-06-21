import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { SortToggle } from '@/components/ui/SortToggle'
import { toast } from 'sonner'
import type { Todo, TodoStatus } from './todos/types'
import { STATUS_CONFIG, STATUS_CYCLE, ALL_STATUSES } from './todos/types'
import { TodoRow } from './todos/TodoRow'
import { AddTaskModal } from './todos/AddTaskModal'

const FILTER_TABS: { label: string; value: TodoStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Done', value: 'done' },
]

export default function ITTodos() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentLabel('IT To-Dos')
  }, [setCurrentLabel])

  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TodoStatus | 'all'>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
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

  const filtered = filter === 'all' ? todos : todos.filter((t) => t.status === filter)
  const displayed = [...filtered].sort((a, b) => {
    const cmp = a.task.localeCompare(b.task)
    return sortDir === 'asc' ? cmp : -cmp
  })

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
        {/* Filter toolbar — dropdown on mobile, tabs on desktop */}
        {isMobile ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          >
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TodoStatus | 'all')}
              style={{
                flex: 1,
                height: 34,
                padding: '0 10px',
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
              {FILTER_TABS.map((tab) => {
                const count = tab.value === 'all' ? todos.length : counts[tab.value as TodoStatus]
                return (
                  <option key={tab.value} value={tab.value}>
                    {tab.label} ({count})
                  </option>
                )
              })}
            </select>
            <SortToggle value={sortDir} onChange={setSortDir} />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          >
            <div style={{ display: 'flex', flex: 1 }}>
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
                      borderBottom: active
                        ? '2px solid hsl(var(--primary))'
                        : '2px solid transparent',
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
            <div style={{ padding: '0 14px', flexShrink: 0 }}>
              <SortToggle value={sortDir} onChange={setSortDir} />
            </div>
          </div>
        )}

        {/* Quick-add bar */}
        <form
          onSubmit={handleQuickAdd}
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
          }}
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
              background: 'hsl(var(--card))',
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
                background: 'hsl(var(--card))',
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
