import { useState, useEffect } from 'react'

interface ChapterDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}

interface Props {
  donations: ChapterDonation[]
}

function StatusPill({ status }: { status: string }) {
  const cls = status === 'Verified' ? 'pill-ok' : status === 'Pending' ? 'pill-warn' : 'pill-mute'
  return <span className={`pill ${cls}`}>{status}</span>
}

export function DonationsTab({ donations }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (donations.length === 0) {
    return (
      <div className="panel" style={{ padding: '48px 18px', textAlign: 'center' }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
        >
          volunteer_activism
        </span>
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            marginTop: 12,
          }}
        >
          No donations from chapter members yet.
        </p>
      </div>
    )
  }

  /* ── Mobile: card list ── */
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {donations.map((d) => (
          <div key={d.id} className="panel" style={{ padding: '16px 18px' }}>
            {/* Donor + status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {d.full_name}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {d.phone}
                </p>
              </div>
              <StatusPill status={d.status} />
            </div>

            {/* Amount — prominent */}
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 22,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--primary))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.01em',
              }}
            >
              GH₵ {Number(d.amount).toLocaleString()}
            </p>

            {/* Detail rows */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Method', value: d.payment_method },
                { label: 'Reference', value: d.reference || '—' },
                { label: 'Date', value: new Date(d.created_at).toLocaleDateString('en-GB') },
              ].map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 14px',
                    borderTop: i === 0 ? 'none' : '1px solid hsl(var(--border))',
                    background: i % 2 === 0 ? '#fff' : 'hsl(var(--container-low))',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily:
                        row.label === 'Reference' ? 'monospace' : "'Public Sans', sans-serif",
                      textAlign: 'right',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ── Desktop: full table ── */
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
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
            {donations.map((d) => (
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
                  GH₵ {Number(d.amount).toLocaleString()}
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
                  <StatusPill status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
