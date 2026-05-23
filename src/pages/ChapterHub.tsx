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
          mine = chapters.find(
            (c) =>
              c.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '') === chapterId
          )
        }
      }
      if (!mine) mine = chapters.find((c) => c.leader_id === userId)

      if (!mine) {
        const { data: ud } = await supabase
          .from('users')
          .select('chapter, full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle()
        if (ud?.chapter)
          mine = chapters.find((c) => c.name.toLowerCase() === ud.chapter.toLowerCase())
        if (ud?.full_name) setLeaderName(ud.full_name)
        if (ud?.avatar_url) setLeaderAvatarUrl(ud.avatar_url)
      } else {
        const { data: ud } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', userId)
          .maybeSingle()
        if (ud?.full_name) setLeaderName(ud.full_name)
        if (ud?.avatar_url) setLeaderAvatarUrl(ud.avatar_url)
      }

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
      toast.success('Member approved and added to chapter.')
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
  const totalDonated = donations.reduce((s, d) => s + Number(d.amount), 0)
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase()
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.regNo.toLowerCase().includes(q) ||
      m.phone.includes(q)
    )
  })
  const slug = chapter
    ? chapter.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    : ''

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
      toast.success('Chapter profile updated.')
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
    const { error } = await supabase.from('chapter_announcements').insert({
      chapter_id: chapter.id,
      content: announceDraft.trim(),
      author_name: leaderName || chapter.leader_name,
    })
    setIsPostingAnnounce(false)
    if (error) {
      toast.error('Failed to post update.')
      return
    }
    const { data } = await supabase
      .from('chapter_announcements')
      .select('*')
      .eq('chapter_id', chapter.id)
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setAnnounceDraft('')
    toast.success('Update posted to members.')
  }

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('chapter_announcements').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete update.')
      return
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAddActivity = async () => {
    if (!chapter || !actTitle.trim() || !actDate) {
      toast.error('Title and date are required.')
      return
    }
    setIsSavingActivity(true)
    const { error } = await supabase.from('chapter_activities').insert({
      chapter_id: chapter.id,
      title: actTitle.trim(),
      description: actDesc.trim() || null,
      type: actType,
      activity_date: actDate,
    })
    setIsSavingActivity(false)
    if (error) {
      toast.error('Failed to add activity.')
      return
    }
    const { data } = await supabase
      .from('chapter_activities')
      .select('id, title, description, type, activity_date')
      .eq('chapter_id', chapter.id)
      .order('activity_date', { ascending: false })
    setActivities(data || [])
    queryClient.invalidateQueries({ queryKey: ['chapters'] })
    setActTitle('')
    setActDesc('')
    setActType('Event')
    setActDate('')
    setShowActivityForm(false)
    toast.success('Activity added.')
  }

  const handleDeleteActivity = async (id: string) => {
    const { error } = await supabase.from('chapter_activities').delete().eq('id', id)
    if (error) {
      toast.error('Failed to remove activity.')
      return
    }
    setActivities((prev) => prev.filter((a) => a.id !== id))
    queryClient.invalidateQueries({ queryKey: ['chapters'] })
  }

  if (isLoading) {
    return (
      <div className="main">
        <div className="kpis">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel animate-pulse" style={{ height: 80 }} />
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
              fontWeight: 700,
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

      {activeTab === 'donations' && <DonationsTab donations={donations} />}

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
