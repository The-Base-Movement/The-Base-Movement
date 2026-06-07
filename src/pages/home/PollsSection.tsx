import { Link } from 'react-router-dom'
import { type Poll } from '@/services/adminService'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'

interface PollsSectionProps {
  activePolls: Poll[]
}

export function PollsSection({ activePolls }: PollsSectionProps) {
  if (activePolls.length === 0) return null

  return (
    <section
      aria-labelledby="polls-heading"
      className="py-16 md:py-24 bg-background border-b border-border/30"
    >
      <div className="page-container">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <span className="text-[10px] font-medium tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">
              Member voice
            </span>
            <h2
              id="polls-heading"
              className="text-2xl md:text-3xl font-meta font-medium text-on-surface tracking-tight"
            >
              Open polls
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Member voice surveys. Results visible to chapter leadership.
            </p>
          </div>
          <Link
            to="/polls"
            className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-medium tracking-tight text-xs hover:underline"
          >
            All polls{' '}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {activePolls.map((poll) => {
            const totalVotes = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0)
            const topOption =
              poll.options.length > 0
                ? poll.options.reduce((a, b) => (a.votes > b.votes ? a : b))
                : null
            return (
              <div
                key={poll.id}
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  padding: 22,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: 'hsl(var(--destructive))',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--destructive))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: 'currentColor',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                    Live ·{' '}
                    {poll.endDate && poll.endDate !== 'N/A'
                      ? `Closes ${new Date(poll.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                      : 'Ongoing'}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 500,
                    }}
                  >
                    {totalVotes.toLocaleString()} votes
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 16,
                    lineHeight: 1.3,
                    letterSpacing: '-.01em',
                    marginBottom: 14,
                  }}
                >
                  {poll.question}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {poll.options.slice(0, 4).map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                    const isLead = topOption !== null && opt.id === topOption.id && totalVotes > 0
                    return (
                      <div
                        key={opt.id}
                        style={{
                          position: 'relative',
                          padding: '10px 14px',
                          background: 'hsl(var(--container-low))',
                          border: `1px solid ${isLead ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${pct}%`,
                            background: isLead
                              ? 'hsl(var(--primary) / 18%)'
                              : 'hsl(var(--primary) / 10%)',
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 12.5,
                            fontWeight: 500,
                            letterSpacing: '-.005em',
                            color: isLead ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                          }}
                        >
                          <span>{opt.label}</span>
                          <span
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              fontWeight: 'var(--font-weight-medium, 500)',
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid hsl(var(--border))',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 500,
                    }}
                  >
                    Login to cast your vote
                  </span>
                  <ButtonPrimary asChild size="sm">
                    <Link to="/polls">
                      Cast vote{' '}
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        arrow_forward
                      </span>
                    </Link>
                  </ButtonPrimary>
                </div>
              </div>
            )
          })}
        </div>

        <ButtonPrimary asChild className="md:hidden mt-8 w-full">
          <Link to="/polls">
            View all polls
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </ButtonPrimary>
      </div>
    </section>
  )
}
