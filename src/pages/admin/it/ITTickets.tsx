import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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
          id: t.id as string,
          title: t.title as string,
          description: t.description as string,
          priority: t.priority as TicketPriority,
          status: t.status as TicketStatus,
          submitted_by: t.submitted_by as string,
          assigned_to: t.assigned_to as string | null,
          created_at: t.created_at as string,
          updated_at: t.updated_at as string,
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
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
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
