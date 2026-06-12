import type { RegionalStat } from '@/types/admin'

interface RegionalPaceTableProps {
  regionalStats: RegionalStat[]
}

export function RegionalPaceTable({ regionalStats }: RegionalPaceTableProps) {
  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <h3
          style={{
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 12.5,
            color: 'hsl(var(--on-surface))',
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Regions · pace to goal
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Ytd
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'hsl(var(--container-low))',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 16px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Region
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '6px 16px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Members
              </th>
              <th
                style={{
                  padding: '6px 16px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                % goal
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const seen = new Set()
              const filtered = regionalStats.filter((r) => {
                const rName = r.region.trim()
                if (seen.has(rName)) return false
                seen.add(rName)
                return true
              })
              return filtered.map((r, i) => (
                <tr
                  key={r.region}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <td
                    style={{
                      padding: '6px 16px',
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {r.region}
                  </td>
                  <td
                    style={{
                      padding: '6px 16px',
                      textAlign: 'right',
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {r.memberCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '6px 16px' }}>
                    <div
                      style={{
                        width: 80,
                        height: 4,
                        borderRadius: 9999,
                        overflow: 'hidden',
                        background: 'hsl(var(--border))',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 9999,
                          width: `${Math.min(100, Math.floor((r.memberCount / 5000) * 100))}%`,
                          background:
                            r.performance === 'High'
                              ? 'hsl(var(--primary))'
                              : r.performance === 'Medium'
                                ? 'hsl(var(--accent))'
                                : 'hsl(var(--destructive))',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
