import { type AuditLogEntry } from '@/services/adminService'

interface AuditModalProps {
  isOpen: boolean
  memberName: string | null
  logs: AuditLogEntry[] | null
  onClose: () => void
}

export function AuditModal({ isOpen, memberName, logs, onClose }: AuditModalProps) {
  if (!isOpen) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.55)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '24px 28px',
            borderTop: '4px solid hsl(var(--destructive))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: 'rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
              >
                lock
              </span>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                Audit history
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                Full chain of custody for {memberName}
              </p>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {!logs || logs.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 36,
                  color: 'hsl(var(--border))',
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                history
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                }}
              >
                No audit records found for this resource.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          background: 'hsl(var(--container-low))',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                        >
                          description
                        </span>
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10.5,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        <h4
                          style={{
                            margin: '4px 0 2px',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {log.action}
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11.5,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          Processed by: {log.adminName}
                        </p>
                        {log.details && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: '8px 12px',
                              background: 'hsl(var(--container-low))',
                              borderLeft: '2px solid hsl(var(--border))',
                              fontSize: 11,
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: 10,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        borderRadius: 99,
                        background:
                          log.status === 'Success' ? 'rgba(0,107,63,.1)' : 'rgba(218,165,32,.1)',
                        color: log.status === 'Success' ? 'hsl(var(--primary))' : '#a87d10',
                        border:
                          log.status === 'Success'
                            ? '1px solid rgba(0,107,63,.2)'
                            : '1px solid rgba(218,165,32,.2)',
                        flexShrink: 0,
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-outline" onClick={onClose}>
            Close history
          </button>
        </div>
      </div>
    </div>
  )
}
