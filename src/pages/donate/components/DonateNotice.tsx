import { Link } from 'react-router-dom'

interface DonateNoticeProps {
  icon: string
  title: string
  message: string
  action?: { label: string; to: string }
}

/** Centered notice shown on the donate page when a contribution path is unavailable. */
export function DonateNotice({ icon, title, message, action }: DonateNoticeProps) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '48px auto',
        textAlign: 'center',
        padding: '40px 28px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 44, color: 'hsl(var(--on-surface-muted))' }}
      >
        {icon}
      </span>
      <h2
        style={{
          margin: '12px 0 8px',
          fontSize: 20,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.6,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {message}
      </p>
      {action && (
        <Link
          to={action.to}
          className="btn btn-primary"
          style={{ marginTop: 20, display: 'inline-flex' }}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
