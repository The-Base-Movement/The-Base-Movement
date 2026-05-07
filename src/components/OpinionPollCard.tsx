import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle2, ArrowRight, Users, BarChart3 } from 'lucide-react'

import type { Poll } from '@/services/adminService'
import { toast } from 'sonner'

interface OpinionPollCardProps {
  poll: Poll
  voting: string | null
  showResults: boolean
  isLoggedIn: boolean
  handleVote: (pollId: string, optionId: string) => void
  toggleResults: (pollId: string) => void
}

export function OpinionPollCard({ poll, voting, showResults, isLoggedIn, handleVote, toggleResults }: OpinionPollCardProps) {
  // Rank options by votes to assign colors
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  const getRankColor = (optionId: string) => {
    const rank = sortedOptions.findIndex(o => o.id === optionId);
    if (rank === 0) return 'rgba(0, 107, 60, 0.1)'; // Win: Light Green
    if (rank === 1) return 'rgba(212, 160, 23, 0.1)'; // 2nd: Light Gold
    if (rank === 2) return 'rgba(245, 158, 11, 0.1)'; // 3rd: Light Orange
    return 'rgba(206, 17, 38, 0.05)'; // 4th+: Light Red
  };

  const days = Math.max(0, Math.ceil((new Date(poll.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Card className="border border-stone-200 rounded-none shadow-sm overflow-hidden hover:border-[var(--brand-green)]/30 transition-all">
      <CardContent className="p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-[var(--brand-green)] bg-[var(--brand-green)]/5 px-2 py-1 rounded-none tracking-tight shrink-0 mb-0">
              {poll.category}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <p className="text-[10px] font-bold text-stone-400 tracking-tight mb-0">
                {poll.status === 'Active' ? 'Ends in:' : 'Ended'}
              </p>
              <p className="text-xs font-bold text-stone-700 mb-0">
                {poll.status === 'Active' ? `${days} Day${days !== 1 ? 's' : ''}` : 'Closed'}
              </p>
            </div>
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-0 leading-tight">
            {poll.question}
          </h3>
        </div>

        <div className="space-y-3">
          {poll.options.map(option => {
            const percentage = Math.round((option.votes / poll.totalVotes) * 100);
            const isSelected = poll.userSelection === option.id;
            const displayResults = poll.voted || showResults;

            return (
              <div key={option.id} className="relative group">
                {displayResults ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm font-bold px-4 py-3 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden">
                      <div className="flex items-center gap-2">
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--brand-green)]" />}
                        <span className={`text-sm font-medium ${isSelected ? 'text-[var(--brand-green)]' : 'text-stone-600'}`}>{option.label}</span>
                      </div>
                      <span className="text-stone-400 text-[10px] font-bold tracking-tight">{percentage}%</span>
                      {/* Progress Bar Background */}
                      <div 
                        className="absolute inset-0 -z-10 transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: getRankColor(option.id)
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (isLoggedIn) {
                        handleVote(poll.id, option.id)
                      } else {
                        toast.error('Voting is reserved for verified movement members. Join The Base to participate!')
                        window.location.href = '/login'
                      }
                    }}
                    disabled={voting === poll.id}
                    className="w-full text-left px-5 py-4 border border-stone-200 hover:border-[var(--brand-green)] hover:bg-stone-50 transition-all rounded-none flex justify-between items-center group/btn"
                  >
                    <span className="text-sm font-bold text-stone-700">
                      {option.label}
                      {!isLoggedIn && <span className="block text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-tight">Members only</span>}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all text-[var(--brand-green)]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[10px] font-bold text-stone-400 tracking-tight mb-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {poll.totalVotes.toLocaleString()} Votes
            </div>
            <button 
              onClick={() => toggleResults(poll.id)}
              className={`flex items-center gap-1.5 transition-colors ${showResults ? 'text-[var(--brand-green)]' : 'hover:text-[var(--brand-green)]'}`}
            >
              <BarChart3 className="w-4 h-4" />
              {showResults ? 'Hide Results' : 'Live Results'}
            </button>
          </div>
          {poll.voted && (
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 tracking-tight mb-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Vote recorded
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
