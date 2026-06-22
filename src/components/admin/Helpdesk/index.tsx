/**
 * Helpdesk Component Index
 * -------------------------------------------------------------
 * Coordinate container for the IT Helpdesk ticketing system, checking permissions,
 * managing filter actions, exporting tickets, and displaying detail drawers/modals.
 */

import { useMemo } from 'react'
import { adminService } from '@/services/adminService'
import type { AdminRole } from '@/types/admin'
import { useHelpdesk } from './useHelpdesk'
import { TicketFilters } from './TicketFilters'
import { TicketTable } from './TicketTable'
import { TicketDetailPanel } from './TicketDetailPanel'
import type { HelpdeskTicket, HelpdeskProps } from './types'

const SUPER_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER']

/**
 * exportCSV
 * -------------------------------------------------------------
 * Converts ticket array into CSV document format and triggers download.
 */
function exportCSV(tickets: HelpdeskTicket[]) {
  const HEADERS = [
    'Subject',
    'Priority',
    'Status',
    'Submitted by',
    'Assigned to',
    'Department',
    'Created',
    'Last Updated',
  ]
  const rows = [
    HEADERS,
    ...tickets.map((t) => [
      t.subject,
      t.priority,
      t.status,
      t.submitter_name,
      t.assignee_name ?? '',
      t.department_name,
      new Date(t.created_at).toLocaleDateString('en-GB'),
      new Date(t.updated_at).toLocaleDateString('en-GB'),
    ]),
  ]
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `helpdesk-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Helpdesk
 * -------------------------------------------------------------
 * Main queue list renderer. Performs checks on staff access, exports lists,
 * manages tab filters, and mounts details side drawer.
 */
export function Helpdesk({ departmentId }: HelpdeskProps) {
  const currentUser = adminService.getCurrentUser()
  const userRole = currentUser?.role as AdminRole | undefined
  const isSuper = !!userRole && SUPER_ROLES.includes(userRole)

  const {
    tickets,
    departments,
    handlers,
    loading,
    filters,
    setFilters,
    detail,
    detailLoading,
    loadDetail,
    closeDetail,
    updateStatus,
    updatePriority,
    assignTicket,
    postComment,
    closeTicket,
    deleteTicket,
  } = useHelpdesk(departmentId)

  const dept = departments.find((d) => d.id === departmentId)
  const canWrite = isSuper || (!!userRole && (dept?.handler_roles ?? []).includes(userRole))

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const t of tickets) c[t.status] = (c[t.status] ?? 0) + 1
    return c
  }, [tickets])

  if (!canWrite && !isSuper) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 32,
            display: 'block',
            marginBottom: 8,
            color: 'hsl(var(--destructive))',
          }}
        >
          lock
        </span>
        You do not have access to this helpdesk queue.
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => exportCSV(tickets)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            download
          </span>
          Export CSV
        </button>
      </div>

      <TicketFilters filters={filters} onChange={setFilters} counts={counts} />

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <TicketTable
          tickets={tickets}
          loading={loading}
          canWrite={canWrite}
          onRowClick={(t) => loadDetail(t.id)}
          onClose={(t) => {
            if (confirm(`Close ticket "${t.subject}"?`)) closeTicket(t.id, t.submitted_by)
          }}
          onDelete={(t) => {
            if (confirm(`Delete ticket "${t.subject}"? This cannot be undone.`)) deleteTicket(t.id)
          }}
        />
      </div>

      {detail && !detailLoading && (
        <TicketDetailPanel
          ticket={detail.ticket}
          comments={detail.comments}
          attachments={detail.attachments}
          loading={detailLoading}
          canWrite={canWrite}
          handlers={handlers}
          onClose={closeDetail}
          onUpdateStatus={(status) =>
            updateStatus(detail.ticket.id, status, detail.ticket.submitted_by)
          }
          onUpdatePriority={(priority) => updatePriority(detail.ticket.id, priority)}
          onAssign={(userId) => assignTicket(detail.ticket.id, userId)}
          onPostComment={(body, isInternal) =>
            postComment(
              detail.ticket.id,
              currentUser?.id ?? '',
              body,
              isInternal,
              detail.ticket.submitted_by
            )
          }
        />
      )}
    </div>
  )
}
