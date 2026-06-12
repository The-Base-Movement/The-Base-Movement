import type { ITTicket, TicketStatus, TicketPriority } from './types'
import { relativeTime } from '../itTicketUtils'

interface MobileTicketListProps {
  tickets: ITTicket[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onSelect: (id: string) => void
}

export function MobileTicketList({ tickets, onStatusChange, onSelect }: MobileTicketListProps) {
  const priorityPill: Record<TicketPriority, string> = {
    high: 'pill pill-err',
    medium: 'pill pill-warn',
    low: 'pill pill-mute',
  }

  if (tickets.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        No tickets yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          className="panel"
          style={{ padding: '14px 16px', cursor: 'pointer' }}
          onClick={() => onSelect(ticket.id)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                flex: 1,
              }}
            >
              {ticket.title}
            </p>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                flex: 1,
              }}
            >
              {ticket.submitter_name} · {relativeTime(ticket.created_at)}
            </span>
            <select
              value={ticket.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
              style={{
                fontSize: 11,
                fontFamily: "'Public Sans', sans-serif",
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 6px',
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
                cursor: 'pointer',
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
