import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { SortToggle } from '@/components/ui/SortToggle'

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = 'info' | 'warning' | 'critical'

interface AuditLog {
  id: string
  action: string
  user_id: string | null
  severity: Severity
  details: Record<string, unknown> | null
  created_at: string
  user_name: string
}

interface DbStats {
  db_size_bytes: number
  active_connections: number
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25

const SEV: Record<Severity, { pill: string; row: string; label: string; icon: string }> = {
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

// ─── HealthCard ───────────────────────────────────────────────────────────────

function HealthCard({
  label,
  icon,
  value,
  pct,
  bar,
  status,
  statusColor,
  loading,
}: {
  label: string
  icon: string
  value: string
  pct: number
  bar: string
  status: string
  statusColor: string
  loading: boolean
}) {
  return (
    <div
      className="panel"
      style={{ padding: '16px 18px 18px 22px', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          {label}
        </p>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: bar, opacity: 0.55 }}
        >
          {icon}
        </span>
      </div>
      <p
        style={{
          fontSize: 'var(--kpi-num-size)',
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          margin: '0 0 12px',
        }}
      >
        {loading ? '—' : value}
      </p>
      <div
        style={{
          height: 4,
          background: 'hsl(var(--border))',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${loading ? 0 : pct}%`,
            background: bar,
            borderRadius: 'var(--radius-pill)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: loading ? 'hsl(var(--border))' : statusColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Public Sans', sans-serif",
            color: loading ? 'hsl(var(--on-surface-muted))' : statusColor,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {loading ? 'Checking…' : status}
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITSystem() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentLabel('System Monitor')
  }, [setCurrentLabel])

  useITLayout('System Monitor', 'shield', 'Security event log and live system health indicators.')

  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    async function loadHealth() {
      try {
        const { data } = await supabase.rpc('get_db_stats')
        if (data) setDbStats(data as DbStats)
      } finally {
        setHealthLoading(false)
      }
    }
    loadHealth()
  }, [])

  const dbSizeMB = (dbStats?.db_size_bytes ?? 0) / 1024 / 1024
  const dbLimitMB = 500
  const dbPct = Math.min(100, (dbSizeMB / dbLimitMB) * 100)
  const conns = dbStats?.active_connections ?? 0
  const connPct = Math.min(100, (conns / 100) * 100)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sevFilter, setSevFilter] = useState<Severity | 'all'>('all')
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const { data } = await supabase
        .from('system_audit_logs')
        .select('*, user:users!user_id(full_name)')
        .order('created_at', { ascending: sortDir === 'asc' })
        .limit(500)
      setLogs(
        (data ?? []).map((l: Record<string, unknown>) => ({
          ...(l as Omit<AuditLog, 'user_name'>),
          user_name: (l.user as { full_name: string } | null)?.full_name ?? 'System',
        }))
      )
    } finally {
      setLogsLoading(false)
    }
  }, [sortDir])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    setPage(1)
  }, [search, sevFilter])

  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase())
    const matchSev = sevFilter === 'all' || l.severity === sevFilter
    return matchSearch && matchSev
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const dbBar =
    dbPct > 80
      ? 'hsl(var(--destructive))'
      : dbPct > 60
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const dbStatus = dbPct > 80 ? 'High Usage' : dbPct > 60 ? 'Moderate' : 'Healthy'
  const connBar =
    conns > 80
      ? 'hsl(var(--destructive))'
      : conns > 50
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const connStatus = conns > 80 ? 'High Load' : conns > 50 ? 'Elevated' : 'Normal'

  const inputSt: React.CSSProperties = {
    height: 34,
    padding: '0 10px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 12,
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  return (
    <div>
      {/* ── System Health ──────────────────────────────────────────────────── */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
        <HealthCard
          label="API Uptime"
          icon="cloud_done"
          value="99.9%"
          pct={99.9}
          bar="hsl(var(--primary))"
          status="Operational"
          statusColor="hsl(var(--primary))"
          loading={false}
        />
        <HealthCard
          label="Database Storage"
          icon="storage"
          value={healthLoading ? '—' : `${dbSizeMB.toFixed(1)} MB / ${dbLimitMB} MB`}
          pct={dbPct}
          bar={dbBar}
          status={dbStatus}
          statusColor={dbBar}
          loading={healthLoading}
        />
        <HealthCard
          label="Active Connections"
          icon="hub"
          value={healthLoading ? '—' : `${conns} active`}
          pct={connPct}
          bar={connBar}
          status={connStatus}
          statusColor={connBar}
          loading={healthLoading}
        />
      </div>

      {/* ── Audit Log ──────────────────────────────────────────────────────── */}
      <div className="panel" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'hsl(var(--container-low))',
          }}
        >
          <input
            id="audit-search"
            name="auditSearch"
            type="text"
            placeholder="Search action or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputSt, flex: 1, minWidth: 160 }}
          />
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value as Severity | 'all')}
            style={inputSt}
          >
            <option value="all">All severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <SortToggle value={sortDir} onChange={setSortDir} label="Date" />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Timestamp', 'Action', 'User', 'Severity'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {[70, 55, 40, 25].map((w, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            height: 11,
                            background: 'hsl(var(--container-low))',
                            borderRadius: 'var(--radius-xs)',
                            width: `${w}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '60px 16px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {search || sevFilter !== 'all'
                      ? 'No matching events.'
                      : 'No audit events recorded yet.'}
                  </td>
                </tr>
              ) : (
                pageLogs.map((log) => {
                  const sev = SEV[log.severity]
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        background: sev.row,
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {log.action}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {log.user_name}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={sev.pill}>{sev.label}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!logsLoading && filtered.length > PAGE_SIZE && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'hsl(var(--container-low))',
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {filtered.length} events · Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_left
                </span>
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cross-link ─────────────────────────────────────────────────────── */}
      {!isMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Link
            to="/admin/settings?tab=audit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            View admin activity log
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              arrow_forward
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
