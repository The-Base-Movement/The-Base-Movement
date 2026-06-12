export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'blocked'

export interface Todo {
  id: string
  task: string
  status: TodoStatus
  assignee_id: string | null
  assignee_name: string | null
  due_date: string | null
  created_at: string
}

export interface UserOption {
  id: string
  full_name: string
}

export const STATUS_CONFIG: Record<
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
  blocked: {
    label: 'Blocked',
    icon: 'block',
    pill: 'pill-err',
    color: 'hsl(var(--destructive))',
  },
  done: {
    label: 'Done',
    icon: 'check_circle',
    pill: 'pill-ok',
    color: 'hsl(var(--primary))',
  },
}

export const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  todo: 'in_progress',
  in_progress: 'blocked',
  blocked: 'todo',
  done: 'todo',
}

export const ALL_STATUSES: TodoStatus[] = ['todo', 'in_progress', 'blocked', 'done']

export function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function isDueSoon(iso: string | null): boolean {
  if (!iso) return false
  const diff = new Date(iso).getTime() - Date.now()
  return diff >= 0 && diff < 2 * 24 * 60 * 60 * 1000
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso).getTime() < Date.now()
}
