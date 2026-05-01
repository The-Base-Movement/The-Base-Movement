import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Vote, Users, ArrowRight, CheckCircle2, BarChart3, Clock, Lock } from 'lucide-react'

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  status: 'Active' | 'Closed';
  endDate: string;
  expired_at: string; // Dynamic expiry timestamp
  category: string;
  voted?: boolean;
  userSelection?: string;
}

const initialPolls: Poll[] = [
  {
    id: '1',
    question: "What should be the top priority for youth employment in Ghana?",
    status: 'Active',
    endDate: '2026-05-30',
    expired_at: '2026-05-30T23:59:59Z',
    category: 'Policy',
    totalVotes: 554,
    voted: false,
    options: [
      { id: 'a', label: 'Industrial factories', votes: 180 },
      { id: 'b', label: 'Agriculture & agribusiness', votes: 154 },
      { id: 'c', label: 'Technology & digital jobs', votes: 120 },
      { id: 'd', label: 'Vocational training', votes: 60 },
      { id: 'e', label: 'Small business support', votes: 40 }
    ]
  },
  {
    id: '2',
    question: "Which region requires the most urgent industrial intervention?",
    status: 'Active',
    endDate: '2026-06-15',
    expired_at: '2026-06-15T23:59:59Z',
    category: 'Regional Development',
    totalVotes: 342,
    voted: false,
    options: [
      { id: 'a', label: 'Northern Region', votes: 110 },
      { id: 'b', label: 'Ashanti Region', votes: 85 },
      { id: 'c', label: 'Greater Accra', votes: 55 },
      { id: 'd', label: 'Western Region', votes: 92 }
    ]
  },
  {
    id: '3',
    question: "Standardizing National Identification for all digital services?",
    status: 'Closed',
    endDate: '2026-04-10',
    expired_at: '2026-04-10T23:59:59Z',
    category: 'Governance',
    totalVotes: 1240,
    voted: true,
    userSelection: 'a',
    options: [
      { id: 'a', label: 'Strongly Agree', votes: 850 },
      { id: 'b', label: 'Agree', votes: 240 },
      { id: 'c', label: 'Neutral', votes: 80 },
      { id: 'd', label: 'Disagree', votes: 70 }
    ]
  }
]

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>(initialPolls)
  const [voting, setVoting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})

  const toggleResults = (pollId: string) => {
    setShowResults(prev => ({ ...prev, [pollId]: !prev[pollId] }))
  }

  const handleVote = (pollId: string, optionId: string) => {
    setVoting(pollId)
    // Simulate API call
    setTimeout(() => {
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            voted: true,
            userSelection: optionId,
            totalVotes: p.totalVotes + 1,
            options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
          }
        }
        return p
      }))
      setVoting(null)
    }, 1000)
  }

  const activePolls = polls.filter(p => p.status === 'Active')
  const closedPolls = polls.filter(p => p.status === 'Closed')

  return (
    <div className="bg-stone-50/50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Breadcrumbs />
          <div className="mt-4">
            <h1 className="text-4xl font-bold text-stone-900 tracking-tighter font-meta flex items-center gap-3">
              <Vote className="w-8 h-8 text-brand-green" />
              Opinion Polls
            </h1>
            <p className="text-stone-500 max-w-2xl text-sm leading-relaxed mt-2">
              Your voice shapes the movement. Participate in our regular polls to help prioritize our agenda and regional interventions.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Active Polls Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-brand-green" />
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Active Polls</h2>
            </div>

            {activePolls.map(poll => (
              <Card key={poll.id} className="border border-stone-200 rounded-none shadow-sm overflow-hidden hover:border-brand-green/30 transition-all">
                <CardContent className="p-8">
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-brand-green bg-brand-green/5 px-2 py-1 rounded-none uppercase tracking-widest shrink-0">
                        {poll.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          {poll.status === 'Active' ? 'Ends In:' : 'Ended'}
                        </p>
                        <p className="text-xs font-bold text-stone-700">
                          {poll.status === 'Active' ? (
                            (() => {
                              const days = Math.max(0, Math.ceil((new Date(poll.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                              return `${days} Day${days !== 1 ? 's' : ''}`;
                            })()
                          ) : 'Closed'}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                      {poll.question}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      // Rank options by votes to assign colors
                      const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
                      const getRankColor = (optionId: string) => {
                        const rank = sortedOptions.findIndex(o => o.id === optionId);
                        if (rank === 0) return 'rgba(0, 107, 60, 0.1)'; // Win: Light Green
                        if (rank === 1) return 'rgba(212, 160, 23, 0.1)'; // 2nd: Light Gold
                        if (rank === 2) return 'rgba(245, 158, 11, 0.1)'; // 3rd: Light Orange
                        return 'rgba(206, 17, 38, 0.05)'; // 4th+: Light Red
                      };

                      return poll.options.map(option => {
                        const percentage = Math.round((option.votes / poll.totalVotes) * 100);
                        const isSelected = poll.userSelection === option.id;
                        const displayResults = poll.voted || showResults[poll.id];

                        return (
                          <div key={option.id} className="relative group">
                            {displayResults ? (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-sm font-bold px-4 py-3 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-green" />}
                                    <span className={isSelected ? 'text-brand-green' : 'text-stone-600'}>{option.label}</span>
                                  </div>
                                  <span className="text-stone-400 font-meta tracking-widest">{percentage}%</span>
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
                                onClick={() => handleVote(poll.id, option.id)}
                                disabled={voting === poll.id}
                                className="w-full text-left px-5 py-4 border border-stone-200 hover:border-brand-green hover:bg-stone-50 transition-all text-sm font-bold text-stone-700 rounded-none flex justify-between items-center group/btn"
                              >
                                {option.label}
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all text-brand-green" />
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {poll.totalVotes.toLocaleString()} Votes
                      </div>
                      <button 
                        onClick={() => toggleResults(poll.id)}
                        className={`flex items-center gap-1.5 transition-colors ${showResults[poll.id] ? 'text-brand-green' : 'hover:text-brand-green'}`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        {showResults[poll.id] ? 'Hide Results' : 'Live Results'}
                      </button>
                    </div>
                    {poll.voted && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        VOTE RECORDED
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="bg-charcoal-dark p-8 rounded-none text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Vote className="w-24 h-24 text-brand-green" />
              </div>
              <div className="relative z-10">
                <h3 className="text-warm-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Movement Voice</h3>
                <p className="text-sm leading-relaxed text-stone-300 mb-6">
                  Poll results are presented to the National Steering Committee every month to influence movement strategy.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Total Votes</p>
                    <p className="text-xl font-bold">12,450</p>
                  </div>
                  <div className="bg-white/5 p-4 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Active Polls</p>
                    <p className="text-xl font-bold">2</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Closed Polls */}
            <div className="bg-white border border-stone-200 p-8 rounded-none">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-stone-400" />
                Closed Polls
              </h3>
              <div className="space-y-6">
                {closedPolls.map(poll => (
                  <div key={poll.id} className="group pb-6 border-b border-stone-50 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/5 px-2 py-1 rounded-none uppercase tracking-widest">
                        {poll.category} • CLOSED
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-800 leading-snug group-hover:text-brand-green transition-colors">
                      {poll.question}
                    </h4>
                    
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

                          return poll.options.map(option => {
                            const percentage = Math.round((option.votes / poll.totalVotes) * 100);
                            return (
                              <div key={option.id} className="space-y-1">
                                <div className="flex justify-between items-center text-sm font-bold px-3 py-2 bg-stone-50 border border-stone-100 relative z-10 overflow-hidden">
                                  <span className="text-stone-600 truncate mr-2">{option.label}</span>
                                  <span className="text-stone-400 shrink-0">{percentage}%</span>
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
                      <span className="text-sm font-semibold text-stone-400">{poll.totalVotes.toLocaleString()} responses</span>
                      <button 
                        onClick={() => toggleResults(poll.id)}
                        className="text-sm font-bold text-brand-green flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        {showResults[poll.id] ? 'Hide Results' : 'Final Results'} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Card */}
            <div className="bg-brand-green p-8 rounded-none text-white">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Suggest a Poll</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-6 font-medium">
                Have a question you think the movement needs to answer? Submit your proposal for a new opinion poll.
              </p>
              <Button className="w-full bg-white text-brand-green hover:bg-stone-50 rounded-none font-bold text-xs uppercase tracking-widest">
                Submit Proposal
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
