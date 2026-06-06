import { Link } from 'react-router-dom'
import type { ChapterLeader } from '@/types/admin'

interface LeadershipSidebarProps {
  chapterSlug: string
  city_or_region: string
  leader_name?: string | null
  leader_id?: string | null
  leadership?: ChapterLeader[]
  leaderAvatarUrl: string | null
  isLeader: boolean
  email?: string | null
  phone_number?: string | null
  onViewLeaderProfile: () => void
}

export function LeadershipSidebar({
  chapterSlug,
  city_or_region,
  leader_name,
  leader_id,
  leadership,
  leaderAvatarUrl,
  isLeader,
  email,
  phone_number,
  onViewLeaderProfile,
}: LeadershipSidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Leadership panel */}
      <div className="panel" style={{ padding: '20px 22px' }}>
        <h3
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          Chapter leadership
        </h3>

        {leader_name ? (
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  background: '#181d19',
                  border: '2px solid hsl(var(--accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'hsl(var(--on-surface))',
                  fontSize: 16,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  overflow: 'hidden',
                }}
              >
                {leaderAvatarUrl ? (
                  <img
                    src={leaderAvatarUrl}
                    alt={leader_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  leader_name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {leader_name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--primary))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: 2,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Chapter Leader
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {leader_id && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                  onClick={onViewLeaderProfile}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    person
                  </span>
                  View profile
                </button>
              )}
              {isLeader && (
                <Link
                  to={`/dashboard/chapter-hub/${chapterSlug}`}
                  className="btn btn-primary btn-sm"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: 11,
                    textDecoration: 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    manage_accounts
                  </span>
                  Manage chapter
                </Link>
              )}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {leadership && leadership.length > 0 ? (
            leadership.map((leader: ChapterLeader, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {leader.imageUrl ? (
                    <img
                      src={leader.imageUrl}
                      alt={leader.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {leader.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {leader.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {leader.role}
                  </div>
                </div>
              </div>
            ))
          ) : !leader_name ? (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                border: '1px dashed hsl(var(--border))',
                borderRadius: 4,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Leadership pending
              </p>
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              mail
            </span>
            {email || `${city_or_region.toLowerCase()}@thebasemovement.com`}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              phone
            </span>
            {phone_number || '+233 (0) 50 123 4567'}
          </div>
        </div>
      </div>

      {/* Official verification */}
      <div
        style={{
          background: 'hsl(var(--container-low))',
          padding: 22,
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.08 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 80, color: 'hsl(var(--on-surface))' }}
          >
            verified_user
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--accent))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Official verification
          </div>
          <p
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.6,
              marginBottom: 16,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            This chapter is officially recognized and verified by The Base National Headquarters.
            All activities are coordinated with the central movement agenda.
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: 'rgba(0,107,63,0.25)',
              color: 'hsl(var(--primary))',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              borderRadius: 4,
              border: '1px solid rgba(0,107,63,0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              verified_user
            </span>
            Verified
          </span>
        </div>
      </div>

      {/* Donate to chapter */}
      <div className="panel" style={{ padding: '20px 22px' }}>
        <h3
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            marginBottom: 8,
          }}
        >
          Support local
        </h3>
        <p
          style={{
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.6,
            marginBottom: 16,
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Your donations to this specific chapter help fund local townhalls and community outreach
          programs in {city_or_region}.
        </p>
        <Link
          to="/dashboard/donate"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
        >
          Donate to chapter
        </Link>
      </div>
    </div>
  )
}
