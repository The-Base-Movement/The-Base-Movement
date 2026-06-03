import { createPortal } from 'react-dom'
import type { ITTicket } from './ITTickets'

interface Props {
  ticket: ITTicket
  currentUserId: string
  isItStaff: boolean
  onClose: () => void
  onUpdated: () => void
}

export function ITTicketPanel({ onClose }: Props) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 420,
          background: '#fff',
          borderLeft: '1px solid hsl(var(--border))',
          padding: 24,
          fontFamily: "'Public Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          Panel — coming in Task 8
        </p>
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}
