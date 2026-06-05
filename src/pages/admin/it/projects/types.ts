export type ProjectStatus = 'ongoing' | 'on_hold' | 'cancelled' | 'completed'

export interface Project {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  author_name: string
}

export const COLUMNS: {
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

export function colFor(s: ProjectStatus) {
  return COLUMNS.find((c) => c.status === s) ?? COLUMNS[0]
}

export function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
