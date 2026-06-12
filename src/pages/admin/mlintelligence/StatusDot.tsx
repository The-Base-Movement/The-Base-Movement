import type { MLHealthStatus } from '@/services/mlService'

export default function StatusDot({ status }: { status: MLHealthStatus | null }) {
  if (!status) {
    return (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'hsl(var(--on-surface-muted))',
          display: 'inline-block',
        }}
      />
    )
  }

  const ok = status.status === 'ok' && status.database === 'connected'

  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: ok ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
        display: 'inline-block',
      }}
    />
  )
}
