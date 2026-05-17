import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'
import type { Chapter, ChapterLeader, ChapterActivity, Member } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { LoadingScreen } from '../components/LoadingScreen'
import { adminService } from '@/services/adminService'
import { chapterService } from '@/services/chapterService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface ChapterPoll {
  id: string
  title: string
  description: string | null
  ends_at: string
  created_at: string
  banner_url: string | null
  chapter_poll_candidates: { id: string; name: string; position: string | null; avatar_url: string | null }[]
}

export default function ChapterDetails() {
  const { slug } = useParams<{ slug: string }>()
  const { chapters, isLoading } = useChapters()
  const { session } = useAuth()
  const chapter: Chapter | undefined = chapters.find(
    c => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === slug
  )
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [joinRequestStatus, setJoinRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [leaderProfile, setLeaderProfile] = useState<Member | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const authUserId = session?.user?.id || null
  const [polls, setPolls] = useState<ChapterPoll[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [votingPollId, setVotingPollId] = useState<string | null>(null)

  // Check chapter membership and any existing join request
  useEffect(() => {
    if (!authUserId || !chapter) return
    adminService.getUserChapter(authUserId).then(ch => {
      if (ch && ch.toLowerCase() === chapter.name.toLowerCase()) setHasJoined(true)
    })
    chapterService.getMyJoinRequest(chapter.id).then(status => {
      setJoinRequestStatus(status)
    })
  }, [authUserId, chapter])

  // Determine leadership — query DB directly so it matches the same source DashboardLayout uses
  useEffect(() => {
    if (!authUserId || !chapter) return
    // 1. Direct DB check: is there a chapter row with this id AND leader_id = current user?
    supabase.from('chapters')
      .select('id')
      .eq('id', chapter.id)
      .eq('leader_id', authUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setIsLeader(true); return }
        // 2. Fallback: name match (chapters appointed before leader_id column existed)
        if (!chapter.leader_name) return
        supabase.from('users').select('full_name').eq('id', authUserId).maybeSingle()
          .then(({ data: u }) => {
            if (u?.full_name && u.full_name.toLowerCase().trim() === chapter.leader_name.toLowerCase().trim()) {
              setIsLeader(true)
            }
          })
      })
  }, [authUserId, chapter])

  // Fetch leader avatar
  useEffect(() => {
    if (!chapter?.leader_id) return
    supabase.from('users').select('avatar_url').eq('id', chapter.leader_id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_url) setLeaderAvatarUrl(data.avatar_url) })
  }, [chapter?.leader_id])

  // Fetch polls for this chapter
  useEffect(() => {
    if (!chapter?.id) return
    supabase
      .from('chapter_polls')
      .select('*, chapter_poll_candidates(*)')
      .eq('chapter_id', chapter.id)
      .order('created_at', { ascending: false })
      .then(async ({ data: pollData }) => {
        if (!pollData?.length) return
        setPolls(pollData as ChapterPoll[])
        const pollIds = pollData.map(p => p.id)
        const { data: votes } = await supabase.from('chapter_poll_votes').select('poll_id, candidate_id, voter_id').in('poll_id', pollIds)
        if (votes) {
          const counts: Record<string, number> = {}
          votes.forEach(v => { counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1 })
          setVoteCounts(counts)
          if (authUserId) {
            const myVotes: Record<string, string> = {}
            votes.filter(v => v.voter_id === authUserId).forEach(v => { myVotes[v.poll_id] = v.candidate_id })
            setUserVotes(myVotes)
          }
        }
      })
  }, [chapter?.id, authUserId])

  const handleVote = async (pollId: string, candidateId: string) => {
    if (!authUserId) { toast.error('Please log in to vote.'); return }
    if (userVotes[pollId]) { toast.error('You have already voted in this poll.'); return }
    setVotingPollId(pollId)
    const { error } = await supabase.from('chapter_poll_votes').insert({ poll_id: pollId, candidate_id: candidateId, voter_id: authUserId })
    setVotingPollId(null)
    if (error) {
      toast.error(error.code === '23505' ? 'You have already voted in this poll.' : 'Failed to submit vote.')
      return
    }
    setUserVotes(prev => ({ ...prev, [pollId]: candidateId }))
    setVoteCounts(prev => ({ ...prev, [candidateId]: (prev[candidateId] || 0) + 1 }))
    toast.success('Your vote has been recorded.')
  }


  const handleJoin = async () => {
    if (!authUserId) { toast.error('Please register or login to join.'); return }
    if (!chapter) return
    if (hasJoined || joinRequestStatus === 'approved') { toast(`You are already a member of ${chapter.name}`); return }
    if (joinRequestStatus === 'pending') { toast('Your request is already pending approval.'); return }
    setIsJoining(true)
    const { success, alreadyRequested } = await chapterService.requestToJoin(chapter.id)
    setIsJoining(false)
    if (alreadyRequested) {
      setJoinRequestStatus('pending')
      toast('Your join request is already pending.')
    } else if (success) {
      setJoinRequestStatus('pending')
      toast.success('Join request sent! The chapter leader will review it shortly.')
    } else {
      toast.error('Failed to send join request. Please try again.')
    }
  }

  if (isLoading) return <LoadingScreen />

  if (!chapter) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 22, color: 'hsl(var(--on-surface))', marginBottom: 16 }}>Chapter not found</h2>
          <Link to="/dashboard/chapters" className="btn btn-primary">Back to chapters</Link>
        </div>
      </div>
    )
  }

  const isActive = chapter.status === 'Active' || chapter.status === 'Member'

  return (
    <div className="main">
      {/* Leader management banner */}
      {isLeader && (
        <div style={{ background: 'linear-gradient(135deg, #0f1310, #1a2618)', borderRadius: 6, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(0,107,63,0.3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))', flexShrink: 0 }}>manage_accounts</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: '#fff' }}>You are the chapter leader</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Manage members, donations and chapter info.</div>
            </div>
          </div>
          <Link
            to={`/dashboard/chapter-hub/${chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0, textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
            Manage chapter
          </Link>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {isActive ? (
            <>
              <span className="pill pill-ok">Active</span>
              <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified chapter</span>
            </>
          ) : (
            <span className="pill pill-warn">{chapter.status}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {chapter.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 16px', color: 'hsl(var(--on-surface-muted))', fontSize: 13, fontWeight: 600, fontFamily: "'Public Sans', sans-serif" }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>location_on</span>
                {chapter.city_or_region}, {chapter.country}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>group</span>
                {chapter.member_count} Active members
              </span>
            </div>
          </div>
          <div className="w-full lg:w-auto" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsShareModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>share</span>
              Share
            </button>
            <button
              className={`btn btn-sm ${hasJoined || joinRequestStatus === 'approved' ? 'btn-outline' : joinRequestStatus === 'pending' ? 'btn-outline' : 'btn-primary'}`}
              style={{ flex: 1 }}
              onClick={handleJoin}
              disabled={isJoining || hasJoined || joinRequestStatus === 'pending' || joinRequestStatus === 'approved'}
            >
              {isJoining ? 'Sending request…'
                : hasJoined || joinRequestStatus === 'approved' ? 'Already a member'
                : joinRequestStatus === 'pending' ? 'Request pending…'
                : 'Request to join'}
            </button>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="main-sidebar">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* About */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>language</span>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About this chapter</span>
            </div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, fontStyle: 'italic', borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 14, marginBottom: 14 }}>
              {chapter.description}
            </p>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65 }}>
              Whether you're looking to volunteer, stay informed about local policy discussions, or connect with fellow movement members, the {chapter.name} provides the platform for meaningful civic engagement and collective action within {chapter.city_or_region}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginTop: 20 }}>
              <div style={{ padding: '14px 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Local focus</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{chapter.local_focus || 'Grassroots mobilization'}</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Meeting schedule</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{chapter.meeting_schedule || 'Contact chapter for schedule'}</div>
              </div>
            </div>
          </div>

          {/* Chapter polls */}
          {polls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {polls.map(poll => {
                const now = new Date()
                const endsAt = new Date(poll.ends_at)
                const isOpen = endsAt > now
                const myVote = userVotes[poll.id]
                const totalVotes = poll.chapter_poll_candidates.reduce((s, c) => s + (voteCounts[c.id] || 0), 0)
                return (
                  <div key={poll.id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Banner */}
                    {poll.banner_url && (
                      <img src={poll.banner_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                    )}
                    <div style={{ padding: '18px 20px' }}>
                      {/* Poll header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: isOpen ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))' }}>how_to_vote</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{poll.title}</span>
                          {poll.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 600 }}>{poll.description}</p>}
                        </div>
                        {isOpen
                          ? <span className="pill pill-ok" style={{ flexShrink: 0 }}>Open</span>
                          : <span className="pill pill-mute" style={{ flexShrink: 0 }}>Closed</span>
                        }
                      </div>

                      {isOpen && !myVote ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                            Select a candidate · Closes {endsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {poll.chapter_poll_candidates.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleVote(poll.id, c.id)}
                              disabled={votingPollId === poll.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--container-low))', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", textAlign: 'left', width: '100%', transition: 'border-color 0.15s, background 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.background = 'hsl(var(--primary) / 0.04)' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.background = 'hsl(var(--container-low))' }}
                            >
                              <div style={{ width: 38, height: 38, borderRadius: 4, background: 'hsl(var(--border))', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                                {c.avatar_url
                                  ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : c.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                }
                              </div>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))' }}>{c.name}</span>
                                {c.position && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>{c.position}</span>}
                              </div>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>radio_button_unchecked</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                            {isOpen && myVote ? 'Your vote has been recorded — results so far:' : `Final results · ${totalVotes} total vote${totalVotes !== 1 ? 's' : ''}`}
                          </p>
                          {poll.chapter_poll_candidates
                            .map(c => ({ ...c, count: voteCounts[c.id] || 0 }))
                            .sort((a, b) => b.count - a.count)
                            .map((c, i) => {
                              const pct = totalVotes > 0 ? Math.round((c.count / totalVotes) * 100) : 0
                              const isWinner = !isOpen && i === 0 && c.count > 0
                              const isMyVote = myVote === c.id
                              return (
                                <div key={c.id} style={{ border: `1px solid ${isWinner ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'}`, borderRadius: 4, padding: '10px 14px', background: isWinner ? 'hsl(var(--primary) / 0.04)' : 'hsl(var(--container-low))' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 4, background: 'hsl(var(--border))', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))' }}>
                                      {c.avatar_url
                                        ? <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : c.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                      }
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      {isWinner && <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--accent))' }}>emoji_events</span>}
                                      <span style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{c.name}</span>
                                      {c.position && <span style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>{c.position}</span>}
                                      {isMyVote && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10, background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your vote</span>}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", flexShrink: 0 }}>{pct}% · {c.count}</span>
                                  </div>
                                  <div style={{ height: 4, background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))', transition: 'width 0.6s', borderRadius: 2 }} />
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
          )}

          {/* Recent activities */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>calendar_month</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent activities</span>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', padding: 0 }}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapter.activities && chapter.activities.length > 0 ? (
                chapter.activities.map((activity: ChapterActivity, i: number) => {
                  const date = new Date(activity.activityDate)
                  const month = date.toLocaleString('en-US', { month: 'short' })
                  const day = date.getDate()
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--container-low))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", lineHeight: 1 }}>{day}</span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{activity.type}</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>chevron_right</span>
                    </div>
                  )
                })
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No recent activities recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Leadership */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>Chapter leadership</h3>

            {/* Primary leader card */}
            {chapter.leader_name ? (
              <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: '#181d19', border: '2px solid hsl(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", overflow: 'hidden' }}>
                    {leaderAvatarUrl
                      ? <img src={leaderAvatarUrl} alt={chapter.leader_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : chapter.leader_name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{chapter.leader_name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2, fontFamily: "'Public Sans', sans-serif" }}>Chapter Leader</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {chapter.leader_id && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                      onClick={async () => {
                        const { data } = await supabase
                          .from('users')
                          .select('registration_number, full_name, phone_number, region, constituency, country, status, platform, profession, avatar_url, joined_at')
                          .eq('id', chapter.leader_id!)
                          .maybeSingle()
                        if (data) {
                          setLeaderProfile({
                            id: data.registration_number,
                            authId: chapter.leader_id,
                            name: data.full_name,
                            email: '',
                            phone: data.phone_number || '',
                            region: data.region || '',
                            constituency: data.constituency || '',
                            country: data.country || '',
                            status: data.status,
                            joined: data.joined_at || '',
                            platform: data.platform === 'DIASPORA' ? 'DIASPORA' : 'GHANA',
                            type: 'Standard',
                            avatarUrl: data.avatar_url || undefined,
                            profession: data.profession || '',
                          })
                          setIsProfileOpen(true)
                        }
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                      View profile
                    </button>
                  )}
                  {isLeader && (
                    <Link
                      to={`/dashboard/chapter-hub/${chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11, textDecoration: 'none' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>manage_accounts</span>
                      Manage chapter
                    </Link>
                  )}
                </div>
              </div>
            ) : null}

            {/* Secondary leadership list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chapter.leadership && chapter.leadership.length > 0 ? (
                chapter.leadership.map((leader: ChapterLeader, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {leader.imageUrl ? (
                        <img src={leader.imageUrl} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>{leader.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{leader.name}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>{leader.role}</div>
                    </div>
                  </div>
                ))
              ) : !chapter.leader_name ? (
                <div style={{ padding: '24px 0', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leadership pending</p>
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>mail</span>
                {chapter.email || `${chapter.city_or_region.toLowerCase()}@thebasemovement.com`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>phone</span>
                {chapter.phone_number || '+233 (0) 50 123 4567'}
              </div>
            </div>
          </div>

          {/* Official verification */}
          <div style={{ background: 'hsl(var(--on-surface))', padding: 22, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.08 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 80, color: '#fff' }}>verified_user</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: "'Public Sans', sans-serif" }}>Official verification</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 16, fontFamily: "'Public Sans', sans-serif" }}>
                This chapter is officially recognized and verified by The Base National Headquarters. All activities are coordinated with the central movement agenda.
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(0,107,63,0.25)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 700, borderRadius: 4, border: '1px solid rgba(0,107,63,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
                Verified
              </span>
            </div>
          </div>

          {/* Donate to chapter */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', marginBottom: 8 }}>Support local</h3>
            <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 16, fontFamily: "'Public Sans', sans-serif" }}>
              Your donations to this specific chapter help fund local townhalls and community outreach programs in {chapter.city_or_region}.
            </p>
            <Link to="/dashboard/donate" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              Donate to chapter
            </Link>
          </div>
        </div>
      </div>

      {/* Leader profile modal */}
      {isProfileOpen && leaderProfile && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 6, border: '1px solid hsl(var(--border))', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Banner */}
            <div style={{ height: 80, background: 'hsl(var(--on-surface))', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', bottom: -24, left: 24, width: 52, height: 52, borderRadius: 4, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
                {leaderProfile.avatarUrl
                  ? <img src={leaderProfile.avatarUrl} alt={leaderProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20 }}>
                      {leaderProfile.name?.[0] || 'L'}
                    </div>
                }
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '36px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', margin: '0 0 3px' }}>
                    {leaderProfile.name}
                  </h2>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    {leaderProfile.profession || 'Chapter Leader'}
                  </div>
                </div>
                <span style={{ padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Chapter Leader
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 16px', marginBottom: 20 }}>
                {[
                  { icon: 'public', label: 'Network', value: leaderProfile.platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network' },
                  { icon: 'location_on', label: 'Location', value: leaderProfile.platform === 'GHANA' ? leaderProfile.region : leaderProfile.country },
                  { icon: 'work', label: 'Profession', value: leaderProfile.profession },
                  ...(leaderProfile.platform === 'GHANA' && leaderProfile.constituency ? [{ icon: 'how_to_reg', label: 'Constituency', value: leaderProfile.constituency }] : []),
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{row.label}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--primary))' }}>{row.icon}</span>
                      {row.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'hsl(var(--container-low))', borderRadius: 4, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, margin: 0 }}>
                  Appointed chapter leader for {chapter.name}. Responsible for coordinating local chapter activities and driving grassroots mobilization in {chapter.city_or_region}.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setIsProfileOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                  Close profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Join ${chapter.name}`}
        url={window.location.href}
      />
    </div>
  )
}
