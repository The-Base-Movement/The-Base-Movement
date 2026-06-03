import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { ITTicketPanel } from './ITTicketPanel'
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { TICKET_COLUMNS, relativeTime } from './itTicketUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in-progress' | 'resolved'

export interface ITTicket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  submitted_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  submitter_name: string
  assignee_name: string | null
}

export interface AdminStub {
  id: string
  name: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ITTickets() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()
  const currentUser = adminService.getCurrentUser()

  useEffect(() => {
    setCurrentLabel('IT Helpdesk')
  }, [setCurrentLabel])

  const [tickets, setTickets] = useState<ITTicket[]>([])
  const [itStaff, setItStaff] = useState<AdminStub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: rawTickets }, { data: staff }] = await Promise.all([
        supabase
          .from('it_tickets')
          .select(
            '*, submitter:users!submitted_by(full_name), assignee:users!assigned_to(full_name)'
          )
          .order('created_at', { ascending: false }),
        supabase
          .from('admins')
          .select('id, users!admins_id_fkey(full_name)')
          .in('role', ['SUPER_ADMIN', 'FOUNDER']),
      ])
      setItStaff(
        (staff ?? []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: (s.users as { full_name: string } | null)?.full_name ?? 'Unknown',
        }))
      )
      setTickets(
        (rawTickets ?? []).map((t: Record<string, unknown>) => ({
          ...(t as Omit<ITTicket, 'submitter_name' | 'assignee_name'>),
          submitter_name: (t.submitter as { full_name: string } | null)?.full_name ?? 'Unknown',
          assignee_name: (t.assignee as { full_name: string } | null)?.full_name ?? null,
        }))
      )
    } catch (err) {
      console.error('[ITTickets] load error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
    const { error } = await supabase
      .from('it_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId)
    if (error) {
      toast.error('Failed to update status')
      load()
    }
  }

  const assignTicket = async (ticketId: string, adminId: string | null) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t
        const staffMember = itStaff.find((s) => s.id === adminId)
        return { ...t, assigned_to: adminId, assignee_name: staffMember?.name ?? null }
      })
    )
    const { error } = await supabase
      .from('it_tickets')
      .update({ assigned_to: adminId })
      .eq('id', ticketId)
    if (error) {
      toast.error('Failed to assign ticket')
      load()
    }
  }

  const totalCount = tickets.length
  const openCount = tickets.filter((t) => t.status === 'open').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length

  const kpis = [
    { label: 'Total Tickets', value: totalCount, bar: 'hsl(var(--on-surface))' },
    { label: 'Open', value: openCount, bar: 'hsl(var(--destructive))' },
    { label: 'Resolved', value: resolvedCount, bar: 'hsl(var(--primary))' },
  ]

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null

  return (
    <div>
      <AdminPageHeader
        title="IT Helpdesk"
        icon="confirmation_number"
        description="Manage support tickets from the team."
      />

      <div className="kpis" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {loading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Loading tickets…
        </div>
      ) : isMobile ? (
        <MobileTicketList
          tickets={tickets}
          onStatusChange={updateStatus}
          onSelect={setSelectedId}
        />
      ) : (
        <KanbanBoard
          tickets={tickets}
          itStaff={itStaff}
          onStatusChange={updateStatus}
          onAssign={assignTicket}
          onSelect={setSelectedId}
        />
      )}

      {selectedTicket && (
        <ITTicketPanel
          ticket={selectedTicket}
          currentUserId={currentUser?.id ?? ''}
          isItStaff={currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'FOUNDER'}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
    </div>
  )
}

// ─── Kanban Board (Task 6) ────────────────────────────────────────────────────

function KanbanBoard({
  tickets,
  itStaff,
  onStatusChange,
  onAssign,
  onSelect,
}: {
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
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

function KanbanColumn({
  column,
  tickets,
  itStaff,
  onAssign,
  onSelect,
}: {
  column: (typeof TICKET_COLUMNS)[number]
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
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

function TicketCard({
  ticket,
  itStaff,
  onAssign,
  onSelect,
  isDragging = false,
}: {
  ticket: ITTicket
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: ticket.id })
  const [assignOpen, setAssignOpen] = useState(false)

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const priorityPill: Record<TicketPriority, string> = {
    high: 'pill pill-err',
    medium: 'pill pill-warn',
    low: 'pill pill-mute',
  }

  return (
    <div ref={setNodeRef} style={{ ...style, position: 'relative' }}>
      <div className="panel" style={{ padding: '12px 14px' }}>
        <div
          {...attributes}
          {...listeners}
          style={{ marginBottom: 8 }}
          onClick={() => onSelect(ticket.id)}
        >
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              display: '-webkit-box',
              WebkitLineClamp: 2 as number,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {ticket.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className={priorityPill[ticket.priority]}>{ticket.priority}</span>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {ticket.submitter_name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginLeft: 'auto',
              }}
            >
              {relativeTime(ticket.created_at)}
            </span>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
          >
            person
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface-muted))',
              flex: 1,
            }}
          >
            {ticket.assignee_name ?? 'Unassigned'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0 6px', fontSize: 10 }}
            onClick={(e) => {
              e.stopPropagation()
              setAssignOpen((v) => !v)
            }}
          >
            Assign
          </button>
          {assignOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setAssignOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  zIndex: 50,
                  background: '#fff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  minWidth: 160,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                }}
              >
                {itStaff.map((s) => (
                  <button
                    key={s.id}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      onAssign(ticket.id, s.id)
                      setAssignOpen(false)
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    borderTop: '1px solid hsl(var(--border))',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    onAssign(ticket.id, null)
                    setAssignOpen(false)
                  }}
                >
                  Unassign
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Ticket List ───────────────────────────────────────────────────────

function MobileTicketList({
  tickets,
  onStatusChange,
  onSelect,
}: {
  tickets: ITTicket[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onSelect: (id: string) => void
}) {
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
