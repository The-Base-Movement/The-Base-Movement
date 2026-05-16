import type { AuditLogEntry } from '@/services/adminService'

interface AuditLogTabProps {
  auditSearch: string
  setAuditSearch: (val: string) => void
  auditFilter: string
  setAuditFilter: (val: string) => void
  auditResourceFilter: string
  setAuditResourceFilter: (val: string) => void
  filteredLogs: AuditLogEntry[]
  handleExportLogs: () => void
}

const selSt: React.CSSProperties = {
  height: 36, padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  background: '#fff', outline: 'none',
  fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12,
  borderRadius: 4, cursor: 'pointer',
}

const thSt: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
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
  auditSearch, setAuditSearch, auditFilter, setAuditFilter,
  auditResourceFilter, setAuditResourceFilter, filteredLogs, handleExportLogs
}: AuditLogTabProps) {
  return (
    <div className="panel">
      <div className="ph">
        <span>Audit log</span>
        <button className="btn btn-sm btn-outline" onClick={handleExportLogs}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
          Export report
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
          <input aria-label="Search by action or resource…" name="auditSearch" id="input-7ba91a"
            placeholder="Search by action or resource…"
            value={auditSearch}
            onChange={e => setAuditSearch(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: '#fff', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, boxSizing: 'border-box' }}
          />
        </div>
        <select name="auditFilter" id="select-194325" value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={selSt}>
          <option>All Status</option>
          <option>Success</option>
          <option>Warning</option>
          <option>Failure</option>
        </select>
        <select name="auditResourceFilter" id="select-265651" value={auditResourceFilter} onChange={e => setAuditResourceFilter(e.target.value)} style={selSt}>
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
            {filteredLogs.length > 0 ? filteredLogs.slice(0, 15).map(log => (
              <tr key={log.id}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <td style={{ ...tdSt, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                  {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={{ ...tdSt, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                  {log.adminName.split(' ')[0]}
                </td>
                <td style={{ ...tdSt, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>
                  {log.action.toLowerCase()}
                </td>
                <td style={{ ...tdSt, textAlign: 'right' }}>
                  <span className={statusPill(log.status)}>{log.status}</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>
                  No activity logs recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
