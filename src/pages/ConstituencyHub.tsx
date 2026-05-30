import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { constituencyService, constituencySlug } from '@/services/constituencyService'
import type { Constituency, ConstituencyLeader } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/states'

// ── types ────────────────────────────────────────────────────────────────────

interface ConstituencyMember {
  authId: string
  regNo: string
  name: string
  phone: string
  region: string
  status: string
  joined: string
  avatarUrl?: string
}

interface Announcement {
  id: string
  constituency_id: number
  content: string
  author_name: string
  created_at: string
}

interface ConstituencyDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}

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
      const [{ data: memberData }, { data: announceData }, { data: actData }, committeeData] = await Promise.all([
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
      {/* Header */}
      <div
        className="panel"
        style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'hsl(var(--primary))',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {constituency.name}
            </h1>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
              {constituency.regionName} Region · Constituency Hub
            </p>
          </div>
          <Link
            to={`/dashboard/constituencies/${slug}`}
            className="btn btn-outline btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              open_in_new
            </span>
            Public View
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Members', value: members.length, bar: 'hsl(var(--primary))' },
          { label: 'Verified', value: activeCount, bar: 'hsl(var(--accent))' },
          {
            label: 'Total Donated',
            value: `GH₵ ${totalDonated.toLocaleString()}`,
            bar: 'hsl(var(--primary))',
          },
          { label: 'Activities', value: activities.length, bar: 'hsl(var(--on-surface))' },
        ].map((kpi) => (
          <div
            key={kpi.label}
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
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

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

      {/* ── Members Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, reg no or phone..."
              style={{
                height: 40,
                width: '100%',
                maxWidth: 340,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>
          {filteredMembers.length === 0 ? (
            <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>No members found.</p>
          ) : (
            <div className="panel" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Member', 'Reg No', 'Phone', 'Region', 'Joined', 'Status'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr
                      key={m.authId}
                      style={{ borderBottom: '1px solid hsl(var(--border))' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt=""
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-pill)',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-pill)',
                                background: 'hsl(var(--container-low))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                              >
                                person
                              </span>
                            </div>
                          )}
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.regNo || '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.phone}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.region}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {m.joined}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className={`pill ${
                            m.status === 'Active' || m.status === 'Approved'
                              ? 'pill-ok'
                              : 'pill-warn'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Donations Tab ───────────────────────────────────────────────────── */}
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
                        fontWeight: 'var(--font-weight-medium, 500)',
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
                    <td colSpan={6} style={{ padding: '48px 18px', textAlign: 'center' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 40,
                          color: 'hsl(var(--on-surface-muted))',
                          opacity: 0.2,
                        }}
                      >
                        volunteer_activism
                      </span>
                      <p
                        style={{
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans', sans-serif",
                          marginTop: 12,
                        }}
                      >
                        No donations from constituency members yet.
                      </p>
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
                            fontWeight: 'var(--font-weight-medium, 500)',
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
                            fontWeight: 'var(--font-weight-medium, 500)',
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
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {new Date(d.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          className={`pill ${
                            d.status === 'Verified'
                              ? 'pill-ok'
                              : d.status === 'Pending'
                                ? 'pill-warn'
                                : 'pill-mute'
                          }`}
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

      {/* ── Board Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'board' && (
        <div>
          <div className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 10px',
              }}
            >
              Post an update
            </p>
            <textarea
              value={announceDraft}
              onChange={(e) => setAnnounceDraft(e.target.value)}
              placeholder="Write an update for your constituency members..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handlePostAnnouncement}
              disabled={isPostingAnnounce || !announceDraft.trim()}
            >
              {isPostingAnnounce ? 'Posting...' : 'Post Update'}
            </button>
          </div>
          {announcements.length === 0 ? (
            <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
              No updates posted yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.map((a) => (
                <div key={a.id} className="panel" style={{ padding: '16px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'hsl(var(--primary) / 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '500',
                          fontSize: 12,
                          color: 'hsl(var(--primary))',
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
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {a.author_name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: 'hsl(var(--primary))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              fontWeight: '500',
                            }}
                          >
                            Coordinator
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            color: 'hsl(var(--on-surface))',
                            margin: 0,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {a.content}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: '8px 0 0',
                          }}
                        >
                          {new Date(a.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Committee Panel (read-only for coordinator) */}
          {committee.length > 0 && (
            <div className="panel" style={{ padding: '20px 24px', marginTop: 20 }}>
              <p
                style={{
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 14px',
                  paddingBottom: 12,
                  borderBottom: '1px solid hsl(var(--border))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: 11,
                }}
              >
                Constituency Committee
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {(['Secretary', 'Deputy Secretary', 'Treasurer'] as const).map((role) => {
                  const cl = committee.find((c) => c.role === role)
                  if (!cl) return null
                  return (
                    <div
                      key={role}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                      }}
                    >
                      {cl.imageUrl ? (
                        <img
                          src={cl.imageUrl}
                          alt={cl.name}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 'var(--radius-pill)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 'var(--radius-pill)',
                            background: 'hsl(var(--background))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                          >
                            person
                          </span>
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cl.name}
                        </p>
                        <p
                          style={{
                            margin: '2px 0 0',
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--primary))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {role}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Activities Tab ────────────────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <div>
          {!showActivityForm && (
            <button
              className="btn btn-primary btn-sm"
              style={{ marginBottom: 16 }}
              onClick={() => setShowActivityForm(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Add Activity
            </button>
          )}
          {showActivityForm && (
            <div className="panel" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 16px',
                }}
              >
                New Activity
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  required
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Title *"
                  style={{
                    height: 40,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
                <textarea
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={3}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    style={{
                      flex: 1,
                      height: 40,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      fontFamily: "'Public Sans', sans-serif",
                      boxSizing: 'border-box',
                      background: '#fff',
                      color: 'hsl(var(--on-surface))',
                      cursor: 'pointer',
                    }}
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
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    style={{
                      flex: 1,
                      height: 40,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      fontFamily: "'Public Sans', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddActivity}
                    disabled={isSavingActivity}
                  >
                    {isSavingActivity ? 'Saving...' : 'Save Activity'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowActivityForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {activities.length === 0 ? (
            <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
              No activities yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                      }}
                    >
                      {a.title}
                    </p>
                    {a.description && (
                      <p
                        style={{
                          fontSize: 13,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '4px 0 0',
                        }}
                      >
                        {a.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                      <span className="pill pill-mute">{a.type}</span>
                      {a.activity_date && (
                        <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                          {new Date(a.activity_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-dest btn-sm"
                    onClick={() => handleDeleteActivity(a.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile / About */}
          <div className="panel" style={{ padding: '20px 24px' }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 16px',
              }}
            >
              About
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Focus Areas
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {focusTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        background: 'hsl(var(--container-low))',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => setFocusTags((prev) => prev.filter((t) => t !== tag))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 1,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const t = focusInput.trim()
                        if (t && !focusTags.includes(t)) {
                          setFocusTags((prev) => [...prev, t])
                          setFocusInput('')
                        }
                      }
                    }}
                    placeholder="Add focus area, press Enter"
                    style={{
                      flex: 1,
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
              >
                {isSavingDetails ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Contact */}
          <div className="panel" style={{ padding: '20px 24px' }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 16px',
              }}
            >
              Contact Info
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Email
                </label>
                <input
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  type="email"
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Phone
                </label>
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  type="tel"
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontFamily: "'Public Sans', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={handleSaveContact}
                disabled={isSavingContact}
              >
                {isSavingContact ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
