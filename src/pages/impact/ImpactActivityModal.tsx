import type { DonationDetail } from '@/types/admin'

interface Props {
  allActivity: DonationDetail[]
  onClose: () => void
}

export function ImpactActivityModal({ allActivity, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          width: '100%',
          maxWidth: 600,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'hsl(var(--container-low))',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Full Activity Log
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Verified movement contributions
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>
        <div
          style={{
            padding: 20,
            maxHeight: '60vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {allActivity.length > 0 ? (
            allActivity.slice(0, 50).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      background: 'rgba(0,107,63,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {item.fullName[0]}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {item.fullName}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {item.country} · {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    ₵{item.amount}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Verified
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--on-surface-muted))',
                  opacity: 0.3,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                analytics
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No activity recorded yet
              </p>
            </div>
          )}
        </div>
        <div
          style={{
            padding: '12px 20px',
            background: 'hsl(var(--container-low))',
            borderTop: '1px solid hsl(var(--border))',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontStyle: 'italic',
            }}
          >
            Updated in real-time · Showing latest 50 records
          </span>
        </div>
      </div>
    </div>
  )
}
