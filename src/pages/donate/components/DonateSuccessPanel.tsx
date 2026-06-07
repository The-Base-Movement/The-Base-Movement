import { Link } from 'react-router-dom'

interface DonateSuccessPanelProps {
  variant: 'dashboard' | 'public'
  onNewContribution: () => void
}

export function DonateSuccessPanel({ variant, onNewContribution }: DonateSuccessPanelProps) {
  if (variant === 'dashboard') {
    return (
      <div
        className="panel"
        style={{ maxWidth: 520, margin: '24px auto 0', textAlign: 'center', padding: 40 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: 'hsla(var(--primary), 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            borderRadius: '50%',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: 'hsl(var(--primary))' }}
          >
            check_circle
          </span>
        </div>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 20,
            color: 'hsl(var(--on-surface))',
            marginBottom: 10,
            letterSpacing: '-0.02em',
          }}
        >
          Contribution Secured
        </h2>
        <p
          style={{
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.6,
            marginBottom: 24,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          Your capital has been recorded in the mobilization queue. Verification is in progress.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onNewContribution} className="btn btn-primary">
            New Contribution
          </button>
          <Link to="/dashboard" className="btn btn-outline" style={{ textDecoration: 'none' }}>
            View Dossier
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section
      style={{
        maxWidth: 640,
        margin: '80px auto 0',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        padding: 'clamp(32px, 8vw, 64px)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          background: 'rgba(0,107,63,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          borderRadius: '50%',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 48, color: 'hsl(var(--primary))' }}
        >
          check
        </span>
      </div>
      <h2
        style={{
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 'var(--font-weight-semibold, 600)',
          color: 'hsl(var(--on-surface))',
          marginBottom: 16,
          fontFamily: "'Public Sans', sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        Contribution Secured
      </h2>
      <p
        style={{
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.6,
          marginBottom: 40,
          fontWeight: 'var(--font-weight-medium, 500)',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        Your capital has been recorded in the mobilization queue. Verification is in progress. Thank
        you for your commitment to the movement.
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        className="md:flex-row"
      >
        <button
          onClick={onNewContribution}
          className="btn btn-primary"
          style={{ minWidth: 200, height: 48, textTransform: 'lowercase' }}
        >
          New Contribution
        </button>
        <Link
          to="/dashboard"
          className="btn btn-outline"
          style={{
            minWidth: 200,
            height: 48,
            textTransform: 'lowercase',
            textDecoration: 'none',
          }}
        >
          View Dossier
        </Link>
      </div>
    </section>
  )
}
