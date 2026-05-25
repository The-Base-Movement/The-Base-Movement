export interface ChapterAnnouncement {
  id: string
  content: string
  author_name: string
  created_at: string
}

interface AnnouncementsPanelProps {
  announcements: ChapterAnnouncement[]
  leaderAvatarUrl: string | null
}

export function AnnouncementsPanel({ announcements, leaderAvatarUrl }: AnnouncementsPanelProps) {
  if (announcements.length === 0) return null

  return (
    <div className="panel" style={{ padding: '20px 22px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
        >
          campaign
        </span>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Chapter updates
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {announcements.map((a) => (
          <div key={a.id} style={{ borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'hsl(var(--primary) / 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--primary))',
                  fontFamily: "'Public Sans', sans-serif",
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                {leaderAvatarUrl ? (
                  <img
                    src={leaderAvatarUrl}
                    alt={a.author_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  a.author_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                )}
              </div>
              <div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {a.author_name}
                </span>
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--primary))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Chapter Leader
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  ·{' '}
                  {new Date(a.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {a.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
