import { format } from 'date-fns'
import type { LogisticsAuditEntry } from '@/types/admin'

interface LogisticsAuditVaultProps {
  auditLogs: LogisticsAuditEntry[]
}

const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
}

const auditActionStyle = (action: string): React.CSSProperties => {
  if (action === 'REPLENISHED')
    return {
      background: 'rgba(34,197,94,0.1)',
      color: 'hsl(var(--primary))',
      border: '1px solid rgba(34,197,94,0.2)',
    }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}

export function LogisticsAuditVault({ auditLogs }: LogisticsAuditVaultProps) {
  return (
    <div className="panel" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              history
            </span>
            Supply chain audit vault
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
            Immutable ledger of replenishment and stock adjustment events
          </div>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
        >
          verified_user
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Change</th>
              <th>Source hub</th>
              <th style={{ textAlign: 'right' }}>Authorized</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
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
                  No audit entries detected in the ledger.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id}>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                  </td>
                  <td>
                    <span style={{ ...pillBase, ...auditActionStyle(log.action) }}>
                      {log.action}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    +{log.quantityChange} units
                  </td>
                  <td
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {log.sourceLocation}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 6,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, color: 'hsl(var(--primary))', opacity: 0.5 }}
                      >
                        verified_user
                      </span>
                      {log.performedBy}
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
