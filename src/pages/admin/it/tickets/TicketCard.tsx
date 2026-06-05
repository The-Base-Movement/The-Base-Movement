import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDraggable } from '@dnd-kit/core'
import type { ITTicket, AdminStub, TicketPriority } from './types'
import { relativeTime } from '../itTicketUtils'

interface TicketCardProps {
  ticket: ITTicket
  itStaff: AdminStub[]
  onAssign: (id: string, adminId: string | null) => void
  onSelect: (id: string) => void
  isDragging?: boolean
}

export function TicketCard({
  ticket,
  itStaff,
  onAssign,
  onSelect,
  isDragging = false,
}: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: ticket.id })
  const [assignOpen, setAssignOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)
  const assignBtnRef = useRef<HTMLButtonElement>(null)

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

  const openAssign = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (assignBtnRef.current) {
      const rect = assignBtnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setAssignOpen((v) => !v)
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
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
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
            ref={assignBtnRef}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0 6px', fontSize: 10 }}
            onClick={openAssign}
          >
            Assign
          </button>
          {assignOpen &&
            dropdownPos &&
            createPortal(
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setAssignOpen(false)}
                />
                <div
                  style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    right: dropdownPos.right,
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
              </>,
              document.body
            )}
        </div>
      </div>
    </div>
  )
}
