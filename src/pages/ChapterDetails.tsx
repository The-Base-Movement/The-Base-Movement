import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'
import type { Chapter, ChapterLeader, Member } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { LoadingScreen } from '../components/LoadingScreen'
import { adminService } from '@/services/adminService'
import { chapterService } from '@/services/chapterService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { LeaderBanner } from './chapterdetails/LeaderBanner'
import { ChapterHeader } from './chapterdetails/ChapterHeader'
import { AboutPanel } from './chapterdetails/AboutPanel'
import { PollsSection } from './chapterdetails/PollsSection'
import type { ChapterPoll } from './chapterdetails/PollsSection'
import { AnnouncementsPanel } from './chapterdetails/AnnouncementsPanel'
import type { ChapterAnnouncement } from './chapterdetails/AnnouncementsPanel'
import { ActivitiesPanel } from './chapterdetails/ActivitiesPanel'
import { LeadershipSidebar } from './chapterdetails/LeadershipSidebar'
import { LeaderProfileModal } from './chapterdetails/LeaderProfileModal'

export default function ChapterDetails() {
  const { slug } = useParams<{ slug: string }>()
  const { chapters, isLoading } = useChapters()
  const { user } = useAuth()
  const authUserId = user?.id ?? null
  const chapter: Chapter | undefined = chapters.find(
    (c) =>
      c.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') === slug
  )
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [joinRequestStatus, setJoinRequestStatus] = useState<
    'pending' | 'approved' | 'rejected' | null
  >(null)
  const [leaderProfile, setLeaderProfile] = useState<Member | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [polls, setPolls] = useState<ChapterPoll[]>([])
  const [announcements, setAnnouncements] = useState<ChapterAnnouncement[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [votingPollId, setVotingPollId] = useState<string | null>(null)

  // Check chapter membership and any existing join request
  useEffect(() => {
    if (!authUserId || !chapter) return
    adminService.getUserChapter(authUserId).then((ch) => {
      if (ch && ch.toLowerCase() === chapter.name.toLowerCase()) setHasJoined(true)
    })
    chapterService.getMyJoinRequest(chapter.id).then((status) => {
      setJoinRequestStatus(status)
    })
  }, [authUserId, chapter])

  // Determine whether current user can access chapter management (leader or secretary)
  useEffect(() => {
    if (!authUserId || !chapter) return
    let cancelled = false
    async function check() {
      // 1. Direct DB check via leader_id column
      const { data: byId } = await supabase
        .from('chapters')
        .select('id')
        .eq('id', chapter!.id)
        .eq('leader_id', authUserId!)
        .maybeSingle()
      if (cancelled) return
      if (byId) {
        setIsLeader(true)
        return
      }

      // 2. Fetch user's full name
      const { data: u } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', authUserId!)
        .maybeSingle()
      if (cancelled || !u?.full_name) return
      const name = u.full_name.toLowerCase().trim()

      // 3. Leader name match
      if (chapter!.leader_name && chapter!.leader_name.toLowerCase().trim() === name) {
        setIsLeader(true)
        return
      }

      // 4. Any chapter_leaders row for this chapter matching the user's name
      const { data: ledRow } = await supabase
        .from('chapter_leaders')
        .select('id')
        .eq('chapter_id', chapter!.id)
        .ilike('name', u.full_name)
        .maybeSingle()
      if (cancelled) return
      if (ledRow) {
        setIsLeader(true)
        return
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [authUserId, chapter])

  // Fetch leader avatar
  useEffect(() => {
    if (!chapter?.leader_id) return
    supabase
      .from('users')
      .select('avatar_url')
      .eq('id', chapter.leader_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setLeaderAvatarUrl(data.avatar_url)
      })
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
        const pollIds = pollData.map((p) => p.id)
        const { data: votes } = await supabase
          .from('chapter_poll_votes')
          .select('poll_id, candidate_id, voter_id')
          .in('poll_id', pollIds)
        if (votes) {
          const counts: Record<string, number> = {}
          votes.forEach((v) => {
            counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1
          })
          setVoteCounts(counts)
          if (authUserId) {
            const myVotes: Record<string, string> = {}
            votes
              .filter((v) => v.voter_id === authUserId)
              .forEach((v) => {
                myVotes[v.poll_id] = v.candidate_id
              })
            setUserVotes(myVotes)
          }
        }
      })
  }, [chapter?.id, authUserId])

  // Fetch announcements for this chapter
  useEffect(() => {
    if (!chapter?.id) return
    supabase
      .from('chapter_announcements')
      .select('id, content, author_name, created_at')
      .eq('chapter_id', chapter.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data?.length) setAnnouncements(data as ChapterAnnouncement[])
      })
  }, [chapter?.id])

  const handleVote = async (pollId: string, candidateId: string) => {
    if (!authUserId) {
      toast.error('Please log in to vote.')
      return
    }
    if (userVotes[pollId]) {
      toast.error('You have already voted in this poll.')
      return
    }
    setVotingPollId(pollId)
    const { error } = await supabase
      .from('chapter_poll_votes')
      .insert({ poll_id: pollId, candidate_id: candidateId, voter_id: authUserId })
    setVotingPollId(null)
    if (error) {
      toast.error(
        error.code === '23505' ? 'You have already voted in this poll.' : 'Failed to submit vote.'
      )
      return
    }
    setUserVotes((prev) => ({ ...prev, [pollId]: candidateId }))
    setVoteCounts((prev) => ({ ...prev, [candidateId]: (prev[candidateId] || 0) + 1 }))
    toast.success('Your vote has been recorded.')
  }

  const handleJoin = async () => {
    if (!authUserId) {
      toast.error('Please register or login to join.')
      return
    }
    if (!chapter) return
    if (hasJoined || joinRequestStatus === 'approved') {
      toast(`You are already a member of ${chapter.name}`)
      return
    }
    if (joinRequestStatus === 'pending') {
      toast('Your request is already pending approval.')
      return
    }
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

  const handleViewLeaderProfile = async () => {
    if (!chapter?.leader_id) return
    const { data } = await supabase
      .from('users')
      .select(
        'registration_number, full_name, phone_number, region, constituency, country, status, platform, profession, avatar_url, joined_at'
      )
      .eq('id', chapter.leader_id)
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
  }

  if (isLoading) return <LoadingScreen />

  if (!chapter) {
    return (
      <div
        className="main"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: 'hsl(var(--on-surface))',
              marginBottom: 16,
            }}
          >
            Chapter not found
          </h2>
          <Link to="/dashboard/chapters" className="btn btn-primary">
            Back to chapters
          </Link>
        </div>
      </div>
    )
  }

  const isActive = chapter.status === 'Active' || chapter.status === 'Member'
  const chapterSlug = chapter.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  return (
    <div className="main">
      {isLeader && <LeaderBanner chapterSlug={chapterSlug} />}

      <ChapterHeader
        name={chapter.name}
        status={chapter.status}
        isActive={isActive}
        city_or_region={chapter.city_or_region}
        country={chapter.country}
        member_count={chapter.member_count}
        isJoining={isJoining}
        hasJoined={hasJoined}
        joinRequestStatus={joinRequestStatus}
        onShare={() => setIsShareModalOpen(true)}
        onJoin={handleJoin}
      />

      <div className="main-sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AboutPanel
            name={chapter.name}
            description={chapter.description ?? ''}
            city_or_region={chapter.city_or_region}
            local_focus={chapter.local_focus}
            meeting_schedule={chapter.meeting_schedule}
          />

          <PollsSection
            polls={polls}
            voteCounts={voteCounts}
            userVotes={userVotes}
            votingPollId={votingPollId}
            onVote={handleVote}
          />

          <AnnouncementsPanel announcements={announcements} leaderAvatarUrl={leaderAvatarUrl} />

          <ActivitiesPanel activities={chapter.activities} />
        </div>

        <LeadershipSidebar
          chapterSlug={chapterSlug}
          city_or_region={chapter.city_or_region}
          leader_name={chapter.leader_name}
          leader_id={chapter.leader_id ?? ''}
          leadership={chapter.leadership as ChapterLeader[] | undefined}
          leaderAvatarUrl={leaderAvatarUrl}
          isLeader={isLeader}
          email={chapter.email}
          phone_number={chapter.phone_number}
          onViewLeaderProfile={handleViewLeaderProfile}
        />
      </div>

      {isProfileOpen && leaderProfile && (
        <LeaderProfileModal
          leaderProfile={leaderProfile}
          chapterName={chapter.name}
          chapterCityOrRegion={chapter.city_or_region}
          onClose={() => setIsProfileOpen(false)}
        />
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
