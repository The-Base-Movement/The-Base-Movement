import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TicketPriority } from '@/pages/admin/it/ITTickets'

interface Props {
  userId: string
  onClose: () => void
}

const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}

export function SubmitTicketModal({ userId, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDesc] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const t = title.trim()
    const d = description.trim()
    if (!t) {
      setError('Title is required.')
      return
    }
    if (t.length > 120) {
      setError('Title must be 120 characters or fewer.')
      return
    }
    if (!d) {
      setError('Description is required.')
      return
    }
    setError('')
    setSubmitting(true)
    const { error: err } = await supabase
      .from('it_tickets')
      .insert({ title: t, description: d, priority, submitted_by: userId })
    if (err) {
      setError('Failed to submit ticket. Please try again.')
    } else {
      toast.success('Ticket submitted. The IT team will be in touch.')
      onClose()
    }
    setSubmitting(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              support_agent
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Submit IT Support Ticket
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="ticket-title"
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              Title
            </label>
            <input
              id="ticket-title"
              name="ticketTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={120}
              style={{ ...inputSt, height: 38 }}
            />
          </div>

          <div>
            <label
              htmlFor="ticket-description"
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              id="ticket-description"
              name="ticketDescription"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the issue in detail…"
              rows={4}
              style={{ ...inputSt, padding: '8px 12px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Priority
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={priority === p ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--destructive))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            className="btn btn-outline btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
