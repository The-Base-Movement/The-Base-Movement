import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { ITTicketPanel } from './ITTicketPanel'

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
          .select('*, submitter:admins!submitted_by(name), assignee:admins!assigned_to(name)')
          .order('created_at', { ascending: false }),
        supabase.from('admins').select('id, name').in('role', ['SUPER_ADMIN', 'FOUNDER']),
      ])
      setItStaff((staff ?? []) as AdminStub[])
      setTickets(
        (rawTickets ?? []).map((t: Record<string, unknown>) => ({
          ...(t as Omit<ITTicket, 'submitter_name' | 'assignee_name'>),
          submitter_name: (t.submitter as { name: string } | null)?.name ?? 'Unknown',
          assignee_name: (t.assignee as { name: string } | null)?.name ?? null,
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

// ─── Stubs (replaced in Tasks 6 & 7) ─────────────────────────────────────────

function KanbanBoard(_props: {
  tickets: ITTicket[]
  itStaff: AdminStub[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
}) {
  return (
    <div
      style={{
        color: 'hsl(var(--on-surface-muted))',
        fontSize: 13,
        fontFamily: "'Public Sans', sans-serif",
        padding: '40px 0',
        textAlign: 'center',
      }}
    >
      Kanban board coming soon…
    </div>
  )
}

function MobileTicketList(_props: {
  tickets: ITTicket[]
  onStatusChange: (id: string, s: TicketStatus) => void
  onSelect: (id: string) => void
}) {
  return (
    <div
      style={{
        color: 'hsl(var(--on-surface-muted))',
        fontSize: 13,
        fontFamily: "'Public Sans', sans-serif",
        padding: '40px 0',
        textAlign: 'center',
      }}
    >
      Mobile list coming soon…
    </div>
  )
}
