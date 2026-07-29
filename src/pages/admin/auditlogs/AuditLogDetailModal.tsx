import { useState } from 'react'
import { type AuditLogEntry } from '@/services/adminService'

interface AuditLogDetailModalProps {
  log: AuditLogEntry
  onClose: () => void
}

function JsonTree({ data, level = 0 }: { data: unknown; level?: number }) {
  const [expanded, setExpanded] = useState(level === 0)

  if (data === null || data === undefined) {
    return <span style={{ color: 'hsl(var(--on-surface-muted))' }}>null</span>
  }

  if (typeof data === 'string') {
    return <span style={{ color: '#0a7e3e' }}>"{data}"</span>
  }

  if (typeof data === 'number') {
    return <span style={{ color: '#d8860b' }}>{data}</span>
  }

  if (typeof data === 'boolean') {
    return <span style={{ color: '#ce1126' }}>{String(data)}</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span>[]</span>
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'hsl(var(--on-surface))',
            fontSize: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }}
          >
            {expanded ? 'expand_more' : 'chevron_right'}
          </span>
          Array[{data.length}]
        </button>
        {expanded && (
          <div style={{ marginLeft: 20, marginTop: 4 }}>
            {data.map((item, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: 'hsl(var(--on-surface-muted))' }}>[{i}]:</span>{' '}
                <JsonTree data={item} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data)
    if (entries.length === 0) {
      return <span>{'{}'}</span>
    }

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'hsl(var(--on-surface))',
            fontSize: 12,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }}
          >
            {expanded ? 'expand_more' : 'chevron_right'}
          </span>
          Object {'{'}
          {entries.length}
          {'}'}
        </button>
        {expanded && (
          <div style={{ marginLeft: 20, marginTop: 4 }}>
            {entries.map(([key, value]) => (
              <div key={key} style={{ marginBottom: 4 }}>
                <span style={{ color: '#1e90ff' }}>"{key}"</span>
                <span style={{ color: 'hsl(var(--on-surface-muted))' }}>:</span>{' '}
                <JsonTree data={value} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span>{String(data)}</span>
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: 'hsl(var(--on-surface))' }}>
            Audit Log Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 20,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Basic Info Grid */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}
          >
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Timestamp
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Admin
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                {log.adminName}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Action
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                {log.action}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Status
              </p>
              <span
                className={`pill ${
                  log.status === 'Success'
                    ? 'pill-ok'
                    : log.status === 'Failure'
                      ? 'pill-err'
                      : log.status === 'Warning'
                        ? 'pill-warn'
                        : 'pill-mute'
                }`}
              >
                {log.status}
              </span>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Resource
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                {log.resource}
              </p>
            </div>

            {log.ipAddress && log.ipAddress !== 'N/A' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  IP Address
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                  {log.ipAddress}
                </p>
              </div>
            )}

            {log.targetName && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Target
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                  {log.targetName}
                </p>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Metadata
              </p>
              <div
                style={{
                  background: 'hsl(var(--container-low))',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontFamily: "'Courier New', monospace",
                  color: 'hsl(var(--on-surface))',
                  overflow: 'auto',
                  maxHeight: 300,
                }}
              >
                <JsonTree data={log.details} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            textAlign: 'right',
          }}
        >
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
