import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { constituencyService, constituencySlug } from '@/services/constituencyService'
import type { Constituency, ConstituencyLeader } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/states'
import Header from './ConstituencyHub/Header'
import Kpis from './ConstituencyHub/Kpis'
import MembersTab from './ConstituencyHub/MembersTab'
import DonationsTab from './ConstituencyHub/DonationsTab'
import BoardTab from './ConstituencyHub/BoardTab'
import ActivitiesTab from './ConstituencyHub/ActivitiesTab'
import SettingsTab from './ConstituencyHub/SettingsTab'
import type {
  ConstituencyMember as CHMember,
  Announcement as CHAnnouncement,
  ConstituencyDonation as CHDonation,
} from './ConstituencyHub/ConstituencyHubTypes'

// ── types ────────────────────────────────────────────────────────────────────

// local component types (from extracted types file)
type ConstituencyMember = CHMember
type Announcement = CHAnnouncement
type ConstituencyDonation = CHDonation

// ── component ────────────────────────────────────────────────────────────────

export default function ConstituencyHub() {
  const { constituencyId } = useParams<{ constituencyId?: string }>()
  const { session } = useAuth()

  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<ConstituencyMember[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [donations, setDonations] = useState<ConstituencyDonation[]>([])
  const [committee, setCommittee] = useState<ConstituencyLeader[]>([])
  const [activities, setActivities] = useState<
    { id: string; title: string; description: string | null; type: string; activity_date: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    'members' | 'donations' | 'board' | 'activities' | 'settings'
  >('members')

  const [memberSearch, setMemberSearch] = useState('')

  // Board
  const [announceDraft, setAnnounceDraft] = useState('')
  const [isPostingAnnounce, setIsPostingAnnounce] = useState(false)
  const [leaderName, setLeaderName] = useState('')
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string | null>(null)

  // Activities
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actType, setActType] = useState('Event')
  const [actDate, setActDate] = useState('')
  const [isSavingActivity, setIsSavingActivity] = useState(false)

  // Settings
  const [emailDraft, setEmailDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [focusTags, setFocusTags] = useState<string[]>([])
  const [focusInput, setFocusInput] = useState('')

  // ── load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      if (!session?.user) {
        setIsLoading(false)
        return
      }
      const userId = session.user.id

      // Fetch logged-in user profile info for posts/announcements
      const { data: ud } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      if (ud?.full_name) setLeaderName(ud.full_name)
      if (ud?.avatar_url) setLeaderAvatarUrl(ud.avatar_url)

      // Find all constituencies from the DB
      const { data: allGc } = await supabase
        .from('ghana_constituencies')
        .select('*, region:ghana_regions(name)')

      if (!allGc || allGc.length === 0) {
        setIsLoading(false)
        return
      }

      // Match which constituency this coordinator should view
      let gc = null
      if (constituencyId) {
        gc = allGc.find(
          (c) => c.id.toString() === constituencyId || constituencySlug(c.name) === constituencyId
        )
      }
      // Fallback: constituency user leads directly
      if (!gc) {
        gc = allGc.find((c) => c.leader_id === userId)
      }
      // Fallback 2: constituency user is registered in
      if (!gc) {
        const { data: userRow } = await supabase
          .from('users')
          .select('constituency')
          .eq('id', userId)
          .maybeSingle()
        if (userRow?.constituency) {
          gc = allGc.find((c) => c.name.toLowerCase() === userRow.constituency!.toLowerCase())
        }
      }

      if (!gc) {
        setIsLoading(false)
        return
      }

      // Map to Constituency shape
      const c: Constituency = {
        id: gc.id,
        name: gc.name,
        regionId: gc.region_id,
        regionName: (gc.region as { name: string } | null)?.name ?? '',
        memberCount: 0,
        leaderId: gc.leader_id,
        leaderName: gc.leader_name,
        description: gc.description,
        status: gc.status ?? 'Active',
        meetingSchedule: gc.meeting_schedule,
        localFocus: gc.local_focus,
        email: gc.email,
        phoneNumber: gc.phone_number,
      }
      setConstituency(c)
      setEmailDraft(c.email ?? '')
      setPhoneDraft(c.phoneNumber ?? '')
      setDescDraft(c.description ?? '')
      setFocusTags(
        c.localFocus
          ? c.localFocus
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []
      )

      // Load members, announcements, activities, and committee in parallel
      const [{ data: memberData }, { data: announceData }, { data: actData }, committeeData] =
        await Promise.all([
          supabase
            .from('users')
            .select(
              'id, registration_number, full_name, phone_number, region, status, joined_at, avatar_url'
            )
            .eq('constituency', c.name)
            .order('joined_at', { ascending: false }),
          supabase
            .from('constituency_announcements')
            .select('*')
            .eq('constituency_id', c.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('constituency_activities')
            .select('id, title, description, type, activity_date')
            .eq('constituency_id', c.id)
            .order('activity_date', { ascending: false }),
          constituencyService.getCommittee(c.id),
        ])

      const mappedMembers = (memberData ?? []).map((u) => ({
        authId: u.id,
        regNo: u.registration_number ?? '',
        name: u.full_name,
        phone: u.phone_number ?? 'N/A',
        region: u.region ?? 'N/A',
        status: u.status,
        joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-GB') : 'N/A',
        avatarUrl: u.avatar_url ?? undefined,
      }))
      setMembers(mappedMembers)
      setAnnouncements(announceData ?? [])
      setActivities(actData ?? [])
      setCommittee(committeeData)

      // Load member donations
      const memberIds = mappedMembers.map((m) => m.authId).filter(Boolean)
      if (memberIds.length > 0) {
        const { data: donationData } = await supabase
          .from('donations')
          .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
          .in('member_id', memberIds)
          .order('created_at', { ascending: false })
        setDonations(donationData ?? [])
      }

      setIsLoading(false)
    }
    load()
  }, [constituencyId, session])

  // ── board ─────────────────────────────────────────────────────────────────

  const handlePostAnnouncement = async () => {
    if (!constituency || !announceDraft.trim()) return
    setIsPostingAnnounce(true)
    const { error } = await supabase.from('constituency_announcements').insert({
      constituency_id: constituency.id,
      content: announceDraft.trim(),
      author_name: leaderName || constituency.leaderName,
    })
    setIsPostingAnnounce(false)
    if (error) {
      toast.error('Failed to post update.')
      return
    }
    const { data } = await supabase
      .from('constituency_announcements')
      .select('*')
      .eq('constituency_id', constituency.id)
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setAnnounceDraft('')
    toast.success('Update posted.')

    // Push notification to all members of constituency — fire and forget
    const memberIds = members.map((m) => m.authId).filter(Boolean)
    if (memberIds.length > 0) {
      supabase.functions
        .invoke('send-push-notification', {
          body: {
            userIds: memberIds,
            title: `${constituency.name} — new announcement`,
            body: announceDraft.trim().slice(0, 100),
            url: `/dashboard/constituencies/${constituencySlug(constituency.name)}`,
          },
        })
        .catch(console.error)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('constituency_announcements').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete.')
      return
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  // ── activities ────────────────────────────────────────────────────────────

  const handleAddActivity = async () => {
    if (!constituency || !actTitle.trim() || !actDate) {
      toast.error('Title and date required.')
      return
    }
    setIsSavingActivity(true)
    const ok = await constituencyService.addActivity(constituency.id, {
      title: actTitle.trim(),
      description: actDesc.trim() || undefined,
      type: actType,
      activityDate: actDate,
    })
    setIsSavingActivity(false)
    if (!ok) {
      toast.error('Failed to add activity.')
      return
    }
    const { data } = await supabase
      .from('constituency_activities')
      .select('id, title, description, type, activity_date')
      .eq('constituency_id', constituency.id)
      .order('activity_date', { ascending: false })
    setActivities(data ?? [])
    setActTitle('')
    setActDesc('')
    setActType('Event')
    setActDate('')
    setShowActivityForm(false)
    toast.success('Activity added.')
  }

  const handleDeleteActivity = async (id: string) => {
    const ok = await constituencyService.deleteActivity(id)
    if (!ok) {
      toast.error('Failed to remove activity.')
      return
    }
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  // ── settings ──────────────────────────────────────────────────────────────

  const handleSaveContact = async () => {
    if (!constituency) return
    setIsSavingContact(true)
    const ok = await constituencyService.updateConstituency(constituency.id, {
      email: emailDraft,
      phoneNumber: phoneDraft,
    })
    setIsSavingContact(false)
    if (ok) toast.success('Contact info updated.')
    else toast.error('Failed to update.')
  }

  const handleSaveDetails = async () => {
    if (!constituency) return
    setIsSavingDetails(true)
    const ok = await constituencyService.updateConstituency(constituency.id, {
      description: descDraft,
      localFocus: focusTags.join(', '),
    })
    setIsSavingDetails(false)
    if (ok) {
      setConstituency((prev) =>
        prev ? { ...prev, description: descDraft, localFocus: focusTags.join(', ') } : prev
      )
      toast.success('Profile updated.')
    } else {
      toast.error('Failed to save.')
    }
  }

  // ── derived ───────────────────────────────────────────────────────────────

  const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Approved').length
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
  const slug = constituency ? constituencySlug(constituency.name) : ''

  // ── loading state ─────────────────────────────────────────────────────────

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

  // ── not a coordinator ─────────────────────────────────────────────────────

  if (!constituency) {
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
            location_city
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
            No constituency assigned
          </h2>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>
            You have not been appointed as a constituency coordinator yet.
          </p>
          <Link to="/dashboard/constituencies" className="btn btn-outline">
            View constituencies
          </Link>
        </div>
      </div>
    )
  }

  // ── tabs config ───────────────────────────────────────────────────────────

  const TABS = [
    { key: 'members' as const, label: `Members (${members.length})` },
    { key: 'donations' as const, label: `Donations (${donations.length})` },
    { key: 'board' as const, label: `Board (${announcements.length})` },
    { key: 'activities' as const, label: `Activities (${activities.length})` },
    { key: 'settings' as const, label: 'Settings' },
  ]

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="main">
      <Header constituency={constituency} slug={slug} />

      <Kpis
        membersCount={members.length}
        activeCount={activeCount}
        totalDonated={totalDonated}
        activitiesCount={activities.length}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={activeTab === t.key ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <MembersTab
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          filteredMembers={filteredMembers}
        />
      )}

      {/* ── Donations Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'donations' && <DonationsTab donations={donations} />}

      {/* ── Board Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'board' && (
        <BoardTab
          announceDraft={announceDraft}
          setAnnounceDraft={setAnnounceDraft}
          isPostingAnnounce={isPostingAnnounce}
          onPost={handlePostAnnouncement}
          announcements={announcements}
          onDelete={handleDeleteAnnouncement}
          leaderAvatarUrl={leaderAvatarUrl}
          committee={committee}
        />
      )}

      {/* ── Activities Tab ────────────────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <ActivitiesTab
          showActivityForm={showActivityForm}
          setShowActivityForm={setShowActivityForm}
          actTitle={actTitle}
          setActTitle={setActTitle}
          actDesc={actDesc}
          setActDesc={setActDesc}
          actType={actType}
          setActType={setActType}
          actDate={actDate}
          setActDate={setActDate}
          isSavingActivity={isSavingActivity}
          onAddActivity={handleAddActivity}
          activities={activities}
          onDeleteActivity={handleDeleteActivity}
        />
      )}

      {/* ── Settings Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <SettingsTab
          descDraft={descDraft}
          setDescDraft={setDescDraft}
          focusTags={focusTags}
          setFocusTags={setFocusTags}
          focusInput={focusInput}
          setFocusInput={setFocusInput}
          isSavingDetails={isSavingDetails}
          onSaveDetails={handleSaveDetails}
          emailDraft={emailDraft}
          setEmailDraft={setEmailDraft}
          phoneDraft={phoneDraft}
          setPhoneDraft={setPhoneDraft}
          isSavingContact={isSavingContact}
          onSaveContact={handleSaveContact}
        />
      )}
    </div>
  )
}
