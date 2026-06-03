import type { TicketStatus } from './ITTickets'

// ─── Column config ────────────────────────────────────────────────────────────

export const TICKET_COLUMNS: { status: TicketStatus; label: string; bar: string }[] = [
  { status: 'open', label: 'Open', bar: 'hsl(var(--on-surface))' },
  { status: 'in-progress', label: 'In Progress', bar: 'hsl(var(--accent))' },
  { status: 'resolved', label: 'Resolved', bar: 'hsl(var(--primary))' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
