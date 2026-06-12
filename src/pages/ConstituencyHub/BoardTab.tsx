import type { ConstituencyLeader } from '@/types/admin'

interface Announcement {
  id: string
  content: string
  author_name: string
  created_at: string
}

interface Props {
  announceDraft: string
  setAnnounceDraft: (s: string) => void
  isPostingAnnounce: boolean
  onPost: () => void
  announcements: Announcement[]
  onDelete: (id: string) => void
  leaderAvatarUrl?: string | null
  committee: ConstituencyLeader[]
}

export function BoardTab({
  announceDraft,
  setAnnounceDraft,
  isPostingAnnounce,
  onPost,
  announcements,
  onDelete,
  leaderAvatarUrl,
  committee,
}: Props) {
  return (
    <div>
      <div className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 10px',
          }}
        >
          Post an update
        </p>
        <textarea
          value={announceDraft}
          onChange={(e) => setAnnounceDraft(e.target.value)}
          placeholder="Write an update for your constituency members..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontFamily: "'Public Sans', sans-serif",
            resize: 'vertical',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={onPost}
          disabled={isPostingAnnounce || !announceDraft.trim()}
        >
          {isPostingAnnounce ? 'Posting...' : 'Post Update'}
        </button>
      </div>

      {announcements.length === 0 ? (
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
          No updates posted yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a) => (
            <div key={a.id} className="panel" style={{ padding: '16px 20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'hsl(var(--primary) / 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '500',
                      fontSize: 12,
                      color: 'hsl(var(--primary))',
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
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {a.author_name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: 'hsl(var(--primary))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: '500',
                        }}
                      >
                        Coordinator
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {a.content}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '8px 0 0',
                      }}
                    >
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(a.id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {committee.length > 0 && (
        <div className="panel" style={{ padding: '20px 24px', marginTop: 20 }}>
          <p
            style={{
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 14px',
              paddingBottom: 12,
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            Committee
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {committee.map((c) => (
              <div
                key={c.id}
                style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 220 }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'hsl(var(--container-low))',
                    overflow: 'hidden',
                  }}
                >
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : null}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    {c.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BoardTab
