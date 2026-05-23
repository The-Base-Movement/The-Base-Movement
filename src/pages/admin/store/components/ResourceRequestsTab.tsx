import type { ResourceRequest } from '@/services/adminService'

interface ResourceRequestsTabProps {
  requests: ResourceRequest[]
  handleStatusUpdate: (id: string, status: ResourceRequest['status']) => Promise<void>
}

function priorityPill(priority: string) {
  if (priority === 'Urgent') return 'pill pill-err'
  if (priority === 'High') return 'pill pill-warn'
  return 'pill pill-mute'
}

function statusPill(status: string) {
  if (status === 'Delivered') return 'pill pill-ok'
  if (status === 'Pending') return 'pill pill-warn'
  if (status === 'Rejected') return 'pill pill-err'
  return 'pill pill-mute'
}

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11.5,
  background: '#fff',
  color: 'hsl(var(--on-surface))',
  cursor: 'pointer',
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 9.5,
  fontWeight: 'var(--font-weight-semibold, 600)',
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left' as const,
  whiteSpace: 'nowrap' as const,
}

export function ResourceRequestsTab({ requests, handleStatusUpdate }: ResourceRequestsTabProps) {
  if (requests.length === 0) {
    return (
      <div className="panel">
        <div className="ph">
          <h3>Regional resource requests</h3>
        </div>
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--border))',
              display: 'block',
              marginBottom: 10,
            }}
          >
            local_shipping
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
            No active resource requests.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Regional resource requests</h3>
        <span className="meta">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Region', 'Items requested', 'Submitted', 'Priority', 'Status', 'Action'].map(
                (h, i) => (
                  <th key={h} style={{ ...thStyle, textAlign: i === 5 ? 'right' : 'left' }}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr
                key={req.id}
                style={{ borderBottom: '1px solid hsl(var(--border))' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))')
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 12.5,
                    }}
                  >
                    {req.region}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 2,
                    }}
                  >
                    {req.constituency || 'Regional HQ'}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {req.items.map((item) => (
                      <span
                        key={item.id}
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {item.quantity}× {item.productName || 'Unknown product'}
                      </span>
                    ))}
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11.5,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {new Date(req.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={priorityPill(req.priority)}>{req.priority}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={statusPill(req.status)}>{req.status}</span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <select
                    name="name-91c614"
                    id="select-91c614"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value)
                        handleStatusUpdate(req.id, e.target.value as ResourceRequest['status'])
                    }}
                    style={selectStyle}
                  >
                    <option value="" disabled>
                      Update…
                    </option>
                    <option value="Approved">Approve</option>
                    <option value="Dispatched">Dispatch</option>
                    <option value="Delivered">Deliver</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only">
        {requests.map((req) => (
          <div
            key={req.id}
            style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
          >
            {/* Row 1: region + priority */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 13.5,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {req.region}
                </p>
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {req.constituency || 'Regional HQ'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span className={priorityPill(req.priority)}>{req.priority}</span>
                <span className={statusPill(req.status)}>{req.status}</span>
              </div>
            </div>

            {/* Row 2: items */}
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Items requested
              </div>
              {req.items.map((item) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {item.productName}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    ×{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Row 3: date + action select */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 10,
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
              <select
                name="name-02f646"
                id="select-02f646"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value)
                    handleStatusUpdate(req.id, e.target.value as ResourceRequest['status'])
                }}
                style={{ ...selectStyle, height: 36, flex: 1, maxWidth: 180 }}
              >
                <option value="" disabled>
                  Update status…
                </option>
                <option value="Approved">Approve</option>
                <option value="Dispatched">Dispatch</option>
                <option value="Delivered">Deliver</option>
                <option value="Rejected">Reject</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
