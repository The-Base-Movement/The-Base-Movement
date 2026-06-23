import { createPortal } from 'react-dom'
import { DotLoader } from '@/components/states'
import { motion } from 'framer-motion'
import type { AuditLogEntry } from '@/types/admin'

interface AuditLogsModalProps {
  onClose: () => void
  activeAdminName: string
  isLogsLoading: boolean
  selectedAdminLogs: AuditLogEntry[]
}

export function AuditLogsModal({
  onClose,
  activeAdminName,
  isLogsLoading,
  selectedAdminLogs,
}: AuditLogsModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          background: 'hsl(var(--card))',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'hsl(var(--container-low))',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Administrative Audit Vault
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              Activity logs for {activeAdminName}
            </p>
          </div>
          <button
            aria-label="Close activity logs"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
          {isLogsLoading ? (
            <DotLoader
              label="Decrypting audit stream..."
              style={{ padding: '40px 0', justifyContent: 'center' }}
            />
          ) : selectedAdminLogs.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 48, color: 'hsl(var(--border))', marginBottom: 16 }}
              >
                history
              </span>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No recorded activity in the current epoch.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedAdminLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: 16,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        color: 'hsl(var(--primary))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {log.action}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    Resource:{' '}
                    <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{log.resource}</span>
                  </p>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background:
                          log.status === 'Success'
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--destructive))',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        color:
                          log.status === 'Success'
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--destructive))',
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
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onClose} className="btn btn-sm btn-outline" style={{ width: '100%' }}>
            Close Vault
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
export default AuditLogsModal
