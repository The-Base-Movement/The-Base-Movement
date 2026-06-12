import type { License, Category, LicenseStatus } from './types'
import { CATEGORIES, daysUntilRenewal, fmtCost, fmtDate } from './types'

interface LicenseTableProps {
  filteredLicenses: License[]
  loading: boolean
  statusFilter: LicenseStatus | 'All'
  setStatusFilter: (s: LicenseStatus | 'All') => void
  categoryFilter: Category | 'All'
  setCategoryFilter: (c: Category | 'All') => void
  onAdd: () => void
  onEdit: (l: License) => void
  onCancel: (l: License) => void
  onDelete: (l: License) => void
}

export function LicenseTable({
  filteredLicenses,
  loading,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onAdd,
  onEdit,
  onCancel,
  onDelete,
}: LicenseTableProps) {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Filters + Add button */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: 'hsl(var(--container-low))',
        }}
      >
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(['All', 'Active', 'Inactive', 'Cancelled'] as const).map((s) => (
            <button
              key={s}
              className={statusFilter === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
            style={{
              height: 30,
              padding: '0 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif",
              background: 'hsl(var(--background))',
              color: 'hsl(var(--on-surface))',
            }}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            add
          </span>
          Add License
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p
          style={{
            padding: 20,
            margin: 0,
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Loading…
        </p>
      ) : filteredLicenses.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          No licenses found.
          {statusFilter === 'All' && categoryFilter === 'All'
            ? ' Add one to get started.'
            : ' Try adjusting the filters.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'hsl(var(--container-low))' }}>
                {['Software', 'Category', 'Cost', 'Renewal Date', 'Auto-renew', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'hsl(var(--on-surface-muted))',
                        borderBottom: '1px solid hsl(var(--border))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((l) => {
                const days = l.status === 'Active' ? daysUntilRenewal(l.renewal_date) : Infinity
                const isUrgent = days <= 7
                const isWarning = days <= 30
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div
                        style={{
                          margin: 0,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {l.software_name}
                        {l.url && (
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginLeft: 6,
                              color: 'hsl(var(--primary))',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              open_in_new
                            </span>
                          </a>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {l.vendor}
                      </p>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="pill pill-mute" style={{ fontSize: 10 }}>
                        {l.category}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        whiteSpace: 'nowrap',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {fmtCost(l.cost, l.billing_cycle)}
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            color: isWarning ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {isWarning && (
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 13, marginRight: 3 }}
                            >
                              warning
                            </span>
                          )}
                          {fmtDate(l.renewal_date)}
                        </span>
                        {isUrgent && (
                          <span className="pill pill-err" style={{ fontSize: 9 }}>
                            Expires soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 16,
                          color: l.auto_renew ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        }}
                      >
                        {l.auto_renew ? 'check_circle' : 'cancel'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        className={
                          l.status === 'Active'
                            ? 'pill pill-ok'
                            : l.status === 'Inactive'
                              ? 'pill pill-mute'
                              : 'pill pill-err'
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Edit"
                          onClick={() => onEdit(l)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            edit
                          </span>
                        </button>
                        <button
                          className={
                            l.status === 'Cancelled'
                              ? 'btn btn-dest btn-sm'
                              : 'btn btn-outline-dest btn-sm'
                          }
                          title={l.status === 'Cancelled' ? 'Permanently delete' : 'Cancel license'}
                          onClick={() => (l.status === 'Cancelled' ? onDelete(l) : onCancel(l))}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            {l.status === 'Cancelled' ? 'delete_forever' : 'cancel'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
