// src/pages/dashboard/referrals/ReferralCard.tsx
import type { ReferredMember } from '@/types/referrals'

interface Props {
  member: ReferredMember
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const cls =
    s === 'active' || s === 'approved'
      ? 'pill-ok'
      : s === 'pending'
        ? 'pill-warn'
        : s === 'suspended'
          ? 'pill-err'
          : 'pill-mute'
  return (
    <span className={`pill ${cls}`} style={{ fontSize: 12 }}>
      {status}
    </span>
  )
}

export default function ReferralCard({ member }: Props) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const networkLabel = member.platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network'

  const locationParts =
    member.platform === 'GHANA'
      ? [member.region, member.constituency].filter(Boolean)
      : [member.country].filter(Boolean)
  const locationLine = locationParts.join(' · ')

  const date = new Date(member.joinedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="panel" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--primary))',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 2,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {member.name}
            </p>
            <StatusBadge status={member.status} />
          </div>

          {/* Network + location */}
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {networkLabel}
            {locationLine ? ` · ${locationLine}` : ''}
          </p>

          {/* Date + points */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Joined {date}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="pill pill-ok" style={{ fontSize: 10 }}>
                +50 pts
              </span>
              {member.verificationBonusAwarded && (
                <span
                  className="pill"
                  style={{
                    fontSize: 10,
                    background: 'hsl(var(--accent) / 0.15)',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  +25 bonus ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
