import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import type { ITTicket, AdminStub, TicketStatus } from './types'
import { TICKET_COLUMNS } from '../itTicketUtils'
import { TicketCard } from './TicketCard'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}

export function KanbanBoard({
  tickets,
  itStaff,
  onStatusChange,
  onAssign,
  onSelect,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggingId(null)
    if (!over || active.id === over.id) return
    const newStatus = over.id as TicketStatus
    const ticket = tickets.find((t) => t.id === active.id)
    if (ticket && ticket.status !== newStatus) {
      onStatusChange(active.id as string, newStatus)
    }
  }

  const draggingTicket = tickets.find((t) => t.id === draggingId) ?? null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setDraggingId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {TICKET_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            column={col}
            tickets={tickets.filter((t) => t.status === col.status)}
            itStaff={itStaff}
            onAssign={onAssign}
            onSelect={onSelect}
          />
        ))}
      </div>
      <DragOverlay>
        {draggingTicket && (
          <TicketCard
            ticket={draggingTicket}
            itStaff={itStaff}
            onAssign={onAssign}
            onSelect={onSelect}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
