interface LogisticsStats {
  region: string
  total_orders: number
  avg_dispatch_hours: number
  avg_delivery_hours: number
  fulfillment_rate: number
}

interface RegionalPerformanceTableProps {
  velocity: LogisticsStats[]
}

export function RegionalPerformanceTable({ velocity }: RegionalPerformanceTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Regional performance
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            Average processing and transit times
          </div>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
        >
          bar_chart
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Jurisdiction</th>
              <th>Orders</th>
              <th>Dispatch</th>
              <th>Delivery</th>
              <th style={{ textAlign: 'right' }}>Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            {velocity.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  No dispatch telemetry available
                </td>
              </tr>
            ) : (
              velocity.map((v, idx) => (
                <tr key={idx}>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {v.region}
                  </td>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {v.total_orders} items
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        schedule
                      </span>
                      {v.avg_dispatch_hours}h
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {v.avg_delivery_hours}h
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 4,
                          background: 'hsl(var(--border))',
                          borderRadius: 99,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            background: 'hsl(var(--primary))',
                            width: `${v.fulfillment_rate}%`,
                            transition: 'width 1s ease',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: 11,
                          color: 'hsl(var(--primary))',
                          width: 34,
                          textAlign: 'right',
                        }}
                      >
                        {v.fulfillment_rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
