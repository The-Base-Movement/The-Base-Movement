import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { OpinionPollCard } from '@/components/OpinionPollCard'
import { adminService } from '@/services/adminService'
import type { Poll, PollOption } from '@/types/admin'
import { toast } from 'sonner'
import { useIsClient } from '@/hooks/useIsClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'

export default function Polls() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const bodyFont = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const isClient = useIsClient()
  const isLoggedIn = isClient && typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true'

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
      toast.success('Your vote has been officially recorded.')
    } else {
      toast.error('Failed to submit vote. Please try again.')
    }
    setVoting(null)
  }

  const activePolls = polls.filter(p => p.status === 'Active')
  const closedPolls = polls.filter(p => p.status === 'Closed')
  const totalVotes = polls.reduce((acc, p) => acc + p.totalVotes, 0)

  const content = (
    <>
      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          { label: 'Active polls', value: loading ? '—' : activePolls.length, sub: 'Open for voting', bar: 'hsl(var(--primary))', icon: 'how_to_vote' },
          { label: 'Total responses', value: loading ? '—' : totalVotes.toLocaleString(), sub: 'Across all polls', bar: 'hsl(var(--accent))', icon: 'group' },
          { label: 'Closed polls', value: loading ? '—' : closedPolls.length, sub: 'Results available', bar: 'hsl(var(--on-surface))', icon: 'lock' },
          { label: 'Your votes', value: loading ? '—' : polls.filter(p => p.voted).length, sub: 'Participation count', bar: 'hsl(var(--destructive))', icon: 'verified' },
        ].map(kpi => (
          <div key={kpi.label} className="panel" style={{ padding: isDashboard ? '16px 18px 16px 22px' : '20px 22px 20px 26px', position: 'relative', overflow: 'hidden', background: isDashboard ? undefined : 'hsl(var(--background))' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: isDashboard ? 3 : 4, background: kpi.bar }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: isDashboard ? 10 : 12, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: isDashboard ? 16 : 20, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: isDashboard ? 28 : 36, color: 'hsl(var(--on-surface))', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{kpi.value}</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: isDashboard ? 11 : 13, color: 'hsl(var(--on-surface-muted))' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="sidebar-main" style={{ alignItems: 'start' }}>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Movement voice panel */}
          <div style={{ background: '#181d19', borderRadius: 6, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: 12, top: 12, fontSize: 56, color: '#fff', opacity: 0.05, pointerEvents: 'none' }}>how_to_vote</span>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Movement voice</div>
            <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: isDashboard ? 12 : 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 16px' }}>
              Poll results are presented to the National Steering Committee every month to influence movement strategy.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 12 }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Total votes</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1 }}>{totalVotes.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 12 }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Active polls</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1 }}>{activePolls.length}</div>
              </div>
            </div>
          </div>

          {/* Closed polls */}
          <div className="panel">
            <div className="ph">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}>lock</span>
                Closed polls
              </span>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              {closedPolls.length === 0 ? (
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>No closed polls yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {closedPolls.map((poll, i) => (
                    <div key={poll.id} style={{ paddingTop: 14, paddingBottom: 14, borderBottom: i < closedPolls.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--destructive))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {poll.category} · Closed
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--on-surface))', margin: '0 0 8px', lineHeight: 1.35 }}>{poll.question}</p>

                      {showResults[poll.id] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                          {(() => {
                            const sorted = [...poll.options].sort((a, b) => b.votes - a.votes)
                            return poll.options.map((option: PollOption) => {
                              const pct = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
                              const rank = sorted.findIndex(o => o.id === option.id)
                              const bg = rank === 0 ? 'rgba(0,107,63,0.1)' : rank === 1 ? 'rgba(212,160,23,0.1)' : 'rgba(0,0,0,0.04)'
                              return (
                                <div key={option.id} style={{ position: 'relative', padding: '6px 10px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: bg }} />
                                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface))' }}>{option.label}</span>
                                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{pct}%</span>
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{poll.totalVotes.toLocaleString()} responses</span>
                        <button
                          onClick={() => toggleResults(poll.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))' }}
                        >
                          {showResults[poll.id] ? 'Hide results' : 'Final results'}
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Suggest a poll */}
          <div style={{ background: 'hsl(var(--primary))', borderRadius: 6, padding: 20 }}>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 8 }}>Suggest a poll</div>
            <p style={{ fontFamily: bodyFont, fontWeight: 500, fontSize: isDashboard ? 12 : 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 14px' }}>
              Have a question you think the movement needs to answer? Submit your proposal.
            </p>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', background: '#fff', color: 'hsl(var(--primary))', borderColor: 'transparent' }}>
              Submit proposal
            </button>
          </div>

        </div>

        {/* Main: active polls */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>schedule</span>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: isDashboard ? 13 : 16, color: 'hsl(var(--on-surface))' }}>Active feedback</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 200, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : activePolls.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>how_to_vote</span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>No active polls at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activePolls.map(poll => (
                <OpinionPollCard
                  key={poll.id}
                  poll={poll}
                  voting={voting}
                  showResults={!!showResults[poll.id]}
                  isLoggedIn={isLoggedIn}
                  handleVote={handleVote}
                  toggleResults={toggleResults}
                  variant={isDashboard ? undefined : 'public'}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )

  if (isDashboard) {
    return <div className="main">{content}</div>
  }

  return (
    <main className="bg-stone-50/50 min-h-screen font-meta pb-20">
      <SEO
        title="Polls & Feedback"
        description="Your voice shapes movement strategy. Participate in active polls and see how other members think."
        canonical="/polls"
      />
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 40 }}>how_to_vote</span>
              Polls & Feedback
            </h1>
            <div className="bl"><div /><div /><div /></div>
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Your voice shapes movement strategy. Participate in active polls and see how other members think.
            </p>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {content}
      </div>
    </main>
  )
}
