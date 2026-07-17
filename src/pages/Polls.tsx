import { useState, useEffect } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { EmptyState } from '@/components/states'
import { useLocation } from 'react-router-dom'
import { OpinionPollCard } from '@/components/OpinionPollCard'
import type { Poll, PollOption } from '@/types/admin'
import { toast } from 'sonner'
import { useIsClient } from '@/hooks/useIsClient'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'
import { pollService } from '@/services/pollService'

import { PollKPIs } from './polls/components/PollKPIs'
import { ClosedPollsPanel } from './polls/components/ClosedPollsPanel'
import { PollsSidebar } from './polls/components/PollsSidebar'
import { SearchBar } from '@/components/SearchBar'

export default function Polls() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const bodyFont = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const isClient = useIsClient()
  const isLoggedIn =
    isClient && typeof window !== 'undefined' && sessionStore.getItem('isLoggedIn') === 'true'

  useEffect(() => {
    async function loadPolls() {
      try {
        const data = await pollService.getPolls()
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
    const success = await pollService.voteInPoll(pollId, optionId)
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

  const q = searchQuery.trim().toLowerCase()
  const activePolls = polls.filter(
    (p) =>
      p.status === 'Active' &&
      (!q || p.question.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
  )
  const closedPolls = polls.filter((p) => p.status === 'Closed')
  const totalVotes = polls.reduce((acc, p) => acc + p.totalVotes, 0)

  const content = (
    <>
      {isDashboard && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 500,
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
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 20,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Polls &amp; Feedback
          </h2>
        </div>
      )}

      <PollKPIs
        loading={loading}
        activePolls={activePolls}
        closedPolls={closedPolls}
        totalVotes={totalVotes}
        polls={polls}
        isDashboard={isDashboard}
      />

      <div className="main-sidebar" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search polls…"
            variant={isDashboard ? 'dashboard' : 'public'}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              schedule
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
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
            <EmptyState
              icon={searchQuery ? 'search_off' : 'how_to_vote'}
              title={searchQuery ? `No results for "${searchQuery}"` : 'No active polls.'}
              body={
                searchQuery
                  ? 'Try a different search term.'
                  : 'Open polls from your chapter will appear here.'
              }
            />
          ) : (
            activePolls.map((poll) => (
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
            ))
          )}

          <div className="mobile-only">
            <ClosedPollsPanel
              closedPolls={closedPolls}
              showResults={showResults}
              toggleResults={toggleResults}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PollsSidebar
            totalVotes={totalVotes}
            activePollsCount={activePolls.length}
            isDashboard={isDashboard}
            bodyFont={bodyFont}
          />
          <div className="desktop-only">
            <ClosedPollsPanel
              closedPolls={closedPolls}
              showResults={showResults}
              toggleResults={toggleResults}
            />
          </div>
        </div>
      </div>
    </>
  )

  if (isDashboard) {
    return <div className="main">{content}</div>
  }

  return (
    <main
      className="min-h-screen font-meta pb-20"
      style={{ background: 'hsl(var(--container-low))' }}
    >
      <SEO
        title="Polls & Feedback"
        description="Your voice shapes movement strategy. Participate in active polls and see how other members think."
        canonical="/polls"
      />

      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #181d19 0%, #0e1510 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '-5%',
            width: '55%',
            height: '220%',
            background:
              'radial-gradient(ellipse at center, rgba(0,107,63,0.22) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/noise.png')",
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        />
        <div
          className="max-w-7xl mx-auto px-4 md:px-8"
          style={{ paddingTop: 40, paddingBottom: 40, position: 'relative', zIndex: 1 }}
        >
          <Breadcrumbs variant="dark" />
          <div style={{ maxWidth: 640 }}>
            <span
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'hsl(var(--accent))',
                marginBottom: 14,
              }}
            >
              Member Participation
            </span>
            <h1
              style={{
                color: '#fff',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                letterSpacing: '-0.05em',
                lineHeight: 1.05,
                margin: '0 0 16px',
              }}
            >
              Polls &amp; Feedback
            </h1>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 520,
              }}
            >
              Your voice shapes movement strategy. Participate in active polls and see how other
              members think.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', height: 4 }}>
          <div style={{ flex: 1, background: 'var(--brand-red)' }} />
          <div style={{ flex: 1, background: 'var(--brand-gold)' }} />
          <div style={{ flex: 1, background: 'var(--brand-green)' }} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">{content}</div>
    </main>
  )
}
