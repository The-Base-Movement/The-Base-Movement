import { createPortal } from 'react-dom'
import { type Member } from '@/services/adminService'

interface DeleteModalProps {
  isOpen: boolean
  selectedIds: Set<string>
  members: Member[]
  isDeleting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeleteModal({
  isOpen,
  selectedIds,
  members,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteModalProps) {
  if (!isOpen) return null
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.65)',
        backdropFilter: 'blur(6px)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Dark header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '28px 28px 24px',
            borderTop: '4px solid hsl(var(--destructive))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 120 }}>
              delete_forever
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 4,
                background: 'rgba(206,17,38,.18)',
                border: '1px solid rgba(206,17,38,.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: 'hsl(var(--destructive))' }}
              >
                warning
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  color: 'hsl(var(--destructive))',
                  marginBottom: 4,
                }}
              >
                Irreversible action
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: '#fff',
                  letterSpacing: '-.01em',
                }}
              >
                Remove {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Member list preview */}
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {members
              .filter((m) => selectedIds.has(m.id))
              .slice(0, 4)
              .map((m, i, arr) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'hsl(var(--border))',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 12.5,
                        color: 'hsl(var(--on-surface))',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.name}
                    </p>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface-muted))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {m.id.substring(0, 12)}
                    </span>
                  </div>
                </div>
              ))}
            {selectedIds.size > 4 && (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(206,17,38,.04)',
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  + {selectedIds.size - 4} more record{selectedIds.size - 4 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Warning text */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              background: 'rgba(206,17,38,.05)',
              border: '1px solid rgba(206,17,38,.18)',
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
                color: 'hsl(var(--destructive))',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              info
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              These records will be <strong>permanently erased</strong> from the movement database.
              Authentication credentials, activity history, and all associated data will be
              destroyed. This action <strong>cannot be undone</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-dest"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}
                >
                  refresh
                </span>
                Removing…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  delete_forever
                </span>
                Confirm removal
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
