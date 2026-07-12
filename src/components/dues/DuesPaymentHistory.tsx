import type { MonthlyDuesPayment } from '@/services/monthlyDuesService'

const FONT = "'Public Sans', sans-serif"

function statusPill(status: MonthlyDuesPayment['status']) {
  if (status === 'paid') return 'pill-ok'
  if (status === 'due' || status === 'pending') return 'pill-warn'
  if (status === 'failed' || status === 'overdue') return 'pill-err'
  return 'pill-mute'
}

function fmtMonth(month: string) {
  return new Date(`${month}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function fmtDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

interface DuesPaymentHistoryProps {
  payments: MonthlyDuesPayment[]
  onRetry?: (payment: MonthlyDuesPayment) => void
}

export default function DuesPaymentHistory({ payments, onRetry }: DuesPaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
          }}
        >
          Your monthly dues history will appear here.
        </p>
      </div>
    )
  }

  const th: React.CSSProperties = {
    padding: '11px 18px',
    textAlign: 'left',
    fontFamily: FONT,
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '12px 18px',
    fontSize: 12,
    color: 'hsl(var(--on-surface))',
    fontFamily: FONT,
    fontWeight: 'var(--font-weight-medium, 500)',
    whiteSpace: 'nowrap',
  }

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="ph">
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Payment History</h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            {payments.length} month{payments.length === 1 ? '' : 's'} on record
          </p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'hsl(var(--container-low))',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              {['Month', 'Due Date', 'Amount', 'GHS', 'Method', 'Status', 'Receipt'].map((h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <td style={td}>{fmtMonth(p.dues_month)}</td>
                <td style={{ ...td, color: 'hsl(var(--on-surface-muted))' }}>
                  {fmtDate(p.due_date)}
                </td>
                <td style={td}>
                  {p.display_currency} {p.display_amount.toFixed(2)}
                </td>
                <td style={td}>₵{p.amount_ghs.toFixed(2)}</td>
                <td style={{ ...td, color: 'hsl(var(--on-surface-muted))' }}>
                  {p.payment_mode === 'offline'
                    ? 'Offline'
                    : p.payment_mode === 'recurring_hubtel'
                      ? 'Recurring'
                      : 'Hubtel'}
                </td>
                <td style={{ padding: '12px 18px' }}>
                  <span className={`pill ${statusPill(p.status)}`}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 18px' }}>
                  {p.status === 'paid' && p.receipt_number ? (
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {p.receipt_number}
                    </span>
                  ) : p.status === 'failed' && onRetry ? (
                    <button className="btn btn-outline btn-sm" onClick={() => onRetry(p)}>
                      Retry payment
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only">
        {payments.map((p, i) => (
          <div
            key={p.id}
            style={{
              padding: '14px 16px',
              borderBottom: i < payments.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: FONT,
                }}
              >
                {fmtMonth(p.dues_month)}
              </p>
              <span className={`pill ${statusPill(p.status)}`}>{p.status}</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
              }}
            >
              <span>
                {p.display_currency} {p.display_amount.toFixed(2)}
              </span>
              <span>·</span>
              <span>₵{p.amount_ghs.toFixed(2)}</span>
              <span>·</span>
              <span>Due {fmtDate(p.due_date)}</span>
            </div>
            {p.status === 'paid' && p.receipt_number && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {p.receipt_number}
              </span>
            )}
            {p.status === 'failed' && onRetry && (
              <button
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => onRetry(p)}
              >
                Retry payment
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
