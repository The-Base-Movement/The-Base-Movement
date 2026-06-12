import { createPortal } from 'react-dom'

interface AppointedLeader {
  id: string
  chapter_name: string
  leader_name: string
  leader_id: string | null
  avatar_url: string | null
  registration_number: string | null
  phone_number: string | null
  status: string | null
  platform: string | null
  region: string | null
  constituency: string | null
  country: string | null
  profession: string | null
}

interface LeaderProfileModalProps {
  viewLeader: AppointedLeader | null
  onClose: () => void
}

export function LeaderProfileModal({ viewLeader, onClose }: LeaderProfileModalProps) {
  if (!viewLeader) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'hsl(var(--surface))',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 20px',
            background: 'hsl(var(--container-low))',
            borderTop: '4px solid hsl(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Officer profile
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 6,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                flexShrink: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 22,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {viewLeader.avatar_url ? (
                <img
                  src={viewLeader.avatar_url}
                  alt={viewLeader.leader_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                viewLeader.leader_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
              )}
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 17,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {viewLeader.leader_name}
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {viewLeader.profession || 'Chapter Officer'}
              </p>
              <span
                className={`pill ${viewLeader.status === 'Active' || viewLeader.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`}
                style={{ marginTop: 6, display: 'inline-block' }}
              >
                {viewLeader.status || 'Member'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                icon: 'badge',
                label: 'Registration ID',
                value: viewLeader.registration_number,
              },
              { icon: 'apartment', label: 'Chapter', value: viewLeader.chapter_name },
              { icon: 'phone', label: 'Phone', value: viewLeader.phone_number },
              {
                icon: 'public',
                label: 'Network',
                value:
                  viewLeader.platform === 'GHANA'
                    ? 'Ghana Network'
                    : viewLeader.platform === 'DIASPORA'
                      ? 'Diaspora Network'
                      : viewLeader.platform,
              },
              {
                icon: 'location_on',
                label: 'Location',
                value:
                  viewLeader.platform === 'GHANA'
                    ? [viewLeader.constituency, viewLeader.region].filter(Boolean).join(', ')
                    : viewLeader.country,
              },
            ].map((row) =>
              row.value ? (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'hsl(var(--primary))', flexShrink: 0 }}
                  >
                    {row.icon}
                  </span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {row.label}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {row.value}
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
