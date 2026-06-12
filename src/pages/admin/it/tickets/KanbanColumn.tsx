import { useDroppable } from '@dnd-kit/core'
import type { ITTicket, AdminStub } from './types'
import { TICKET_COLUMNS } from '../itTicketUtils'
import { TicketCard } from './TicketCard'

interface KanbanColumnProps {
  column: (typeof TICKET_COLUMNS)[number]
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}

export function KanbanColumn({ column, tickets, itStaff, onAssign, onSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status })

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? 'hsl(var(--container-low))' : 'transparent',
        borderRadius: 'var(--radius-md)',
        minHeight: 200,
        transition: 'background 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `3px solid ${column.bar}`,
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {column.label}
        </p>
        <span
          style={{
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill)',
            background: column.bar,
            color: '#fff',
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {tickets.length}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px 8px' }}>
        {tickets.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 11,
              padding: '20px 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            No tickets
          </p>
        ) : (
          tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              itStaff={itStaff}
              onAssign={onAssign}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
