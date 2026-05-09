import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/neon-button'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Vote, ArrowRight, Clock, Lock } from 'lucide-react'
import { OpinionPollCard } from '@/components/OpinionPollCard'
import SEO from '@/components/SEO'
import { adminService } from '@/services/adminService'
import type { Poll, PollOption } from '@/types/admin'
import { toast } from 'sonner'

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [isLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true')

  useEffect(() => {
    async function loadPolls() {
      try {
        const data = await adminService.getPolls()
        setPolls(data)
      } catch (err) {
        console.error('Failed to load polls:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPolls()
  }, [])

  const toggleResults = (pollId: string) => {
    setShowResults(prev => ({ ...prev, [pollId]: !prev[pollId] }))
  }

  const handleVote = async (pollId: string, optionId: string) => {
    setVoting(pollId)
    
    const success = await adminService.voteInPoll(pollId, optionId)
    
    if (success) {
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            voted: true,
            userSelection: optionId,
            totalVotes: p.totalVotes + 1,
            options: p.options.map((o: PollOption) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
          }
        }
        return p
      }))
      toast.success('Your vote has been officially recorded. Thank you for your engagement!')
    } else {
      toast.error('Failed to submit vote. Please try again.')
    }
    
    setVoting(null)
  }

  const activePolls = polls.filter(p => p.status === 'Active')
  const closedPolls = polls.filter(p => p.status === 'Closed')

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      <SEO 
        title="Citizen Feedback"
        description="Your voice shapes the movement. Participate in our regular polls to help prioritize the plan and regional interventions."
        canonical="/polls"
      />
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
          <Breadcrumbs />
          <div className="mt-8">
            <h1 className="text-5xl md:text-7xl font-meta font-bold tracking-tighter mb-8 text-stone-900 flex items-center gap-6">
              <Vote className="w-12 h-12 text-primary" />
              Feedback Hub
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-3xl text-base md:text-lg mt-8 mb-0 leading-relaxed font-medium">
              Your voice shapes the movement. Participate in our regular polls to help prioritize the plan and regional interventions.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          {/* Active Polls Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-stone-900 tracking-tight mb-0">Active feedback</h2>
            </div>
            {loading ? (
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 bg-white border border-stone-200 animate-pulse rounded-none" />
                ))}
              </div>
            ) : activePolls.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center">
                <p className="text-stone-400 font-bold tracking-tight mb-0">No active polls at this time.</p>
              </div>
            ) : (
              activePolls.map(poll => (
                <OpinionPollCard 
                  key={poll.id} 
                  poll={poll} 
                  voting={voting} 
                  showResults={!!showResults[poll.id]} 
                  isLoggedIn={isLoggedIn}
                  handleVote={handleVote} 
                  toggleResults={toggleResults} 
                />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8 sticky top-24">
            {/* Stats Overview */}
            <div className="bg-charcoal-dark p-8 rounded-none text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Vote className="w-24 h-24 text-[var(--brand-green)]" />
              </div>
              <div className="relative z-10">
                <p className="text-warm-gold text-micro font-bold tracking-tight mb-4">Movement voice</p>
                <p className="text-stone-300 mb-6 leading-relaxed">
                  Poll results are presented to the National Steering Committee every month to influence movement strategy.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 border border-white/10">
                    <p className="text-micro font-bold text-white/40 tracking-tight mb-1">Total votes</p>
                    <h3 className="text-white mb-0">{polls.reduce((acc, p) => acc + p.totalVotes, 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-white/5 p-4 border border-white/10">
                    <p className="text-micro font-bold text-white/40 tracking-tight mb-1">Active polls</p>
                    <h3 className="text-white mb-0">{activePolls.length}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Closed Polls */}
            <div className="bg-white border border-stone-200 p-8 rounded-none">
              <div className="flex items-center gap-2 mb-8">
                <Lock className="w-4 h-4 text-stone-400" />
                <h2 className="text-base font-bold text-stone-900 tracking-tight mb-0">Closed polls</h2>
              </div>
              <div className="space-y-6">
                {closedPolls.map(poll => (
                  <div key={poll.id} className="group pb-6 border-b border-stone-50 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-micro font-bold text-red-500 bg-red-500/5 px-2 py-1 rounded-none tracking-tight mb-0">
                        {poll.category} • Closed
                      </p>
                    </div>
                    <h3 className="text-sm font-bold text-stone-800 leading-snug group-hover:text-[var(--brand-green)] transition-colors mb-0">
                      {poll.question}
                    </h3>
                    
                    {showResults[poll.id] && (
                      <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                        {(() => {
                          const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
                          const getRankColor = (optionId: string) => {
                            const rank = sortedOptions.findIndex(o => o.id === optionId);
                            if (rank === 0) return 'rgba(0, 107, 60, 0.1)';
                            if (rank === 1) return 'rgba(212, 160, 23, 0.1)';
                            if (rank === 2) return 'rgba(245, 158, 11, 0.1)';
                            return 'rgba(206, 17, 38, 0.05)';
                          };

                          return poll.options.map((option: PollOption) => {
                            const percentage = Math.round((option.votes / poll.totalVotes) * 100);
                            return (
                              <div key={option.id} className="space-y-1">
                                <div className="flex justify-between items-center px-3 py-2 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden">
                                  <span className="text-xs font-medium text-stone-600 truncate mr-2">{option.label}</span>
                                  <span className="text-micro font-bold text-stone-400 shrink-0 tracking-tight">{percentage}%</span>
                                  <div 
                                    className="absolute inset-0 -z-10"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: getRankColor(option.id)
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-tiny font-bold text-stone-400 mb-0 tracking-tight">{poll.totalVotes.toLocaleString()} responses</p>
                      <Button 
                        variant="link"
                        onClick={() => toggleResults(poll.id)}
                        className="text-brand-green p-0 h-auto"
                      >
                        {showResults[poll.id] ? 'Hide Results' : 'Final Results'} <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Card */}
            <div className="bg-primary p-8 rounded-none text-white shadow-xl shadow-primary/20">
              <h4 className="tracking-tight mb-4 text-white">Suggest a poll</h4>
              <p className="text-white/80 leading-relaxed mb-6 font-medium text-xs">
                Have a question you think the movement needs to answer? Submit your proposal for a new opinion poll.
              </p>
              <Button className="w-full bg-white text-primary hover:bg-stone-50 rounded-none tracking-tight font-bold">
                Submit proposal
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
