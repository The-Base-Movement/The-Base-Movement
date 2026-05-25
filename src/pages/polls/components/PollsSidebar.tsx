interface PollsSidebarProps {
  totalVotes: number
  activePollsCount: number
  isDashboard: boolean
  bodyFont: string
}

export function PollsSidebar({
  totalVotes,
  activePollsCount,
  isDashboard,
  bodyFont,
}: PollsSidebarProps) {
  return (
    <>
      {/* Movement voice panel */}
      <div
        style={{
          background: '#181d19',
          borderRadius: 6,
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            fontSize: 56,
            color: '#fff',
            opacity: 0.05,
            pointerEvents: 'none',
          }}
        >
          how_to_vote
        </span>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            color: 'hsl(var(--accent))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Movement voice
        </div>
        <p
          style={{
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: isDashboard ? 12 : 13,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}
        >
          Poll results are presented to the National Steering Committee every month to influence
          movement strategy.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: 12,
            }}
          >
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 4,
              }}
            >
              Total votes
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 20,
                color: '#fff',
                lineHeight: 1,
              }}
            >
              {totalVotes.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: 12,
            }}
          >
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 4,
              }}
            >
              Active polls
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 20,
                color: '#fff',
                lineHeight: 1,
              }}
            >
              {activePollsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Suggest a poll */}
      <div style={{ background: 'hsl(var(--primary))', borderRadius: 6, padding: 20 }}>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 14,
            color: '#fff',
            marginBottom: 8,
          }}
        >
          Suggest a poll
        </div>
        <p
          style={{
            fontFamily: bodyFont,
            fontWeight: 500,
            fontSize: isDashboard ? 12 : 13,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            margin: '0 0 14px',
          }}
        >
          Have a question you think the movement needs to answer? Submit your proposal.
        </p>
        <button
          className="btn btn-outline"
          style={{
            width: '100%',
            justifyContent: 'center',
            background: '#fff',
            color: 'hsl(var(--primary))',
            borderColor: 'transparent',
          }}
        >
          Submit proposal
        </button>
      </div>
    </>
  )
}
