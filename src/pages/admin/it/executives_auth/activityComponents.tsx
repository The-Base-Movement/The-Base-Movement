import type { LeaderActivityRow } from '@/services/leaderActivityService'
import {
  ACTION_PILL,
  actionLabel,
  cellStyle,
  fmt,
  fmtFull,
  prettifyAction,
  resourceType,
  sourceLabel,
  statusPill,
} from './shared'

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '3px 0',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
      <span style={{ color: 'hsl(var(--on-surface))', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  )
}

// Rows without a `source` (device-only summary page) are treated as device events.
function isAction(row: LeaderActivityRow): boolean {
  return row.source === 'action'
}

function eventText(row: LeaderActivityRow): string {
  return isAction(row) ? prettifyAction(row.action) : actionLabel(row.action)
}

function targetText(row: LeaderActivityRow): string {
  return isAction(row) ? resourceType(row.resource) : (row.device_type ?? '—')
}

function rowPill(row: LeaderActivityRow): { cls: string; label: string } {
  if (isAction(row)) return statusPill(row.status)
  return ACTION_PILL[row.action] ?? { cls: 'pill-mute', label: row.action }
}

/** Shared activity table used by both the summary and full-activity pages. */
export function ActivityTable({
  rows,
  loading,
  emptyText,
  onView,
  maxHeight,
}: {
  rows: LeaderActivityRow[]
  loading: boolean
  emptyText: string
  onView: (entry: LeaderActivityRow) => void
  /** When set, the table body scrolls internally past this height (header sticks). */
  maxHeight?: number | string
}) {
  return (
    <div style={{ overflowX: 'auto', overflowY: maxHeight ? 'auto' : undefined, maxHeight }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Leader', 'Type', 'Event', 'Target', 'Status', 'IP', 'Location', 'When', ''].map(
              (h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: i === 8 ? 'right' : 'left',
                    padding: '10px 16px',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface-muted))',
                    borderBottom: '1px solid hsl(var(--border))',
                    whiteSpace: 'nowrap',
                    // Keep the header visible while the body scrolls.
                    position: maxHeight ? 'sticky' : undefined,
                    top: maxHeight ? 0 : undefined,
                    background: 'hsl(var(--card))',
                    zIndex: 1,
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={9}
                style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', textAlign: 'center' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((a) => {
              const pill = rowPill(a)
              return (
                <tr key={`${a.source ?? 'device'}-${a.id}`}>
                  <td style={cellStyle}>{a.admin_name}</td>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {sourceLabel(a.source)}
                  </td>
                  <td style={cellStyle}>{eventText(a)}</td>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {targetText(a)}
                  </td>
                  <td style={cellStyle}>
                    <span className={`pill ${pill.cls}`}>{pill.label}</span>
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      fontFamily: 'monospace',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {a.ip_address ?? '—'}
                  </td>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {a.location ?? '—'}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      whiteSpace: 'nowrap',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {fmt(a.created_at)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onView(a)}
                      style={{ padding: '4px 10px' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export function DetailModal({ entry, onClose }: { entry: LeaderActivityRow; onClose: () => void }) {
  const fingerprint =
    entry.metadata && typeof entry.metadata.fingerprint_hash === 'string'
      ? entry.metadata.fingerprint_hash
      : null
  const action = isAction(entry)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Public Sans', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          width: 'min(460px, 92vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Activity detail
          </h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <Row label="Leader" value={entry.admin_name} />
        {entry.role && <Row label="Role" value={prettifyAction(entry.role)} />}
        <Row label="Type" value={action ? 'In-app action' : 'Device / auth event'} />
        <Row
          label="Event"
          value={action ? prettifyAction(entry.action) : actionLabel(entry.action)}
        />
        {action ? (
          <>
            {entry.resource && <Row label="Target" value={entry.resource} />}
            {entry.status && <Row label="Status" value={entry.status} />}
          </>
        ) : (
          <Row label="Device type" value={entry.device_type ?? '—'} />
        )}
        <Row label="IP address" value={entry.ip_address ?? '—'} />
        <Row label="Location" value={entry.location ?? '—'} />
        {entry.isp && <Row label="ISP" value={entry.isp} />}
        <Row label="When" value={fmtFull(entry.created_at)} />
        {fingerprint && <Row label="Fingerprint" value={fingerprint} />}
        {entry.metadata && typeof entry.metadata.browser === 'string' && (
          <Row label="Attempted browser" value={entry.metadata.browser} />
        )}
        {entry.metadata && typeof entry.metadata.os_type === 'string' && (
          <Row label="Attempted OS" value={entry.metadata.os_type} />
        )}
        {entry.user_agent && (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              User agent
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                wordBreak: 'break-all',
                background: 'hsl(var(--container-low))',
                padding: 10,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {entry.user_agent}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
