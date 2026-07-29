import { type AuditLogEntry } from '@/services/adminService'

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid hsl(var(--border))',
  verticalAlign: 'middle',
}

interface AuditLogsTableProps {
  logs: AuditLogEntry[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onSelectRow: (log: AuditLogEntry) => void
}

export function AuditLogsTable({
  logs,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onSelectRow,
}: AuditLogsTableProps) {
  return (
    <div className="panel" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table className="audit-logs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'hsl(var(--container-low))',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <th style={thStyle}>Timestamp</th>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Resource</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 150,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 120,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 100,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 80,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 60,
                        height: 20,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 100,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '40px 16px' }}>
                  <p style={{ color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                    No audit logs found
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectRow(log)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background =
                      'hsl(var(--container-low))'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                  }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12 }}>{log.adminName}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12 }}>{log.action}</span>
                  </td>
                  <td style={tdStyle}>
                    {log.resourceName ? (
                      <>
                        {/* Name first — a bare UUID is untraceable. The raw
                            reference stays beneath it so the record is still
                            identifiable when names collide or change. */}
                        <span style={{ fontSize: 12, display: 'block' }}>{log.resourceName}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 260,
                          }}
                          title={log.resource}
                        >
                          {log.resource}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 12 }}>{log.resource}</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span
                      className={`pill ${
                        log.status === 'Success'
                          ? 'pill-ok'
                          : log.status === 'Failure'
                            ? 'pill-err'
                            : log.status === 'Warning'
                              ? 'pill-warn'
                              : 'pill-mute'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12 }}>{log.ipAddress || 'N/A'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
