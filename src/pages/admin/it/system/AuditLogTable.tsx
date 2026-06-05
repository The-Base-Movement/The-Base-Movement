import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SortToggle } from '@/components/ui/SortToggle'
import type { AuditLog, Severity } from './types'
import { SEV, PAGE_SIZE } from './types'

export function AuditLogTable() {
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
          id: l.id as string,
          action: l.action as string,
          user_id: l.user_id as string | null,
          severity: l.severity as Severity,
          details: l.details as Record<string, unknown> | null,
          created_at: l.created_at as string,
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
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div>
      <div className="panel" style={{ overflow: 'hidden', marginBottom: 24 }}>
        {/* Toolbar */}
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
            id="audit-severity"
            name="auditSeverity"
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

        {/* Table */}
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

        {/* Pagination */}
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
    </div>
  )
}
