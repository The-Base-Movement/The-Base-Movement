import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/types/admin'

interface AdminActivityLogProps {
  auditLogs: AuditLogEntry[]
}

export function AdminActivityLog({ auditLogs }: AdminActivityLogProps) {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Recent admin activity</h3>
        <span className="meta">Last 24h</span>
      </div>
      <div className="log">
        {auditLogs.slice(0, 4).map((log) => (
          <div key={log.id} className="log-row">
            <span className="stamp">
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="body">
              <p>
                <b>{log.adminName.split(' ')[0]}</b> {log.action.toLowerCase().replace('_', ' ')}
              </p>
              <span>{log.resource}</span>
            </div>
            <span
              className={cn(
                'tag',
                log.action.includes('CREATE')
                  ? 'create'
                  : log.action.includes('DELETE')
                    ? 'delete'
                    : 'edit'
              )}
            >
              {log.action.split('_')[0]}
            </span>
          </div>
        ))}
        {auditLogs.length === 0 && (
          <div
            style={{
              padding: '32px 0',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12,
              fontStyle: 'italic',
            }}
          >
            No recent mobilization telemetry.
          </div>
        )}
      </div>
    </div>
  )
}
export default AdminActivityLog
