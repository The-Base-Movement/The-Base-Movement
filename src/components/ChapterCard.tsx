import { Link } from 'react-router-dom'
import { type Chapter } from '@/types/admin'

interface ChapterCardProps {
  chapter: Chapter
  userChapterName?: string | null
}

export function ChapterCard({ chapter, userChapterName }: ChapterCardProps) {
  if (!chapter) return null

  const isActive =
    (chapter.status as string) === 'Active' || (chapter.status as string) === 'Member'
  const isDiaspora = chapter.country !== 'Ghana'
  const isFeatured = chapter.member_count > 500

  const badge = isDiaspora ? 'Diaspora' : isFeatured ? 'Featured' : isActive ? 'Active' : 'Regional'
  const headerBg = isFeatured ? 'hsl(var(--primary))' : isActive ? 'hsl(var(--accent))' : '#181d19'
  const headerTextColor = isActive && !isFeatured ? '#000' : '#fff'
  const headerMutedColor =
    isActive && !isFeatured
      ? 'rgba(0,0,0,0.6)'
      : isFeatured
        ? 'rgba(255,255,255,0.85)'
        : 'hsl(var(--accent))'

  const leader = chapter.leadership?.[0]
  const leaderName = leader?.name || chapter.leader_name || 'Branch Chair'
  const leaderRole = leader?.role || (isDiaspora ? 'Hub coordinator' : 'Branch chair')
  const leaderInitial = leaderName.charAt(0).toUpperCase()
  const leaderImage = leader?.imageUrl || chapter.leader_avatar_url

  const eventsCount = chapter.activities?.length ?? 0
  const programsCount = Math.max(0, Math.floor(eventsCount / 3))

  const regionLabel = chapter.region || chapter.city_or_region
  const flagUrl = chapter.flag_url || null
  const slug = chapter.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const isUserChapter =
    userChapterName && chapter.name.toLowerCase() === userChapterName.toLowerCase()

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
            {chapter.name}
            {flagUrl && (
              <img
                src={flagUrl}
                alt={chapter.country}
                style={{
                  marginLeft: 6,
                  height: 13,
                  width: 'auto',
                  verticalAlign: 'middle',
                  borderRadius: 2,
                  display: 'inline-block',
                }}
              />
            )}
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
            {regionLabel}
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
            { v: chapter.member_count.toLocaleString(), l: 'Members' },
            { v: eventsCount, l: 'Events' },
            { v: programsCount, l: 'Programs' },
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

        {/* Leader row */}
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
            {leaderImage ? (
              <img
                src={leaderImage}
                alt={leaderName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.dataset.showInitial = 'true'
                    parent.innerHTML = `<span style="color:#fff;font-size:12px;font-weight:500">${leaderInitial}</span>`
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
                {leaderInitial}
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
              {leaderName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {leaderRole}
            </div>
          </div>
          {isUserChapter ? (
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
              Joined
            </span>
          ) : (
            <Link
              to={`/dashboard/chapters/${slug}`}
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
              Join
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
