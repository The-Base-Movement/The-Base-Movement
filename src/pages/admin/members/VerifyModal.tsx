import { createPortal } from 'react-dom'
import { type Member } from '@/services/adminService'

interface VerifyModalProps {
  isOpen: boolean
  members: Member[]
  isVerifying: boolean
  onConfirm: () => void
  onClose: () => void
}

export function VerifyModal({
  isOpen,
  members,
  isVerifying,
  onConfirm,
  onClose,
}: VerifyModalProps) {
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
        if (e.target === e.currentTarget && !isVerifying) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg,#003b22,#005c36)',
            padding: '28px 28px 24px',
            borderTop: '4px solid hsl(var(--primary))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 120, color: '#fff' }}>
              verified_user
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 4,
                background: 'rgba(255,255,255,.15)',
                border: '1px solid rgba(255,255,255,.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fff' }}>
                how_to_reg
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Administrative Approval
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 20,
                  color: '#fff',
                  letterSpacing: '-.01em',
                }}
              >
                Verify {members.length} member{members.length !== 1 ? 's' : ''}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {members.slice(0, 4).map((m, i, arr) => (
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
                        fontWeight: 'var(--font-weight-semibold, 600)',
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
                      fontWeight: 'var(--font-weight-semibold, 600)',
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
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {m.id.substring(0, 12)}
                  </span>
                </div>
              </div>
            ))}
            {members.length > 4 && (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(0,107,63,.04)',
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  + {members.length - 4} more record{members.length - 4 !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 14px',
              background: 'rgba(0,107,63,.05)',
              border: '1px solid rgba(0,107,63,.18)',
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
                color: 'hsl(var(--primary))',
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              security
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
              }}
            >
              By verifying {members.length === 1 ? 'this member' : 'these members'}, you are
              authorizing their official admission into the movement database. They will gain access
              to member-only platforms and communication channels.
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
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={onConfirm}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}
                >
                  refresh
                </span>
                Verifying…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  check_circle
                </span>
                Authorize
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
