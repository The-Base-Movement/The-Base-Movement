import type { ChapterDonation } from './types'

interface HubDonationsListProps {
  donations: ChapterDonation[]
}

function donationStatusClass(status: string) {
  if (status === 'Verified') return 'pill-ok'
  if (status === 'Pending') return 'pill-warn'
  return 'pill-mute'
}

export function HubDonationsList({ donations }: HubDonationsListProps) {
  const emptyState = (
    <div
      style={{
        padding: '48px 18px',
        textAlign: 'center',
        fontSize: 13,
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      No donations from chapter members yet.
    </div>
  )

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Donor', 'Amount', 'Method', 'Reference', 'Date', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 18px',
                    textAlign: 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <tr>
                <td colSpan={6}>{emptyState}</td>
              </tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 18px' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {d.full_name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {d.phone}
                    </p>
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`GH₵ ${Number(d.amount).toLocaleString()}`}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {d.payment_method}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: 'monospace',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {d.reference || '—'}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(d.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span className={`pill ${donationStatusClass(d.status)}`}>{d.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mobile-only">
        {donations.length === 0 ? (
          emptyState
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {donations.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Top row: name + amount */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {d.full_name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {d.phone}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`GH₵ ${Number(d.amount).toLocaleString()}`}
                  </span>
                </div>

                {/* Bottom row: date + method + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {new Date(d.created_at).toLocaleDateString('en-GB')}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    · {d.payment_method}
                  </span>
                  <span className={`pill ${donationStatusClass(d.status)}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
