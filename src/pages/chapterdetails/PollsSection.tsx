export interface ChapterPoll {
  id: string
  title: string
  description: string | null
  ends_at: string
  created_at: string
  banner_url: string | null
  chapter_poll_candidates: {
    id: string
    name: string
    position: string | null
    avatar_url: string | null
  }[]
}

interface PollsSectionProps {
  polls: ChapterPoll[]
  voteCounts: Record<string, number>
  userVotes: Record<string, string>
  votingPollId: string | null
  onVote: (pollId: string, candidateId: string) => void
}

export function PollsSection({
  polls,
  voteCounts,
  userVotes,
  votingPollId,
  onVote,
}: PollsSectionProps) {
  if (polls.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {polls.map((poll) => {
        const now = new Date()
        const endsAt = new Date(poll.ends_at)
        const isOpen = endsAt > now
        const myVote = userVotes[poll.id]
        const totalVotes = poll.chapter_poll_candidates.reduce(
          (s, c) => s + (voteCounts[c.id] || 0),
          0
        )
        return (
          <div key={poll.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {poll.banner_url && (
              <img
                src={poll.banner_url}
                alt=""
                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
              />
            )}
            <div style={{ padding: '18px 20px' }}>
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
                  style={{
                    fontSize: 18,
                    color: isOpen ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  how_to_vote
                </span>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {poll.title}
                  </span>
                  {poll.description && (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {poll.description}
                    </p>
                  )}
                </div>
                {isOpen ? (
                  <span className="pill pill-ok" style={{ flexShrink: 0 }}>
                    Open
                  </span>
                ) : (
                  <span className="pill pill-mute" style={{ flexShrink: 0 }}>
                    Closed
                  </span>
                )}
              </div>

              {isOpen && !myVote ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Select a candidate · Closes{' '}
                    {endsAt.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {poll.chapter_poll_candidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onVote(poll.id, c.id)}
                      disabled={votingPollId === poll.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        background: 'hsl(var(--container-low))',
                        cursor: 'pointer',
                        fontFamily: "'Public Sans', sans-serif",
                        textAlign: 'left',
                        width: '100%',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--primary))'
                        e.currentTarget.style.background = 'hsl(var(--primary) / 0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))'
                        e.currentTarget.style.background = 'hsl(var(--container-low))'
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 4,
                          background: 'hsl(var(--border))',
                          flexShrink: 0,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 12,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          c.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {c.name}
                        </span>
                        {c.position && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              fontWeight: 700,
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                            }}
                          >
                            {c.position}
                          </span>
                        )}
                      </div>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                      >
                        radio_button_unchecked
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {isOpen && myVote
                      ? 'Your vote has been recorded — results so far:'
                      : `Final results · ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}`}
                  </p>
                  {poll.chapter_poll_candidates
                    .map((c) => ({ ...c, count: voteCounts[c.id] || 0 }))
                    .sort((a, b) => b.count - a.count)
                    .map((c, i) => {
                      const pct = totalVotes > 0 ? Math.round((c.count / totalVotes) * 100) : 0
                      const isWinner = !isOpen && i === 0 && c.count > 0
                      const isMyVote = myVote === c.id
                      return (
                        <div
                          key={c.id}
                          style={{
                            border: `1px solid ${isWinner ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'}`,
                            borderRadius: 4,
                            padding: '10px 14px',
                            background: isWinner
                              ? 'hsl(var(--primary) / 0.04)'
                              : 'hsl(var(--container-low))',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 4,
                                background: 'hsl(var(--border))',
                                flexShrink: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 11,
                                color: 'hsl(var(--on-surface))',
                              }}
                            >
                              {c.avatar_url ? (
                                <img
                                  src={c.avatar_url}
                                  alt={c.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                c.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                              )}
                            </div>
                            <div
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                              }}
                            >
                              {isWinner && (
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
                                >
                                  emoji_events
                                </span>
                              )}
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: 'hsl(var(--on-surface))',
                                  fontFamily: "'Public Sans', sans-serif",
                                }}
                              >
                                {c.name}
                              </span>
                              {c.position && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: 'hsl(var(--on-surface-muted))',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {c.position}
                                </span>
                              )}
                              {isMyVote && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    background: 'hsl(var(--primary) / 0.1)',
                                    color: 'hsl(var(--primary))',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  Your vote
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: 'hsl(var(--on-surface-muted))',
                                fontFamily: "'Public Sans', sans-serif",
                                flexShrink: 0,
                              }}
                            >
                              {pct}% · {c.count}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 4,
                              background: 'hsl(var(--border))',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: isWinner
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--on-surface-muted))',
                                transition: 'width 0.6s',
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
