import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import type { Constituency, ConstituencyActivity, Member, ConstituencyLeader } from '@/types/admin'
import SEO from '@/components/SEO'
import { ShareModal } from '@/components/ShareModal'
import { useAuth } from '@/context/AuthContext'
import { LoadingScreen } from '../components/LoadingScreen'
import { LeaderProfileModal } from './chapterdetails/LeaderProfileModal'

type ConstituencyMember = {
  id: string
  full_name: string
  avatar_url?: string
  status?: string
  profession?: string
  registration_number?: string
}

type Announcement = {
  id: string
  content: string
  author_name: string
  created_at: string
}

export default function ConstituencyDetails() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const authUserId = user?.id ?? null

  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<ConstituencyMember[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [committee, setCommittee] = useState<ConstituencyLeader[]>([])
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [activeTab, setActiveTab] = useState<'members' | 'activities'>('activities')
  const [memberSearch, setMemberSearch] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Coordinator profile details modal
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [leaderProfile, setLeaderProfile] = useState<Member | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!authUserId) return
      const { data } = await supabase.from('admins').select('id').eq('id', authUserId).maybeSingle()
      if (data) setIsAdmin(true)
    }
    checkAdmin()
  }, [authUserId])

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      const c = await constituencyService.getConstituencyBySlug(slug)
      if (!c) {
        setLoading(false)
        return
      }
      setConstituency(c)

      const [{ data: membersData }, acts, { data: announceData }, comm] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, avatar_url, status, profession, registration_number')
          .eq('constituency', c.name)
          .order('full_name', { ascending: true }),
        constituencyService.getConstituencyActivities(c.id),
        supabase
          .from('constituency_announcements')
          .select('id, content, author_name, created_at')
          .eq('constituency_id', c.id)
          .order('created_at', { ascending: false })
          .limit(10),
        constituencyService.getCommittee(c.id),
      ])

      setMembers(membersData ?? [])
      setActivities(acts)
      setAnnouncements(announceData ?? [])
      setCommittee(comm)

      // Set default tab based on role
      const isCommitteeMember = comm.some((m) => m.memberId === authUserId)
      const isLeader = c.leaderId === authUserId
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', authUserId ?? '')
        .maybeSingle()

      if (isLeader || isCommitteeMember || !!adminData) {
        setActiveTab('members')
      } else {
        setActiveTab('activities')
      }

      setLoading(false)
    }
    load()
  }, [slug, authUserId])

  // Fetch coordinator avatar
  useEffect(() => {
    if (!constituency?.leaderId) return
    supabase
      .from('users')
      .select('avatar_url')
      .eq('id', constituency.leaderId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setLeaderAvatarUrl(data.avatar_url)
      })
  }, [constituency?.leaderId])

  const handleViewLeaderProfile = async () => {
    if (!constituency?.leaderId) return
    const { data } = await supabase
      .from('users')
      .select(
        'registration_number, full_name, phone_number, region, constituency, country, status, platform, profession, avatar_url, joined_at'
      )
      .eq('id', constituency.leaderId)
      .maybeSingle()
    if (data) {
      setLeaderProfile({
        id: data.registration_number ?? '',
        authId: constituency.leaderId,
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

  if (loading) return <LoadingScreen />

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
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'var(--fs-lg, 22px)',
              color: 'hsl(var(--on-surface))',
              marginBottom: 16,
            }}
          >
            Constituency not found
          </h2>
          <Link to="/dashboard/constituencies" className="btn btn-primary">
            Back to constituencies
          </Link>
        </div>
      </div>
    )
  }

  const isLeader = constituency.leaderId === authUserId
  const isCommitteeMember = committee.some((m) => m.memberId === authUserId)
  const isAuthorized = isLeader || isCommitteeMember || isAdmin
  const isActive = constituency.status === 'Active'
  const filteredMembers = members.filter((m) =>
    m.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const verifiedCount = members.filter(
    (m) => m.status === 'Active' || m.status === 'Approved'
  ).length

  return (
    <div className="main">
      <SEO
        title={`${constituency.name} Constituency`}
        description={`Learn about The Base Movement's ${constituency.name} constituency hub — leadership, announcements, and local activities.`}
        canonical={`/constituencies/${slug}`}
      />

      {/* Coordinator hub command banner */}
      {isLeader && (
        <div
          style={{
            background: 'hsl(var(--accent-low))',
            border: '1px solid hsl(var(--accent))',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: 'hsl(var(--accent))' }}>
              admin_panel_settings
            </span>
            <span
              style={{
                fontSize: 13,
                color: 'hsl(var(--on-accent-low))',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              You are the designated Coordinator for this constituency.
            </span>
          </div>
          <Link
            to="/dashboard/constituency-hub"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              manage_accounts
            </span>
            Coordinator Dashboard
          </Link>
        </div>
      )}

      {/* Back button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/dashboard/constituencies')}
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        All Constituencies
      </button>

      {/* Header Panel */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {isActive ? (
            <>
              <span className="pill pill-ok">Active</span>
              <span
                style={{
                  color: 'hsl(var(--on-surface-muted))',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Verified Constituency Hub
              </span>
            </>
          ) : (
            <span className="pill pill-warn">{constituency.status}</span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 28,
                color: 'hsl(var(--on-surface))',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {constituency.name}
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px 16px',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                marginTop: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                >
                  location_on
                </span>
                {constituency.regionName} Region, Ghana
              </span>
              {isAuthorized && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                  >
                    group
                  </span>
                  {members.length} Registered Members
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsShareModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                share
              </span>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="main-sidebar" style={{ alignItems: 'start' }}>
        {/* Main Column (2/3 width) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* About panel */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
              >
                language
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                About this constituency
              </span>
            </div>
            {constituency.description ? (
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.65,
                  fontStyle: 'italic',
                  borderLeft: '3px solid hsl(var(--accent))',
                  paddingLeft: 14,
                  marginBottom: 14,
                }}
              >
                {constituency.description}
              </p>
            ) : null}
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.65,
              }}
            >
              The {constituency.name} constituency hub provides the platform for members to engage
              locally, collaborate on community development projects, register voter readiness, and
              participate in localized civic actions driving the movement's national agenda in the{' '}
              {constituency.regionName} Region.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 6,
                  }}
                >
                  Local focus
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {constituency.localFocus || 'Voter sensitization & development'}
                </div>
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 6,
                  }}
                >
                  Meeting schedule
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {constituency.meetingSchedule || 'Contact coordinator for schedule'}
                </div>
              </div>
            </div>
          </div>

          {/* Announcements Panel */}
          {announcements.length > 0 && (
            <div className="panel" style={{ padding: '20px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
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
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Constituency updates
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    style={{ borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 14 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: 'hsl(var(--primary) / 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--font-weight-medium, 500)',
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
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {a.author_name}
                        </span>
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--primary))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Coordinator
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          ·{' '}
                          {new Date(a.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
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
            </div>
          )}

          {/* Activities Panel */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
                >
                  calendar_month
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Recent activities
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activities.length > 0 ? (
                activities.map((activity, i) => {
                  const date = new Date(activity.activityDate)
                  const month = date.toLocaleString('en-US', { month: 'short' })
                  const day = date.getDate()
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        background: 'hsl(var(--container-low))',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {month}
                          </span>
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                              lineHeight: 1,
                            }}
                          >
                            {day}
                          </span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                              fontFamily: "'Public Sans', sans-serif",
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {activity.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface-muted))',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginTop: 2,
                            }}
                          >
                            {activity.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div
                  style={{
                    padding: '32px 0',
                    textAlign: 'center',
                    border: '1px dashed hsl(var(--border))',
                    borderRadius: 4,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: 0,
                    }}
                  >
                    No recent activities recorded
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs for detailed listings (Members list) */}
          {isAuthorized && (
            <div className="panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button
                  className={
                    activeTab === 'members' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'
                  }
                  onClick={() => setActiveTab('members')}
                >
                  Members ({members.length})
                </button>
              </div>

              {activeTab === 'members' && (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search constituency members..."
                      style={{
                        height: 38,
                        width: '100%',
                        maxWidth: 320,
                        padding: '0 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontFamily: "'Public Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredMembers.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                        No members found.
                      </p>
                    ) : (
                      filteredMembers.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: 'hsl(var(--container-low))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 4,
                          }}
                        >
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
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
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 'var(--font-weight-medium, 500)',
                                color: 'hsl(var(--on-surface))',
                                margin: 0,
                              }}
                            >
                              {m.full_name}
                            </p>
                            {m.profession && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: 'hsl(var(--on-surface-muted))',
                                  margin: '2px 0 0',
                                }}
                              >
                                {m.profession}
                              </p>
                            )}
                          </div>
                          {m.registration_number && (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'hsl(var(--on-surface-muted))',
                                marginRight: 8,
                              }}
                            >
                              {m.registration_number}
                            </span>
                          )}
                          <span
                            className={`pill ${
                              m.status === 'Active' || m.status === 'Approved'
                                ? 'pill-ok'
                                : 'pill-warn'
                            }`}
                          >
                            {m.status ?? 'Pending'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {filteredMembers.length > 0 && (
                    <p
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 12,
                        margin: '12px 0 0',
                      }}
                    >
                      {verifiedCount} of {members.length} members verified active
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Leadership Widget (Coordinator Info) */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid hsl(var(--border))',
                marginTop: 0,
              }}
            >
              Constituency Coordinator
            </h3>

            {constituency.leaderName ? (
              <div
                style={{
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 4,
                      background: '#181d19',
                      border: '2px solid hsl(var(--accent))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'hsl(var(--on-surface))',
                      fontSize: 16,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: "'Public Sans', sans-serif",
                      overflow: 'hidden',
                    }}
                  >
                    {leaderAvatarUrl ? (
                      <img
                        src={leaderAvatarUrl}
                        alt={constituency.leaderName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      constituency.leaderName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {constituency.leaderName}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--primary))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginTop: 2,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Coordinator
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
                    onClick={handleViewLeaderProfile}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      person
                    </span>
                    View profile
                  </button>
                  {isLeader && (
                    <Link
                      to="/dashboard/constituency-hub"
                      className="btn btn-primary btn-sm"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        fontSize: 11,
                        textDecoration: 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        manage_accounts
                      </span>
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '20px 0',
                  textAlign: 'center',
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 4,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                  }}
                >
                  Unassigned Coordinator
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                paddingTop: 12,
                borderTop: '1px solid hsl(var(--border))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                >
                  mail
                </span>
                {constituency.email ||
                  `${constituency.name.toLowerCase().replace(/\s+/g, '')}@thebasemovement.com`}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
                >
                  phone
                </span>
                {constituency.phoneNumber || '+233 (0) 50 123 4567'}
              </div>
            </div>
          </div>

          {/* Committee Panel */}
          {committee.length > 0 && (
            <div className="panel" style={{ padding: '20px 22px' }}>
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 14,
                  paddingBottom: 12,
                  borderBottom: '1px solid hsl(var(--border))',
                  marginTop: 0,
                }}
              >
                Constituency Committee
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                        padding: '10px 12px',
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
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-pill)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
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

          {/* Official Verification widget */}
          <div
            style={{
              background: 'hsl(var(--container-low))',
              padding: 22,
              borderRadius: 6,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.08 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 80, color: 'hsl(var(--on-surface))' }}
              >
                verified_user
              </span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--accent))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Official verification
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  marginBottom: 16,
                  fontFamily: "'Public Sans', sans-serif",
                  margin: '0 0 16px',
                }}
              >
                This constituency hub is officially recognized and verified by The Base National
                Headquarters in Accra. All activities are aligned with the national operations
                hierarchy.
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  background: 'rgba(0,107,63,0.25)',
                  color: 'hsl(var(--primary))',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,107,63,0.4)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  verified_user
                </span>
                Verified
              </span>
            </div>
          </div>

          {/* Support Local widget */}
          <div className="panel" style={{ padding: '20px 22px' }}>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              Support local outreach
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.6,
                marginBottom: 16,
                fontFamily: "'Public Sans', sans-serif",
                margin: '0 0 16px',
              }}
            >
              Your donations to {constituency.name} help directly fund local canvassing materials,
              townhalls, and grassroots volunteer transport.
            </p>
            <Link
              to="/dashboard/donate"
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                textDecoration: 'none',
                boxSizing: 'border-box',
                display: 'flex',
              }}
            >
              Donate to Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Join the ${constituency.name} constituency hub`}
        url={window.location.href}
      />

      {/* Coordinator Profile modal */}
      {isProfileOpen && leaderProfile && (
        <LeaderProfileModal
          leaderProfile={leaderProfile}
          locationName={constituency.name}
          locationRegion={constituency.regionName}
          leaderTitle="Constituency Coordinator"
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  )
}
