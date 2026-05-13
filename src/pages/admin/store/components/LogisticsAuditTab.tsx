import type { LogisticsAuditEntry } from '@/services/adminService'
import type { toast as toastType } from 'sonner'

interface LogisticsAuditTabProps {
  auditLogs: LogisticsAuditEntry[]
  toast: typeof toastType
}

function actionPill(action: string) {
  if (action === 'DISPATCHED')          return 'pill pill-mute'
  if (action === 'REPLENISHED')         return 'pill pill-ok'
  if (action === 'RESTOCKED_CANCELLED') return 'pill pill-warn'
  return 'pill pill-mute'
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left' as const,
  whiteSpace: 'nowrap' as const,
}

export function LogisticsAuditTab({ auditLogs, toast }: LogisticsAuditTabProps) {
  const handleExport = () => {
    try {
      const headers = ['Timestamp', 'Action', 'Resource', 'Quantity Change', 'Source', 'Destination']
      const csvData = auditLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        `"${log.productName || 'Unknown'}"`,
        log.quantityChange,
        `"${log.sourceLocation}"`,
        `"${log.destinationLocation || 'Internal'}"`
      ])
      const csvContent = [headers.join(','), ...csvData.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Exported ${auditLogs.length} audit records.`)
    } catch {
      toast.error('Failed to export audit log.')
    }
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Audit log</h3>
        <button
          className="btn btn-outline btn-sm"
          disabled={auditLogs.length === 0}
          onClick={handleExport}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
          Export
        </button>
      </div>

      {auditLogs.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>history</span>
          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No audit entries recorded.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Timestamp', 'Action', 'Resource', 'Change', 'Location'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={actionPill(log.action)} style={{ fontSize: 9.5 }}>{log.action.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>
                      {log.productName || 'Unknown asset'}
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: log.quantityChange > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>place</span>
                        {log.sourceLocation}
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                        {log.destinationLocation || 'Internal'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only">
            {auditLogs.map(log => (
              <div key={log.id} style={{ padding: '13px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                {/* Row 1: timestamp + action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <span className={actionPill(log.action)} style={{ fontSize: 9.5, flexShrink: 0 }}>{log.action.replace(/_/g, ' ')}</span>
                </div>
                {/* Row 2: product + qty change */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>{log.productName || 'Unknown asset'}</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: log.quantityChange > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                    {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                  </span>
                </div>
                {/* Row 3: location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>place</span>
                  {log.sourceLocation}
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                  {log.destinationLocation || 'Internal'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
