import type { Todo } from './types'
import { STATUS_CONFIG, isDueSoon, isOverdue, fmtDate } from './types'

interface TodoRowProps {
  todo: Todo
  onToggleDone: () => void
  onCycleStatus: () => void
  onDelete: () => void
}

export function TodoRow({ todo, onToggleDone, onCycleStatus, onDelete }: TodoRowProps) {
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
