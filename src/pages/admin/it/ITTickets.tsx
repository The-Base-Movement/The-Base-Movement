/**
 * IT Tickets Page Component
 * -------------------------------------------------------------
 * Component for administering helpdesk support tickets.
 * Displays KPI metrics, ticket Kanban boards, assignments, and resolution states.
 */

import { useEffect, useState, useCallback } from 'react'
import { StatTile } from '@/components/admin/StatTile'
import { itService } from '@/services/itService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { ITTicketPanel } from './ITTicketPanel'
import type { ITTicket, TicketStatus, TicketPriority, AdminStub } from './tickets/types'
export type { ITTicket, TicketStatus, TicketPriority, AdminStub } from './tickets/types'
import { KanbanBoard } from './tickets/KanbanBoard'
import { MobileTicketList } from './tickets/MobileTicketList'

// Main support tickets management page component
export default function ITTickets() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()
  const currentUser = adminService.getCurrentUser()

  useEffect(() => {
    setCurrentLabel('IT Helpdesk')
  }, [setCurrentLabel])

  useITLayout('IT Helpdesk', 'confirmation_number', 'Manage support tickets from the team.')

  const [tickets, setTickets] = useState<ITTicket[]>([])
  const [itStaff, setItStaff] = useState<AdminStub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Query tickets manifest and system administrators roster from databases
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { tickets: rawTickets, itStaff: staff } = await itService.getTicketsWithStaff()
      setItStaff(staff)
      setTickets(
        rawTickets.map((t) => ({
          ...t,
          priority: t.priority as TicketPriority,
          status: t.status as TicketStatus,
        }))
      )
    } catch (err) {
      console.error('[ITTickets] load error', err)
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

  // Update status state configuration for a support ticket card
  const updateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
    try {
      await itService.updateTicket(ticketId, { status: newStatus })
    } catch {
      toast.error('Failed to update status')
      load()
    }
  }

  // Assign ticket to a specific administrator or support representative
  const assignTicket = async (ticketId: string, adminId: string | null) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t
        const staffMember = itStaff.find((s) => s.id === adminId)
        return { ...t, assigned_to: adminId, assignee_name: staffMember?.name ?? null }
      })
    )
    try {
      await itService.updateTicket(ticketId, { assigned_to: adminId })
    } catch {
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
      <div className="kpis" style={{ marginBottom: 28 }}>
        {kpis.map((kpi) => (
          <StatTile
            key={kpi.label}
            label={kpi.label}
            value={loading ? '—' : kpi.value}
            bar={kpi.bar}
          />
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
