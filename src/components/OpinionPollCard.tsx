import type { Poll } from '@/services/adminService'
import { toast } from 'sonner'

interface OpinionPollCardProps {
  poll: Poll
  voting: string | null
  showResults: boolean
  isLoggedIn: boolean
  handleVote: (pollId: string, optionId: string) => void
  toggleResults: (pollId: string) => void
  variant?: 'public'
}

export function OpinionPollCard({
  poll,
  voting,
  showResults,
  isLoggedIn,
  handleVote,
  toggleResults,
  variant,
}: OpinionPollCardProps) {
  const bodyFont = variant === 'public' ? "'Work Sans', sans-serif" : "'Public Sans', sans-serif"
  const isLive = poll.status === 'Active'
  const accentColor = isLive ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))'

  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes)
  const leadId = sortedOptions[0]?.id

  const days = Math.max(
    0,
    Math.ceil((new Date(poll.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div
      className="bg-white border border-[var(--border,#e5e7eb)] rounded-[6px] overflow-hidden relative"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="p-[22px]">
        {/* Poll head */}
        <div className="flex items-start justify-between mb-2">
          <span
            className="flex items-center gap-[6px] text-[10px] font-medium tracking-[0.06em] uppercase font-['Public_Sans',sans-serif]"
            style={{ color: accentColor }}
          >
            {isLive && (
              <span
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: accentColor }}
              />
            )}
            {!isLive && (
              <span className="w-[6px] h-[6px] rounded-full bg-current shrink-0 opacity-40" />
            )}
            {isLive
              ? `Live · Closes in ${days} day${days !== 1 ? 's' : ''}`
              : `Closed · ${new Date(poll.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </span>
          <span className="text-[10.5px] text-[var(--on-surface-muted,#6b7280)] font-medium font-['Public_Sans',sans-serif]">
            {poll.totalVotes.toLocaleString()} votes
          </span>
        </div>

        <h3
          className="text-[15px] leading-[1.45] mb-[14px] text-[var(--on-surface,#181d19)]"
          style={{
            fontFamily: bodyFont,
            fontWeight: variant === 'public' ? 500 : 600,
            letterSpacing: '-0.005em',
          }}
        >
          {poll.question}
        </h3>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {poll.options.map((option) => {
            const percentage =
              poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
            const isSelected = poll.userSelection === option.id
            const displayResults = poll.voted || showResults
            const isLead = option.id === leadId

            return (
              <div key={option.id} className="relative">
                {displayResults ? (
                  <div
                    className={`relative px-[14px] py-[10px] border rounded-[4px] overflow-hidden transition-all duration-150 ${
                      isLead ? 'border-[var(--primary)]' : 'border-[var(--border,#e5e7eb)]'
                    } bg-[var(--container-low,#f9fafb)]`}
                  >
                    {/* Progress bar background */}
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        background: isLead ? 'rgba(0,107,63,0.18)' : 'rgba(0,107,63,0.08)',
                      }}
                    />
                    <div className="relative flex justify-between items-center">
                      <span
                        className={`text-[12.5px] tracking-[-0.005em] font-['Public_Sans',sans-serif] flex items-center gap-2 ${
                          isLead ? 'text-[var(--primary)]' : 'text-[var(--on-surface,#181d19)]'
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {isSelected && (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 14, flexShrink: 0 }}
                          >
                            check_circle
                          </span>
                        )}
                        {option.label}
                      </span>
                      <span className="text-[12.5px] font-medium tabular-nums font-['Public_Sans',sans-serif] text-[var(--on-surface-muted,#6b7280)]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (isLoggedIn) {
                        handleVote(poll.id, option.id)
                      } else {
                        toast.error(
                          'Voting is reserved for verified movement members. Join The Base to participate!'
                        )
                        window.location.href = '/login'
                      }
                    }}
                    disabled={voting === poll.id}
                    className="w-full text-left px-[14px] py-[10px] border border-[var(--border,#e5e7eb)] rounded-[4px] bg-[var(--container-low,#f9fafb)] hover:border-[var(--primary)] transition-all duration-150 group/btn"
                  >
                    <span
                      className="text-[12.5px] tracking-[-0.005em] font-['Public_Sans',sans-serif] text-[var(--on-surface,#181d19)] block"
                      style={{ fontWeight: 500 }}
                    >
                      {option.label}
                    </span>
                    {!isLoggedIn && (
                      <span className="text-[9.5px] font-medium text-[var(--on-surface-muted,#6b7280)] tracking-[0.02em] mt-0.5 block">
                        Members only
                      </span>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-[14px] pt-[14px] border-t border-[var(--border,#e5e7eb)] flex justify-between items-center">
          <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--on-surface-muted,#6b7280)] font-['Public_Sans',sans-serif]">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                group
              </span>
              {poll.totalVotes.toLocaleString()} Votes
            </span>
            <button
              onClick={() => toggleResults(poll.id)}
              className={`flex items-center gap-1.5 transition-colors hover:text-[var(--primary)] ${showResults ? 'text-[var(--primary)]' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                bar_chart
              </span>
              {showResults ? 'Hide results' : 'Live results'}
            </button>
          </div>
          {poll.voted && (
            <span className="text-[10.5px] font-medium text-[var(--primary)] flex items-center gap-1 font-['Public_Sans',sans-serif]">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                check_circle
              </span>
              Vote recorded
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
