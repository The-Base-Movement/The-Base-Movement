import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { chapterService } from '@/services/chapterService'
import type { Chapter } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'

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

const lbl: CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

const inp: CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
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

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)
    const ok = await chapterService.rejectJoinRequest(requestId)
    setProcessingRequestId(null)
    if (ok) {
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success('Request declined.')
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
              fontWeight: 800,
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
    <div className="main animate-in fade-in duration-500">
      {/* Header */}
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              account_balance
            </span>
            {chapter.name}
          </h2>
          <div style={{ marginTop: 12 }}>
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
            }}
          >
            Chapter management hub — {chapter.city_or_region}, {chapter.country}
          </p>
        </div>
        <div className="actions">
          <Link to={`/dashboard/chapters/${slug}`} className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              visibility
            </span>
            Public view
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        {[
          { label: 'Total members', value: members.length, bar: 'hsl(var(--on-surface))' },
          { label: 'Active members', value: activeCount, bar: 'hsl(var(--primary))' },
          { label: 'Pending members', value: pendingCount, bar: 'hsl(var(--accent))' },
          {
            label: 'Total donated',
            value: `GH₵ ${totalDonated.toLocaleString()}`,
            bar: 'hsl(var(--primary))',
          },
        ].map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', marginBottom: 20 }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              borderBottom:
                activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Members ─────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid hsl(var(--border))',
              position: 'relative',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 30,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              aria-label="Search by name, reg. ID, or phone…"
              name="memberSearch"
              id="input-d74d97"
              type="text"
              placeholder="Search by name, reg. ID, or phone…"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 38,
                paddingRight: 12,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <tr>
                  {['Member', 'Reg. ID', 'Region / Constituency', 'Status', 'Joined'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 900,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '48px 18px',
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {members.length === 0
                        ? 'No members have joined this chapter yet.'
                        : 'No members match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.regNo} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 4,
                              background: 'hsl(var(--container-low))',
                              border: '1px solid hsl(var(--border))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 11,
                              flexShrink: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={m.name}
                              />
                            ) : (
                              m.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                color: 'hsl(var(--on-surface))',
                                fontFamily: "'Public Sans', sans-serif",
                              }}
                            >
                              {m.name}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 10,
                                fontWeight: 600,
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {m.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.regNo}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {m.region}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {m.constituency}
                        </p>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : m.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.joined}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Donations ───────────────────────────────────── */}
      {activeTab === 'donations' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <tr>
                  {['Donor', 'Amount', 'Method', 'Reference', 'Date', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 18px',
                        textAlign: 'left',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 900,
                        fontSize: 9,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--on-surface-muted))',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '48px 18px',
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      No donations from chapter members yet.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {d.full_name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {d.phone}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 15,
                          fontWeight: 800,
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        GH₵ {Number(d.amount).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'hsl(var(--on-surface-muted))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {d.payment_method}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {d.reference || '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 18px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(d.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          className={`pill ${d.status === 'Verified' ? 'pill-ok' : d.status === 'Pending' ? 'pill-warn' : 'pill-mute'}`}
                        >
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Board ───────────────────────────────────────── */}
      {activeTab === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
              >
                campaign
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Post an update
              </span>
            </div>
            <textarea
              name="announceDraft"
              id="textarea-ad00f4"
              value={announceDraft}
              onChange={(e) => setAnnounceDraft(e.target.value)}
              placeholder="Share a quick update, reminder, or announcement with your chapter members…"
              rows={4}
              style={{
                width: '100%',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '10px 12px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                background: '#fff',
                color: 'hsl(var(--on-surface))',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={handlePostAnnouncement}
                disabled={isPostingAnnounce || !announceDraft.trim()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  send
                </span>
                {isPostingAnnounce ? 'Posting…' : 'Post update'}
              </button>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="panel" style={{ padding: '48px 18px', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
              >
                forum
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  marginTop: 12,
                }}
              >
                No updates posted yet. Write one above to reach your members.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.map((a) => (
                <div key={a.id} className="panel" style={{ padding: '16px 18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'hsl(var(--primary) / 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 11,
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                          flexShrink: 0,
                          overflow: 'hidden',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        {leaderAvatarUrl ? (
                          <img
                            src={leaderAvatarUrl}
                            alt={a.author_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          a.author_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {a.author_name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {new Date(a.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {' · '}
                          {new Date(a.created_at).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                      title="Delete update"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        delete
                      </span>
                    </button>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      lineHeight: 1.65,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {a.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activities ──────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type filter + add button */}
          {!showActivityForm && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  'All',
                  'Meeting',
                  'Event',
                  'Action',
                  'Onboarding',
                  'Outreach',
                  'Rally',
                  'Workshop',
                ].map((f) => {
                  const count =
                    f === 'All' ? activities.length : activities.filter((a) => a.type === f).length
                  const isActive = actFilter === f
                  return (
                    <button
                      key={f}
                      onClick={() => setActFilter(f)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        border: `1px solid ${isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                        background: isActive ? 'hsl(var(--primary))' : 'transparent',
                        color: isActive ? '#fff' : 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {f}
                      {count > 0 ? ` (${count})` : ''}
                    </button>
                  )
                })}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowActivityForm(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  add
                </span>
                Add activity
              </button>
            </div>
          )}

          {showActivityForm && (
            <div className="panel" style={{ padding: '20px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                  >
                    event_note
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    New activity
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowActivityForm(false)}
                >
                  Cancel
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label htmlFor="act-title" style={lbl}>
                    Title
                  </label>
                  <input
                    id="act-title"
                    name="act-title"
                    type="text"
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    placeholder="e.g. Voter registration drive"
                    style={inp}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 14,
                  }}
                >
                  <div>
                    <label htmlFor="act-type" style={lbl}>
                      Type
                    </label>
                    <select
                      id="act-type"
                      name="act-type"
                      value={actType}
                      onChange={(e) => setActType(e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }}
                    >
                      {[
                        'Event',
                        'Action',
                        'Onboarding',
                        'Meeting',
                        'Outreach',
                        'Rally',
                        'Workshop',
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="act-date" style={lbl}>
                      Date
                    </label>
                    <input
                      id="act-date"
                      name="act-date"
                      type="date"
                      value={actDate}
                      onChange={(e) => setActDate(e.target.value)}
                      style={inp}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="act-desc" style={lbl}>
                    Description (optional)
                  </label>
                  <textarea
                    id="act-desc"
                    name="act-desc"
                    value={actDesc}
                    onChange={(e) => setActDesc(e.target.value)}
                    placeholder="Brief description of the activity…"
                    rows={3}
                    style={{
                      width: '100%',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      padding: '10px 12px',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: 'hsl(var(--on-surface))',
                      resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddActivity}
                    disabled={isSavingActivity}
                  >
                    {isSavingActivity ? 'Saving…' : 'Add activity'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const filtered =
              actFilter === 'All' ? activities : activities.filter((a) => a.type === actFilter)
            if (filtered.length === 0)
              return (
                <div className="panel" style={{ padding: '48px 18px', textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}
                  >
                    event_note
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      marginTop: 12,
                    }}
                  >
                    {actFilter === 'All'
                      ? 'No activities recorded yet.'
                      : `No ${actFilter.toLowerCase()} activities yet.`}
                  </p>
                </div>
              )
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((a) => {
                  const date = new Date(a.activity_date)
                  const dayNum = date.getDate()
                  const monStr = date.toLocaleDateString('en-GB', { month: 'short' })
                  const fullDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                  return (
                    <div
                      key={a.id}
                      className="panel"
                      style={{
                        padding: '16px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          background: 'hsl(var(--primary) / 0.08)',
                          border: '1px solid hsl(var(--primary) / 0.2)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: 'hsl(var(--primary))',
                            fontFamily: "'Public Sans', sans-serif",
                            lineHeight: 1,
                          }}
                        >
                          {dayNum}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: 'hsl(var(--primary))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {monStr}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 2,
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 800,
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {a.title}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 20,
                              background: 'hsl(var(--container-low))',
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {a.type}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {fullDate}
                        </p>
                        {a.description && (
                          <p
                            style={{
                              margin: '6px 0 0',
                              fontSize: 12,
                              fontWeight: 500,
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                              lineHeight: 1.6,
                            }}
                          >
                            {a.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(a.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          borderRadius: 4,
                          color: 'hsl(var(--on-surface-muted))',
                          flexShrink: 0,
                        }}
                        title="Remove activity"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Join Requests ───────────────────────────────── */}
      {activeTab === 'requests' && (
        <div>
          {joinRequests.length === 0 ? (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                border: '1px dashed hsl(var(--border))',
                borderRadius: 6,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 36,
                  color: 'hsl(var(--on-surface-muted))',
                  opacity: 0.25,
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                group_add
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
                No pending join requests
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="panel"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      flexShrink: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {req.member_avatar ? (
                      <img
                        src={req.member_avatar}
                        alt={req.member_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      req.member_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {req.member_name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 600,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      {req.member_reg_no} · Requested{' '}
                      {new Date(req.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleApproveRequest(req.id, req.member_id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        check
                      </span>
                      Accept
                    </button>
                    <button
                      className="btn btn-dest btn-sm"
                      disabled={processingRequestId === req.id}
                      onClick={() => handleRejectRequest(req.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        close
                      </span>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings ────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                >
                  edit_note
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Chapter profile
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
              >
                {isSavingDetails ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>About this chapter</label>
                <textarea
                  name="descDraft"
                  id="textarea-ba58d1"
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  placeholder="Describe your chapter's mission, goals, and focus areas…"
                  rows={4}
                  style={{
                    width: '100%',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '10px 12px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#fff',
                    color: 'hsl(var(--on-surface))',
                    resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />
              </div>
              <div>
                <label style={lbl}>Local focus areas</label>
                {focusTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {focusTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 8px 4px 12px',
                          background: 'hsl(var(--primary) / 0.08)',
                          border: '1px solid hsl(var(--primary) / 0.2)',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'hsl(var(--primary))',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveFocusTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'hsl(var(--primary))',
                            opacity: 0.7,
                            lineHeight: 1,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            close
                          </span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    name="focusInput"
                    id="input-9b4d88"
                    type="text"
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFocusTag()
                      }
                    }}
                    placeholder="e.g. Voter registration"
                    style={{ ...inp, flex: 1 }}
                  />
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleAddFocusTag}
                    style={{ height: 40, whiteSpace: 'nowrap' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      add
                    </span>
                    Add
                  </button>
                </div>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Press Enter or click Add. Click × on a tag to remove it.
                </p>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '20px 22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                >
                  contacts
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Contact info
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveContact}
                disabled={isSavingContact}
              >
                {isSavingContact ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <label style={lbl}>Chapter email</label>
                <input
                  name="emailDraft"
                  id="input-17e0b1"
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="chapter@thebasemovement.com"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Chapter phone</label>
                <input
                  name="phoneDraft"
                  id="input-ec7459"
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="+233 50 000 0000"
                  style={inp}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
