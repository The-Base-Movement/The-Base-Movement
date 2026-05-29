interface ChapterAnnouncement {
  id: string
  chapter_id: string
  content: string
  author_name: string
  created_at: string
}

interface Props {
  announcements: ChapterAnnouncement[]
  announceDraft: string
  isPostingAnnounce: boolean
  leaderAvatarUrl: string | null
  onDraftChange: (value: string) => void
  onPost: () => void
  onDelete: (id: string) => void
}

export function BoardTab({
  announcements,
  announceDraft,
  isPostingAnnounce,
  leaderAvatarUrl,
  onDraftChange,
  onPost,
  onDelete,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
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
            Post an update
          </span>
        </div>
        <textarea
          name="announceDraft"
          id="textarea-ad00f4"
          value={announceDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Share a quick update, reminder, or announcement with your chapter members…"
          rows={4}
          style={{
            width: '100%',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
            background: '#fff',
            color: 'hsl(var(--on-surface))',
            resize: 'vertical',
            lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            className="btn btn-primary"
            onClick={onPost}
            disabled={isPostingAnnounce || !announceDraft.trim()}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              send
            </span>
            {isPostingAnnounce ? 'Posting…' : 'Post update'}
          </button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="panel" style={{ padding: '48px 18px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
          >
            forum
          </span>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              marginTop: 12,
            }}
          >
            No updates posted yet. Write one above to reach your members.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.map((a) => (
            <div key={a.id} className="panel" style={{ padding: '16px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-pill)',
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
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {a.author_name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {new Date(a.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}
                      {new Date(a.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(a.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 'var(--radius-sm)',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                  title="Delete update"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    delete
                  </span>
                </button>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 'var(--font-weight-medium, 500)',
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
      )}
    </div>
  )
}
