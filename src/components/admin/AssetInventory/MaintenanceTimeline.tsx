import type { MaintenanceLog, AssetCondition } from './types'

const CONDITION_PILL: Record<AssetCondition, string> = {
  good: 'pill pill-ok',
  fair: 'pill pill-warn',
  damaged: 'pill pill-err',
}

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

interface Props {
  logs: MaintenanceLog[]
}

export function MaintenanceTimeline({ logs }: Props) {
  if (!logs.length) {
    return (
      <div
        style={{
          padding: '32px 0',
          textAlign: 'center',
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 13,
        }}
      >
        No maintenance records yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {logs.map((log, i) => (
        <div
          key={log.id}
          style={{ display: 'flex', gap: 14, paddingBottom: i < logs.length - 1 ? 20 : 0 }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'hsl(var(--primary))',
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            {i < logs.length - 1 && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  background: 'hsl(var(--border))',
                  marginTop: 4,
                }}
              />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                {new Date(log.created_at).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className={CONDITION_PILL[log.condition_after]}>
                {CONDITION_LABEL[log.condition_after]}
              </span>
            </div>
            <p style={{ margin: '0 0 3px', fontSize: 13, color: 'hsl(var(--on-surface))' }}>
              {log.note}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Logged by {log.logged_by_name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
