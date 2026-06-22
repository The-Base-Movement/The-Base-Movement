/**
 * TicketTable Component
 * -------------------------------------------------------------
 * Table listing interface presenting helpdesk support tickets, showing priority badges,
 * assignment metadata, status indicators, and context action dropdowns.
 */

import { useState } from 'react'
import type { HelpdeskTicket, TicketPriority, TicketStatus } from './types'

const PRIORITY_PILL: Record<TicketPriority, string> = {
  urgent: 'pill pill-err',
  high: 'pill pill-err',
  medium: 'pill pill-warn',
  low: 'pill pill-mute',
}

const STATUS_PILL: Record<TicketStatus, string> = {
  open: 'pill pill-err',
  'in-progress': 'pill pill-warn',
  resolved: 'pill pill-ok',
  closed: 'pill pill-mute',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

/**
 * relativeTime
 * -------------------------------------------------------------
 * Helper function converting an ISO date string to a human-readable relative time representation.
 */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  tickets: HelpdeskTicket[]
  loading: boolean
  canWrite: boolean
  onRowClick: (ticket: HelpdeskTicket) => void
  onClose: (ticket: HelpdeskTicket) => void
  onDelete: (ticket: HelpdeskTicket) => void
}

/**
 * TicketTable
 * -------------------------------------------------------------
 * Component mapping and mounting support ticket information in tabular rows.
 */
export function TicketTable({ tickets, loading, canWrite, onRowClick, onClose, onDelete }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (loading) {
    return (
      <div
        style={{
          padding: '48px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        Loading tickets…
      </div>
    )
  }

  if (!tickets.length) {
    return (
      <div
        style={{
          padding: '48px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No tickets match the current filters.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            {[
              'Priority',
              'Subject',
              'Submitted by',
              'Assigned to',
              'Status',
              'Last Updated',
              '',
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onRowClick(ticket)}
              style={{
                borderBottom: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '10px 12px' }}>
                <span className={PRIORITY_PILL[ticket.priority]}>{ticket.priority}</span>
              </td>
              <td style={{ padding: '10px 12px', maxWidth: 280 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ticket.subject}
                </p>
              </td>
              <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                {ticket.submitter_name}
              </td>
              <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                {ticket.assignee_name ?? '—'}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span className={STATUS_PILL[ticket.status]}>{STATUS_LABEL[ticket.status]}</span>
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  color: 'hsl(var(--on-surface-muted))',
                  whiteSpace: 'nowrap',
                }}
              >
                {relativeTime(ticket.updated_at)}
              </td>
              <td
                style={{ padding: '10px 12px', position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
              >
                {canWrite && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => setOpenMenuId((v) => (v === ticket.id ? null : ticket.id))}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        more_vert
                      </span>
                    </button>
                    {openMenuId === ticket.id && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 4px)',
                            zIndex: 50,
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            minWidth: 140,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          {ticket.status !== 'closed' && (
                            <button
                              className="btn btn-ghost"
                              style={{
                                width: '100%',
                                padding: '9px 14px',
                                textAlign: 'left',
                                fontSize: 13,
                                borderRadius: 0,
                              }}
                              onClick={() => {
                                setOpenMenuId(null)
                                onClose(ticket)
                              }}
                            >
                              Close Ticket
                            </button>
                          )}
                          <button
                            className="btn btn-ghost"
                            style={{
                              width: '100%',
                              padding: '9px 14px',
                              textAlign: 'left',
                              fontSize: 13,
                              borderRadius: 0,
                              color: 'hsl(var(--destructive))',
                            }}
                            onClick={() => {
                              setOpenMenuId(null)
                              onDelete(ticket)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
