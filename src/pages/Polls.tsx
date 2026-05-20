import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { OpinionPollCard } from '@/components/OpinionPollCard'
import { adminService } from '@/services/adminService'
import type { Poll, PollOption } from '@/types/admin'
import { toast } from 'sonner'
import { useIsClient } from '@/hooks/useIsClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'

// Modular Components
import { PollKPIs } from './polls/components/PollKPIs'
import { ClosedPollsPanel } from './polls/components/ClosedPollsPanel'
import { PollsSidebar } from './polls/components/PollsSidebar'

export default function Polls() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const bodyFont = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const isClient = useIsClient()
  const isLoggedIn =
    isClient && typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true'

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
    setShowResults((prev) => ({ ...prev, [pollId]: !prev[pollId] }))
  }

  const handleVote = async (pollId: string, optionId: string) => {
    setVoting(pollId)
    const success = await adminService.voteInPoll(pollId, optionId)
    if (success) {
      setPolls((prev) =>
        prev.map((p) => {
          if (p.id === pollId) {
            return {
              ...p,
              voted: true,
              userSelection: optionId,
              totalVotes: p.totalVotes + 1,
              options: p.options.map((o: PollOption) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o
              ),
            }
          }
          return p
        })
      )
      toast.success('Your vote has been officially recorded.')
    } else {
      toast.error('Failed to submit vote. Please try again.')
    }
    setVoting(null)
  }

  const activePolls = polls.filter((p) => p.status === 'Active')
  const closedPolls = polls.filter((p) => p.status === 'Closed')
  const totalVotes = polls.reduce((acc, p) => acc + p.totalVotes, 0)

  const content = (
    <>
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              display: 'inline-block',
              animation: 'pulse 1.4s infinite',
            }}
          />
          Member participation
        </div>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 20,
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Polls &amp; Feedback
        </h2>
      </div>

      {/* KPI row */}
      <PollKPIs
        loading={loading}
        activePolls={activePolls}
        closedPolls={closedPolls}
        totalVotes={totalVotes}
        polls={polls}
        isDashboard={isDashboard}
      />

      <div className="main-sidebar" style={{ alignItems: 'start' }}>
        {/* Main: active polls */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              schedule
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: isDashboard ? 13 : 16,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Active feedback
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 200,
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              ))}
            </div>
          ) : activePolls.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--on-surface-muted))',
                  opacity: 0.3,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                how_to_vote
              </span>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                }}
              >
                No active polls at this time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activePolls.map((poll) => (
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

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PollsSidebar
            totalVotes={totalVotes}
            activePollsCount={activePolls.length}
            isDashboard={isDashboard}
            bodyFont={bodyFont}
          />

          <ClosedPollsPanel
            closedPolls={closedPolls}
            showResults={showResults}
            toggleResults={toggleResults}
          />
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
              <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 40 }}>
                how_to_vote
              </span>
              Polls & Feedback
            </h1>
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Your voice shapes movement strategy. Participate in active polls and see how other
              members think.
            </p>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">{content}</div>
    </main>
  )
}
