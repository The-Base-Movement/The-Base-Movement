import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { chapterService } from '@/services/chapterService'
import type { Chapter } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import { ChapterHubHeader } from './chapterhub/ChapterHubHeader'
import { ChapterHubKPIs } from './chapterhub/ChapterHubKPIs'
import { ChapterHubTabs } from './chapterhub/ChapterHubTabs'
import { MembersTab } from './chapterhub/MembersTab'
import { DonationsTab } from './chapterhub/DonationsTab'
import { BoardTab } from './chapterhub/BoardTab'
import { ActivitiesTab } from './chapterhub/ActivitiesTab'
import { RequestsTab } from './chapterhub/RequestsTab'
import { SettingsTab } from './chapterhub/SettingsTab'
import { Skeleton } from '@/components/states'
import { isVerifiedDonation, sumDonationAmounts } from '@/services/donationCalculations'
import { diasporaSlug, matchesChapterSlug } from '@/lib/diaspora'

interface ChapterMember {
  authId: string
  regNo: string
  name: string
  phone: string
  region: string
  constituency: string
  status: string
  joined: string
  avatarUrl?: string
}

interface ChapterDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}

interface ChapterAnnouncement {
  id: string
  chapter_id: string
  content: string
  author_name: string
  created_at: string
}

export default function ChapterHub() {
  const { chapterId } = useParams<{ chapterId?: string }>()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [members, setMembers] = useState<ChapterMember[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [announcements, setAnnouncements] = useState<ChapterAnnouncement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'members' | 'donations' | 'board' | 'activities' | 'settings' | 'requests'
  >('members')
  const [joinRequests, setJoinRequests] = useState<
    Awaited<ReturnType<typeof chapterService.getChapterRequests>>
  >([])
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [leaderName, setLeaderName] = useState('')
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string | null>(null)

  const [memberSearch, setMemberSearch] = useState('')

  const [emailDraft, setEmailDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [focusTags, setFocusTags] = useState<string[]>([])
  const [focusInput, setFocusInput] = useState('')

  const [announceDraft, setAnnounceDraft] = useState('')
  const [isPostingAnnounce, setIsPostingAnnounce] = useState(false)

  const [activities, setActivities] = useState<
    { id: string; title: string; description: string | null; type: string; activity_date: string }[]
  >([])
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actType, setActType] = useState('Event')
  const [actDate, setActDate] = useState('')
  const [isSavingActivity, setIsSavingActivity] = useState(false)
  const [actFilter, setActFilter] = useState<string>('All')

  useEffect(() => {
    async function load() {
      if (!session?.user) {
        setIsLoading(false)
        return
      }
      const userId = session.user.id

      const chapters = await adminService.getChapters()
      let mine: Chapter | undefined

      if (chapterId) {
        mine = chapters.find((c) => c.id === chapterId)
        if (!mine) {
          mine = chapters.find((c) => matchesChapterSlug(c.name, chapterId))
        }
      }

      // Fallback 1: Chapter user leads (direct, name, or custom role match)
      if (!mine) {
        const leadChapterName = await adminService.getLeadChapter(userId)
        if (leadChapterName) {
          mine = chapters.find((c) => c.name.toLowerCase() === leadChapterName.toLowerCase())
        }
      }

      // Fallback 2: Chapter user joined as a member
      if (!mine) {
        const userChapterName = await adminService.getUserChapter(userId)
        if (userChapterName) {
          mine = chapters.find((c) => c.name.toLowerCase() === userChapterName.toLowerCase())
        }
      }

      // Fetch logged-in user profile info for posts/announcements
      const { data: ud } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      if (ud?.full_name) setLeaderName(ud.full_name)
      if (ud?.avatar_url) setLeaderAvatarUrl(ud.avatar_url)

      if (!mine) {
        setIsLoading(false)
        return
      }
      setChapter(mine)
      setEmailDraft(mine.email || '')
      setPhoneDraft(mine.phone_number || '')
      setDescDraft(mine.description || '')
      setFocusTags(
        mine.local_focus
          ? mine.local_focus
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : []
      )

      const { data: memberData } = await supabase
        .from('users')
        .select(
          'id, registration_number, full_name, phone_number, region, constituency, status, joined_at, avatar_url'
        )
        .eq('chapter', mine.name)
        .order('joined_at', { ascending: false })

      setMembers(
        (memberData || []).map((u) => ({
          authId: u.id,
          regNo: u.registration_number,
          name: u.full_name,
          phone: u.phone_number || 'N/A',
          region: u.region || 'N/A',
          constituency: u.constituency || 'N/A',
          status: u.status,
          joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-GB') : 'N/A',
          avatarUrl: u.avatar_url || undefined,
        }))
      )

      const memberIds = (memberData || []).map((u) => u.id)
      if (memberIds.length > 0) {
        const { data: donationData } = await supabase
          .from('donations')
          .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
          .in('member_id', memberIds)
          .order('created_at', { ascending: false })
        setDonations(donationData || [])
      }

      const { data: announceData } = await supabase
        .from('chapter_announcements')
        .select('*')
        .eq('chapter_id', mine.id)
        .order('created_at', { ascending: false })
      setAnnouncements(announceData || [])

      const { data: actData } = await supabase
        .from('chapter_activities')
        .select('id, title, description, type, activity_date')
        .eq('chapter_id', mine.id)
        .order('activity_date', { ascending: false })
      setActivities(actData || [])

      const requests = await chapterService.getChapterRequests(mine.id)
      setJoinRequests(requests)

      // Check if user is chapter lead or official
      const isLeader = mine.leader_id === userId
      const userName = ud?.full_name?.toLowerCase().trim() ?? ''
      const isLeaderByName = mine.leader_name && mine.leader_name.toLowerCase().trim() === userName

      // chapter_leaders (officials) check
      const { data: ledRow } = await supabase
        .from('chapter_leaders')
        .select('id')
        .eq('chapter_id', mine.id)
        .ilike('name', ud?.full_name ?? '')
        .maybeSingle()
      const isOfficialByName = !!ledRow

      // Admin check
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle()
      const isAdmin = !!adminData

      const isAuthorizedOfficial = isLeader || isLeaderByName || isOfficialByName || isAdmin
      setIsAuthorized(isAuthorizedOfficial)

      setIsLoading(false)
    }
    load()
  }, [chapterId, session])

  const handleApproveRequest = async (requestId: string, memberId: string) => {
    if (!chapter) return
    setProcessingRequestId(requestId)
    const ok = await chapterService.approveJoinRequest(requestId, memberId, chapter.name)
    setProcessingRequestId(null)
    if (ok) {
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success('Member approved and added to your diaspora community.')
    } else {
      toast.error('Failed to approve request.')
    }
  }

  const handleRejectRequest = async (requestId: string, memberId: string) => {
    if (!chapter) return
    setProcessingRequestId(requestId)
    const ok = await chapterService.rejectJoinRequest(requestId, memberId, chapter.name)
    setProcessingRequestId(null)
    if (ok) {
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success('Request declined. Member has been notified.')
    } else {
      toast.error('Failed to decline request.')
    }
  }

  const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Approved').length
  const pendingCount = members.filter((m) => m.status === 'Pending').length
  const totalDonated = sumDonationAmounts(donations.filter(isVerifiedDonation))
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase()
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.regNo.toLowerCase().includes(q) ||
      m.phone.includes(q)
    )
  })
  const slug = chapter ? diasporaSlug(chapter.name) : ''

  const handleSaveContact = async () => {
    if (!chapter) return
    setIsSavingContact(true)
    const ok = await chapterService.updateChapter(chapter.id, {
      email: emailDraft,
      phone_number: phoneDraft,
    })
    setIsSavingContact(false)
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success('Contact info updated.')
    } else {
      toast.error('Failed to update contact info.')
    }
  }

  const handleSaveDetails = async () => {
    if (!chapter) return
    setIsSavingDetails(true)
    const ok = await chapterService.updateChapter(chapter.id, {
      description: descDraft,
      local_focus: focusTags.join(', '),
    })
    setIsSavingDetails(false)
    if (ok) {
      setChapter((prev) =>
        prev ? { ...prev, description: descDraft, local_focus: focusTags.join(', ') } : prev
      )
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success('Diaspora profile updated.')
    } else {
      toast.error('Failed to save changes.')
    }
  }

  const handleAddFocusTag = () => {
    const tag = focusInput.trim()
    if (!tag || focusTags.includes(tag)) {
      setFocusInput('')
      return
    }
    setFocusTags((prev) => [...prev, tag])
    setFocusInput('')
  }

  const handleRemoveFocusTag = (tag: string) => {
    setFocusTags((prev) => prev.filter((t) => t !== tag))
  }

  const handlePostAnnouncement = async () => {
    if (!chapter || !announceDraft.trim()) return
    setIsPostingAnnounce(true)
    try {
      const updated = await chapterService.postAnnouncement(
        chapter.id,
        announceDraft.trim(),
        leaderName || chapter.leader_name
      )
      setAnnouncements(updated)
      setAnnounceDraft('')
      toast.success('Update posted to members.')

      const memberIds = members.map((m) => m.authId).filter(Boolean)
      if (memberIds.length > 0) {
        supabase.functions
          .invoke('send-push-notification', {
            body: {
              userIds: memberIds,
              title: `${chapter.name} — new announcement`,
              body: announceDraft.trim().slice(0, 100),
              url: '/dashboard/chapter-hub',
            },
          })
          .catch(console.error)
      }
    } catch {
      toast.error('Failed to post update.')
    } finally {
      setIsPostingAnnounce(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await chapterService.deleteAnnouncement(id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch {
      toast.error('Failed to delete update.')
    }
  }

  const handleAddActivity = async () => {
    if (!chapter || !actTitle.trim() || !actDate) {
      toast.error('Title and date are required.')
      return
    }
    setIsSavingActivity(true)
    try {
      const updated = await chapterService.addActivity(
        chapter.id,
        actTitle.trim(),
        actType,
        actDate,
        actDesc.trim() || undefined
      )
      setActivities(updated)
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      setActTitle('')
      setActDesc('')
      setActType('Event')
      setActDate('')
      setShowActivityForm(false)
      toast.success('Activity added.')
    } catch {
      toast.error('Failed to add activity.')
    } finally {
      setIsSavingActivity(false)
    }
  }

  const handleDeleteActivity = async (id: string) => {
    try {
      await chapterService.deleteActivity(id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    } catch {
      toast.error('Failed to remove activity.')
    }
  }

  if (isLoading) {
    return (
      <div className="main">
        <div className="kpis">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'hsl(var(--border))',
                }}
              />
              <Skeleton variant="text-sm" width={80} style={{ marginBottom: 10 }} />
              <Skeleton variant="text-xl" width={60} />
            </div>
          ))}
        </div>
      </div>
    )
  }

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
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
          >
            account_balance
          </span>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No chapter assigned
          </h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>
            You have not been appointed as a chapter leader yet.
          </p>
          <Link to="/dashboard/chapters" className="btn btn-outline">
            View all chapters
          </Link>
        </div>
      </div>
    )
  }

  const TABS = [
    { key: 'members' as const, label: `Members (${members.length})` },
    { key: 'donations' as const, label: `Donations (${donations.length})` },
    { key: 'board' as const, label: `Board (${announcements.length})` },
    { key: 'activities' as const, label: `Activities (${activities.length})` },
    {
      key: 'requests' as const,
      label: joinRequests.length > 0 ? `Requests (${joinRequests.length})` : 'Requests',
    },
    { key: 'settings' as const, label: 'Settings' },
  ]

  // ── render ────────────────────────────────────────────────────────────────

  if (!isAuthorized) {
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
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
          >
            lock
          </span>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 18,
              color: 'hsl(var(--on-surface))',
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Access Restricted
          </h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>
            This dashboard is restricted to chapter leads and officials only.
          </p>
          <Link to="/dashboard/chapters" className="btn btn-outline">
            Back to chapters
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <ChapterHubHeader chapter={chapter} slug={slug} />

      <ChapterHubKPIs
        totalMembers={members.length}
        activeCount={activeCount}
        pendingCount={pendingCount}
        totalDonated={totalDonated}
      />

      <ChapterHubTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'members' && (
        <MembersTab
          members={members}
          filteredMembers={filteredMembers}
          memberSearch={memberSearch}
          onSearchChange={setMemberSearch}
        />
      )}

      {activeTab === 'donations' && (
        <DonationsTab donations={donations} chapterName={chapter?.name} />
      )}

      {activeTab === 'board' && (
        <BoardTab
          announcements={announcements}
          announceDraft={announceDraft}
          isPostingAnnounce={isPostingAnnounce}
          leaderAvatarUrl={leaderAvatarUrl}
          onDraftChange={setAnnounceDraft}
          onPost={handlePostAnnouncement}
          onDelete={handleDeleteAnnouncement}
        />
      )}

      {activeTab === 'activities' && (
        <ActivitiesTab
          activities={activities}
          showActivityForm={showActivityForm}
          actTitle={actTitle}
          actDesc={actDesc}
          actType={actType}
          actDate={actDate}
          actFilter={actFilter}
          isSavingActivity={isSavingActivity}
          onShowForm={() => setShowActivityForm(true)}
          onHideForm={() => setShowActivityForm(false)}
          onTitleChange={setActTitle}
          onDescChange={setActDesc}
          onTypeChange={setActType}
          onDateChange={setActDate}
          onFilterChange={setActFilter}
          onAddActivity={handleAddActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      )}

      {activeTab === 'requests' && (
        <RequestsTab
          joinRequests={joinRequests}
          processingRequestId={processingRequestId}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          descDraft={descDraft}
          focusTags={focusTags}
          focusInput={focusInput}
          isSavingDetails={isSavingDetails}
          emailDraft={emailDraft}
          phoneDraft={phoneDraft}
          isSavingContact={isSavingContact}
          onDescChange={setDescDraft}
          onFocusInputChange={setFocusInput}
          onAddFocusTag={handleAddFocusTag}
          onRemoveFocusTag={handleRemoveFocusTag}
          onSaveDetails={handleSaveDetails}
          onEmailChange={setEmailDraft}
          onPhoneChange={setPhoneDraft}
          onSaveContact={handleSaveContact}
        />
      )}
    </div>
  )
}
