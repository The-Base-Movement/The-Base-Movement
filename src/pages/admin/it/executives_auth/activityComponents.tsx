import type { DeviceActivity } from '@/services/deviceTrackingService'
import { ACTION_PILL, actionLabel, cellStyle, fmt, fmtFull } from './shared'

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

/** Shared activity table used by both the summary and full-activity pages. */
export function ActivityTable({
  rows,
  loading,
  emptyText,
  onView,
}: {
  rows: DeviceActivity[]
  loading: boolean
  emptyText: string
  onView: (entry: DeviceActivity) => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Admin', 'Device', 'Event', 'IP', 'Location', 'When', ''].map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: i === 6 ? 'right' : 'left',
                  padding: '10px 16px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={7}
                style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', textAlign: 'center' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((a) => {
              const pill = ACTION_PILL[a.action] ?? { cls: 'pill-mute', label: a.action }
              return (
                <tr key={a.id}>
                  <td style={cellStyle}>{a.admin_name}</td>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {a.device_type ?? '—'}
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

export function DetailModal({ entry, onClose }: { entry: DeviceActivity; onClose: () => void }) {
  const fingerprint =
    entry.metadata && typeof entry.metadata.fingerprint_hash === 'string'
      ? entry.metadata.fingerprint_hash
      : null
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
        <Row label="Event" value={actionLabel(entry.action)} />
        <Row label="Device type" value={entry.device_type ?? '—'} />
        <Row label="IP address" value={entry.ip_address ?? '—'} />
        <Row label="Location" value={entry.location ?? '—'} />
        <Row label="When" value={fmtFull(entry.created_at)} />
        {fingerprint && <Row label="Fingerprint" value={fingerprint} />}
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
            {entry.user_agent ?? '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
