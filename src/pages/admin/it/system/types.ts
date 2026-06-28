export type Severity = 'info' | 'warning' | 'critical'

export interface AuditLog {
  id: string
  action: string
  user_id: string | null
  severity: Severity
  details: Record<string, unknown> | null
  created_at: string
  user_name: string
}

export interface DbStats {
  db_size_bytes: number
  public_table_size_bytes: number
  public_index_size_bytes: number
  storage_size_bytes: number
  active_connections: number
  cache_hit_ratio: number | null
}

export const PAGE_SIZE = 25

export const SEV: Record<Severity, { pill: string; row: string; label: string; icon: string }> = {
  info: { pill: 'pill pill-mute', row: 'transparent', label: 'Info', icon: 'info' },
  warning: {
    pill: 'pill pill-warn',
    row: 'hsl(var(--accent) / 0.06)',
    label: 'Warning',
    icon: 'warning',
  },
  critical: {
    pill: 'pill pill-err',
    row: 'hsl(var(--destructive) / 0.07)',
    label: 'Critical',
    icon: 'error',
  },
}
