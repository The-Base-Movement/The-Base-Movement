import type { Member } from '@/types/admin'

interface LeaderProfileModalProps {
  leaderProfile: Member
  locationName: string
  locationRegion: string
  leaderTitle?: string
  onClose: () => void
}

export function LeaderProfileModal({
  leaderProfile,
  locationName,
  locationRegion,
  leaderTitle = 'Chapter Leader',
  onClose,
}: LeaderProfileModalProps) {
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
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid hsl(var(--border))',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div
          style={{
            height: 80,
            background: 'hsl(var(--container-low))',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: -24,
              left: 24,
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-xs)',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            {leaderProfile.avatarUrl ? (
              <img
                src={leaderProfile.avatarUrl}
                alt={leaderProfile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'hsl(var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 20,
                }}
              >
                {leaderProfile.name?.[0] || 'L'}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-xs)',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '36px 24px 24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 18,
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 3px',
                }}
              >
                {leaderProfile.name}
              </h2>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {leaderProfile.profession || leaderTitle}
              </div>
            </div>
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 'var(--radius-xs)',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                background: 'hsla(var(--primary), 0.1)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsla(var(--primary), 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {leaderTitle}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px 16px',
              marginBottom: 20,
            }}
          >
            {[
              {
                icon: 'public',
                label: 'Network',
                value: leaderProfile.platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network',
              },
              {
                icon: 'location_on',
                label: 'Location',
                value:
                  leaderProfile.platform === 'GHANA' ? leaderProfile.region : leaderProfile.country,
              },
              { icon: 'work', label: 'Profession', value: leaderProfile.profession },
              ...(leaderProfile.platform === 'GHANA' && leaderProfile.constituency
                ? [
                    {
                      icon: 'how_to_reg',
                      label: 'Constituency',
                      value: leaderProfile.constituency,
                    },
                  ]
                : []),
            ].map((row, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, color: 'hsl(var(--primary))' }}
                  >
                    {row.icon}
                  </span>
                  {row.value || '—'}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'hsl(var(--container-low))',
              borderRadius: 'var(--radius-xs)',
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              Appointed {leaderTitle.toLowerCase()} for {locationName}. Responsible for coordinating
              local activities and driving grassroots mobilization in {locationRegion}.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                close
              </span>
              Close profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
