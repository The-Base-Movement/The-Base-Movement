interface ChapterHeaderProps {
  name: string
  status: string
  isActive: boolean
  city_or_region: string
  country: string
  member_count: number
  isJoining: boolean
  hasJoined: boolean
  joinRequestStatus: 'pending' | 'approved' | 'rejected' | null
  onShare: () => void
  onJoin: () => void
}

export function ChapterHeader({
  name,
  status,
  isActive,
  city_or_region,
  country,
  member_count,
  isJoining,
  hasJoined,
  joinRequestStatus,
  onShare,
  onJoin,
}: ChapterHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {isActive ? (
          <>
            <span className="pill pill-ok">Active</span>
            <span
              style={{
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Public Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Verified chapter
            </span>
          </>
        ) : (
          <span className="pill pill-warn">{status}</span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            {name}
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px 16px',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
              >
                location_on
              </span>
              {city_or_region}, {country}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
              >
                group
              </span>
              {member_count} Active members
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={onShare}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              share
            </span>
            Share
          </button>
          <button
            className={`btn btn-sm ${hasJoined || joinRequestStatus === 'approved' ? 'btn-outline' : joinRequestStatus === 'pending' ? 'btn-outline' : 'btn-primary'}`}
            style={{ flex: 1 }}
            onClick={onJoin}
            disabled={
              isJoining ||
              hasJoined ||
              joinRequestStatus === 'pending' ||
              joinRequestStatus === 'approved'
            }
          >
            {isJoining
              ? 'Sending request…'
              : hasJoined || joinRequestStatus === 'approved'
                ? 'Already a member'
                : joinRequestStatus === 'pending'
                  ? 'Request pending…'
                  : 'Request to join'}
          </button>
        </div>
      </div>
    </div>
  )
}
