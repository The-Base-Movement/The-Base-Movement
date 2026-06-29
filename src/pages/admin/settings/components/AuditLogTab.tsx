import { useState } from 'react'
import type { AuditLogEntry } from '@/services/adminService'
import { SortToggle } from '@/components/ui/SortToggle'

interface AuditLogTabProps {
  auditSearch: string
  setAuditSearch: (val: string) => void
  auditFilter: string
  setAuditFilter: (val: string) => void
  auditResourceFilter: string
  setAuditResourceFilter: (val: string) => void
  filteredLogs: AuditLogEntry[]
  auditSortOrder: 'asc' | 'desc'
  onAuditSortChange: (val: 'asc' | 'desc') => void
  handleExportLogs: () => void
}

const selSt: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 4,
  cursor: 'pointer',
}

const thSt: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
}

const tdSt: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid hsl(var(--border))',
}

function statusPill(status: string) {
  if (status === 'Success') return 'pill pill-ok'
  if (status === 'Warning') return 'pill pill-warn'
  return 'pill pill-err'
}

export function AuditLogTab({
  auditSearch,
  setAuditSearch,
  auditFilter,
  setAuditFilter,
  auditResourceFilter,
  setAuditResourceFilter,
  filteredLogs,
  auditSortOrder,
  onAuditSortChange,
  handleExportLogs,
}: AuditLogTabProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  return (
    <div className="panel">
      <div className="ph">
        <span>Audit log</span>
        <button className="btn btn-sm btn-outline" onClick={handleExportLogs}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            download
          </span>
          Export report
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: '12px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 180 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <label htmlFor="input-7ba91a" style={{ display: 'none' }}>
              Search by action or resource…
            </label>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search by action or resource…"
              name="auditSearch"
              id="input-7ba91a"
              placeholder="Search by action or resource…"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                outline: 'none',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                borderRadius: 4,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <SortToggle value={auditSortOrder} onChange={onAuditSortChange} />
        </div>
        <label htmlFor="select-194325" style={{ display: 'none' }}>
          Filter by Status
        </label>
        <select
          name="auditFilter"
          id="select-194325"
          value={auditFilter}
          onChange={(e) => setAuditFilter(e.target.value)}
          style={selSt}
        >
          <option>All Status</option>
          <option>Success</option>
          <option>Warning</option>
          <option>Failure</option>
        </select>
        <label htmlFor="select-265651" style={{ display: 'none' }}>
          Filter by Resource
        </label>
        <select
          name="auditResourceFilter"
          id="select-265651"
          value={auditResourceFilter}
          onChange={(e) => setAuditResourceFilter(e.target.value)}
          style={selSt}
        >
          <option>All Resources</option>
          <option>MEMBERS</option>
          <option>CHAPTERS</option>
          <option>STORE</option>
          <option>SYSTEM</option>
          <option>BLOGS</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Timestamp</th>
              <th style={thSt}>Admin</th>
              <th style={thSt}>Action</th>
              <th style={{ ...thSt, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.slice(0, 15).map((log) => (
                <tr
                  key={log.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedLog(log)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'hsl(var(--container-low))')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td
                    style={{
                      ...tdSt,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td
                    style={{
                      ...tdSt,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {log.adminName.split(' ')[0]}
                  </td>
                  <td
                    style={{
                      ...tdSt,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      fontStyle: 'italic',
                    }}
                  >
                    {log.action.toLowerCase()}
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <span className={statusPill(log.status)}>{log.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontStyle: 'italic',
                  }}
                >
                  No activity logs recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'hsl(var(--card))',
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
              border: '1px solid hsl(var(--border))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top brand accent bar */}
            <div style={{ height: 4, background: 'hsl(var(--primary))' }} />

            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'hsl(var(--container-low))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                  }}
                >
                  Audit Entry Details
                </h3>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '3px 0 0',
                  }}
                >
                  Log ID: {selectedLog.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  close
                </span>
              </button>
            </div>

            {/* Body info */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                    }}
                  >
                    Timestamp
                  </span>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {new Date(selectedLog.timestamp).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </span>
                  <p style={{ margin: '4px 0 0' }}>
                    <span className={statusPill(selectedLog.status)}>{selectedLog.status}</span>
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                    }}
                  >
                    Administrator
                  </span>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {selectedLog.adminName}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                    }}
                  >
                    IP Address
                  </span>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {selectedLog.ipAddress || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                  }}
                >
                  Action
                </span>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface))',
                    fontStyle: 'italic',
                  }}
                >
                  {selectedLog.action}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  paddingTop: 16,
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Activity Payload Details
                </span>

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 ? (
                  <div
                    style={{
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      padding: 12,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {Object.entries(selectedLog.details).map(([key, value]) => (
                          <tr key={key} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <td
                              style={{
                                padding: '6px 0',
                                fontWeight: 600,
                                color: 'hsl(var(--on-surface-muted))',
                                width: '35%',
                                textTransform: 'capitalize',
                              }}
                            >
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td
                              style={{
                                padding: '6px 0',
                                color: 'hsl(var(--on-surface))',
                                wordBreak: 'break-all',
                              }}
                            >
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                      fontStyle: 'italic',
                    }}
                  >
                    No metadata payload associated with this action.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: 'hsl(var(--container-low))',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedLog(null)}
                style={{ height: 38, padding: '0 20px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
