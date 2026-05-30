import { Link } from 'react-router-dom'
import { type Constituency } from '@/types/admin'
import { constituencySlug } from '@/services/constituencyService'

interface ConstituencyCardProps {
  constituency: Constituency
  userConstituency?: string | null
}

export function ConstituencyCard({ constituency, userConstituency }: ConstituencyCardProps) {
  if (!constituency) return null

  const isActive = constituency.status === 'Active'
  const isFeatured = isActive && constituency.memberCount > 200

  const badge =
    userConstituency && constituency.name.toLowerCase() === userConstituency.toLowerCase()
      ? 'Your Area'
      : isActive
        ? 'Active'
        : 'Inactive'

  const headerBg = isFeatured ? 'hsl(var(--primary))' : isActive ? 'hsl(var(--accent))' : '#181d19'
  const headerTextColor = isActive && !isFeatured ? '#000' : '#fff'
  const headerMutedColor =
    isActive && !isFeatured
      ? 'rgba(0,0,0,0.6)'
      : isFeatured
        ? 'rgba(255,255,255,0.85)'
        : 'hsl(var(--accent))'

  const coordinatorName = constituency.leaderName || 'Coordinator'
  const coordinatorInitial = coordinatorName.charAt(0).toUpperCase()
  const coordinatorImage = constituency.leaderAvatarUrl

  const activitiesCount = constituency.activities?.length ?? 0
  const slug = constituencySlug(constituency.name)

  const isUserConstituency = !!(
    userConstituency && constituency.name.toLowerCase() === userConstituency.toLowerCase()
  )

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
        overflow: 'hidden',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: headerBg,
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              color: headerTextColor,
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              letterSpacing: '-0.005em',
              lineHeight: 1.2,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {constituency.name}
          </h4>
          <div
            style={{
              color: headerMutedColor,
              fontSize: 9.5,
              fontWeight: 'var(--font-weight-medium, 500)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {constituency.regionName}
          </div>
        </div>
        <span
          style={{
            padding: '2px 8px',
            border: `1px solid ${isActive && !isFeatured ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 2,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 9,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flexShrink: 0,
            background: isActive && !isFeatured ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            color: headerTextColor,
          }}
        >
          {badge}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px' }}>
        {/* 3-stat grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { v: constituency.memberCount.toLocaleString(), l: 'Members' },
            { v: activitiesCount, l: 'Activities' },
            { v: constituency.regionName.split(' ')[0], l: 'Region' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div
                style={{
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 18,
                  letterSpacing: '-0.015em',
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 2,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* Coordinator row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              flexShrink: 0,
              border: '2px solid hsl(var(--accent))',
              overflow: 'hidden',
              background: '#181d19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {coordinatorImage ? (
              <img
                src={coordinatorImage}
                alt={coordinatorName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `<span style="color:#fff;font-size:12px;font-weight:500">${coordinatorInitial}</span>`
                  }
                }}
              />
            ) : (
              <span
                style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {coordinatorInitial}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11.5,
                color: 'hsl(var(--on-surface))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {coordinatorName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Constituency Coordinator
            </div>
          </div>
          {isUserConstituency ? (
            <span
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                background: 'hsla(var(--primary), 0.08)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsla(var(--primary), 0.25)',
              }}
            >
              My Area
            </span>
          ) : (
            <Link
              to={`/dashboard/constituencies/${slug}`}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
