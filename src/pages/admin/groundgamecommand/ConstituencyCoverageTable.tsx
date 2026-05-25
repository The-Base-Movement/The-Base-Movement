interface ConstituencyStat {
  constituency: string
  region: string
  members: number
  submitted: number
  verified: number
}

interface ConstituencyCoverageTableProps {
  constituencyStats: ConstituencyStat[]
}

export function ConstituencyCoverageTable({ constituencyStats }: ConstituencyCoverageTableProps) {
  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3>Constituency coverage</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-normal, 400)',
              marginTop: 2,
            }}
          >
            Members per constituency — sorted by presence. Use this to identify thin areas needing
            mobilization.
          </p>
        </div>
        <span className="meta">
          {constituencyStats.length}{' '}
          {constituencyStats.length === 1 ? 'constituency' : 'constituencies'}
        </span>
      </div>
      {constituencyStats.length === 0 ? (
        <p
          style={{
            padding: '32px 18px',
            textAlign: 'center',
            fontFamily: "'Public Sans'",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          No member data yet. Members will appear here once they set their constituency in profile
          settings.
        </p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Public Sans'" }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {[
                  'Constituency',
                  'Region',
                  'Members',
                  'Codes submitted',
                  'Verified',
                  'Coverage',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 16px',
                      textAlign: 'left',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9.5,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {constituencyStats.map((row, i) => {
                const coveragePct =
                  row.members > 0 ? Math.round((row.submitted / row.members) * 100) : 0
                const coverageColor =
                  coveragePct >= 70
                    ? 'hsl(var(--primary))'
                    : coveragePct >= 40
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--destructive))'
                return (
                  <tr
                    key={row.constituency}
                    style={{
                      borderBottom:
                        i < constituencyStats.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.constituency}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 'var(--font-weight-normal, 400)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.region}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.members}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 12,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.submitted}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 12,
                        fontVariantNumeric: 'tabular-nums',
                        color:
                          row.verified > 0 ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {row.verified}
                    </td>
                    <td style={{ padding: '10px 16px', minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 5,
                            background: 'hsl(var(--border))',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${coveragePct}%`,
                              height: '100%',
                              background: coverageColor,
                              borderRadius: 99,
                              transition: 'width .3s',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: coverageColor,
                            minWidth: 30,
                            textAlign: 'right',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {coveragePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
