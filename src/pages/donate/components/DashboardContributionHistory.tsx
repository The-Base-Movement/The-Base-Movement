import type { DonationDetail } from '@/types/admin'

interface DashboardContributionHistoryProps {
  loading: boolean
  displayHistory: DonationDetail[]
  contributionFilter: 'all' | 'me'
  onFilterChange: (f: 'all' | 'me') => void
  onViewFullLedger: () => void
}

export function DashboardContributionHistory({
  loading,
  displayHistory,
  contributionFilter,
  onFilterChange,
  onViewFullLedger,
}: DashboardContributionHistoryProps) {
  return (
    <div className="panel">
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1px solid hsl(var(--border))',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Contribution History
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontWeight: 500,
            }}
          >
            Movement mobilization ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {(['all', 'me'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`btn btn-sm ${contributionFilter === f ? 'btn-primary' : 'btn-outline'}`}
            >
              {f === 'all' ? 'All Records' : 'My Records'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {['Contributor', 'Campaign', 'Amount', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 18px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '32px 18px',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                  }}
                >
                  Loading...
                </td>
              </tr>
            ) : displayHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '32px 18px',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                  }}
                >
                  No records found.
                </td>
              </tr>
            ) : (
              displayHistory.slice(0, 10).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '10px 18px' }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                      }}
                    >
                      {item.fullName}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                        fontWeight: 'var(--font-weight-medium, 500)',
                      }}
                    >
                      {item.date}
                    </p>
                  </td>
                  <td style={{ padding: '10px 18px' }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                      }}
                    >
                      {item.campaignTitle || 'Strategic Fund'}
                    </p>
                  </td>
                  <td style={{ padding: '10px 18px' }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {item.amount}
                    </p>
                  </td>
                  <td style={{ padding: '10px 18px' }}>
                    <span
                      className={`pill ${item.status === 'Verified' ? 'pill-ok' : 'pill-warn'}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {displayHistory.length > 10 && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid hsl(var(--border))',
            textAlign: 'right',
          }}
        >
          <button onClick={onViewFullLedger} className="btn btn-outline btn-sm">
            View full ledger
          </button>
        </div>
      )}
    </div>
  )
}
