/**
 * VerificationListCard Component
 * -------------------------------------------------------------
 * Displays a single verification item card inside the Admin Verification Dashboard roster.
 * Represents a member who has submitted biometrics or documents for approval.
 * Shows member's profile image or initials, name, submission timestamp, ID code,
 * geographic location details, and status badges.
 */

import type { PendingVerification } from '@/services/adminService'

/**
 * Resolves the CSS class name for a given pending verification status.
 */
function statusPill(status: PendingVerification['status']) {
  if (status === 'Approved') return 'pill pill-ok'
  if (status === 'In Review') return 'pill pill-warn'
  if (status === 'Processing') return 'pill pill-warn'
  if (status === 'Flagged') return 'pill pill-err'
  if (status === 'Rejected') return 'pill pill-err'
  return 'pill pill-mute'
}

interface Props {
  member: PendingVerification
  isActive: boolean
  onClick: (member: PendingVerification) => void
}

/**
 * VerificationListCard component definition.
 */
export default function VerificationListCard({ member, isActive, onClick }: Props) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    fontSize: 12,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
  }

  const borderColor = isActive ? 'rgba(255,255,255,.08)' : 'hsl(var(--border))'

  return (
    <div
      onClick={() => onClick(member)}
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: isActive ? 'linear-gradient(135deg,#0f1310,#1f2620)' : 'hsl(var(--card))',
        boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
        cursor: 'pointer',
      }}
    >
      {/* Row 1: avatar + name + ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: isActive ? 'rgba(255,255,255,.1)' : 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: isActive ? '1px solid rgba(255,255,255,.15)' : '1px solid hsl(var(--border))',
          }}
        >
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              decoding="async"
              loading="lazy"
            />
          ) : (
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: isActive ? 'rgba(255,255,255,.6)' : 'hsl(var(--on-surface-muted))',
              }}
            >
              {initials}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13.5,
              color: isActive ? '#fff' : 'hsl(var(--on-surface))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {member.name}
          </p>
          <span
            style={{
              fontSize: 10.5,
              color: isActive ? 'rgba(255,255,255,.45)' : 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontVariantNumeric: 'tabular-nums',
              display: 'block',
            }}
          >
            {member.id}
          </span>
          <span
            style={{
              fontSize: 10,
              color: isActive ? 'rgba(255,255,255,.3)' : 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              display: 'block',
              marginTop: 1,
              opacity: 0.8,
            }}
          >
            {member.submitted}
          </span>
        </div>
      </div>

      {/* Row 2: region/constituency + status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            ...metaStyle,
            marginTop: 0,
            color: isActive ? 'rgba(255,255,255,.45)' : 'hsl(var(--on-surface-muted))',
          }}
        >
          {(member.region || member.constituency) && (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                place
              </span>
              {member.region}
              {member.constituency && member.constituency !== '—'
                ? ` · ${member.constituency}`
                : ''}
            </>
          )}
        </div>
        {isActive ? (
          <span
            style={{
              padding: '2px 9px',
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 'var(--radius-pill)',
              fontSize: 9.5,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              flexShrink: 0,
            }}
          >
            {member.status}
          </span>
        ) : (
          <span className={statusPill(member.status)} style={{ flexShrink: 0 }}>
            {member.status}
          </span>
        )}
      </div>
    </div>
  )
}
