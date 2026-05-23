import { type MemberDonation } from '@/services/adminService'

interface DonationsTabProps {
  donations: MemberDonation[]
}

export function DonationsTab({ donations }: DonationsTabProps) {
  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="ph2">
          <h3>Contribution summary</h3>
          <span className="meta">all time</span>
        </div>
        <div style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'flex-end',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 36,
                letterSpacing: '-.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: 'hsl(var(--on-surface-muted))',
                  marginRight: 3,
                }}
              >
                ₵
              </span>
              {donations.reduce((s, d) => s + d.amount, 0).toLocaleString() || '0'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                paddingBottom: 5,
              }}
            >
              lifetime · {donations.length} donation
              {donations.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 3,
              alignItems: 'flex-end',
              height: 56,
              marginBottom: 4,
            }}
          >
            {(donations.length > 0
              ? donations.slice(-12).map((d, i, arr) => ({
                  h: Math.max(
                    8,
                    Math.round((d.amount / Math.max(...arr.map((x) => x.amount))) * 100)
                  ),
                  last: i === arr.length - 1,
                }))
              : [20, 35, 25, 40, 60, 45, 55, 70, 62, 80, 72, 95].map((h, i) => ({
                  h,
                  last: i === 11,
                }))
            ).map(({ h, last }, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: last ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                  borderRadius: 1,
                  opacity: last ? 1 : 0.55,
                  height: `${h}%`,
                }}
              />
            ))}
          </div>
          {donations.length === 0 && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              No donation records yet.
            </p>
          )}
        </div>
      </div>
      <div className="panel">
        <div className="ph2">
          <h3>Donation history</h3>
          <span className="meta">{donations.length} records</span>
        </div>
        {donations.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 32,
                color: 'hsl(var(--border))',
                display: 'block',
                marginBottom: 8,
              }}
            >
              volunteer_activism
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              No donations on record.
            </p>
          </div>
        ) : (
          <div>
            {donations.map((d, i, arr) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 24px',
                  borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(218,165,32,.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, color: '#a87d10' }}
                  >
                    payments
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 12.5,
                    }}
                  >
                    {d.label}
                  </p>
                  <span
                    style={{
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    {d.date} · {d.method} · ref {d.ref}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 13,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    ₵{d.amount.toLocaleString()}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: d.cleared ? 'hsl(var(--primary))' : '#a87d10',
                    }}
                  >
                    {d.cleared ? 'cleared' : 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
