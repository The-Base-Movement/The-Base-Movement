import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/types/admin'

interface AdminActivityLogProps {
  auditLogs: AuditLogEntry[]
}

function formatResource(resource: string): string {
  if (!resource) return ''
  const parts = resource.split('/')
  if (parts.length === 2) {
    const name = parts[0]
      .split('_')
      .map((word) => {
        if (word.toLowerCase() === 'it') return 'IT'
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')

    let id = parts[1]
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      id = id.substring(0, 8)
    }
    return `${name} (ID: ${id})`
  }
  return resource
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
            <span className="stamp" style={{ minWidth: '120px' }}>
              {new Date(log.timestamp).toLocaleDateString([], {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
              })}
              {', '}
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="body">
              <p>
                <b>{log.adminName.split(' ')[0]}</b> {log.action.toLowerCase().replace('_', ' ')}
              </p>
              <span>{formatResource(log.resource)}</span>
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
