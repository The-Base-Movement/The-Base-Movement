import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import type { Constituency, ConstituencyActivity } from '@/types/admin'

type Member = {
  id: string
  full_name: string
  avatar_url?: string
  status?: string
  profession?: string
  reg_no?: string
}

export default function ConstituencyDetails() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'activities'>('members')
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      const c = await constituencyService.getConstituencyBySlug(slug)
      if (!c) {
        setLoading(false)
        return
      }
      setConstituency(c)
      const [{ data: membersData }, acts] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, avatar_url, status, profession, reg_no')
          .eq('constituency', c.name)
          .order('full_name', { ascending: true }),
        constituencyService.getConstituencyActivities(c.id),
      ])
      setMembers(membersData ?? [])
      setActivities(acts)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="main">
        <p style={{ color: 'hsl(var(--on-surface-muted))' }}>Loading...</p>
      </div>
    )
  }

  if (!constituency) {
    return (
      <div className="main">
        <p style={{ color: 'hsl(var(--on-surface-muted))' }}>Constituency not found.</p>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate('/dashboard/constituencies')}
        >
          Back to Constituencies
        </button>
      </div>
    )
  }

  const filteredMembers = members.filter((m) =>
    m.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
  )
  const verifiedCount = members.filter(
    (m) => m.status === 'Active' || m.status === 'Approved'
  ).length

  return (
    <div className="main">
      {/* Back link */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/dashboard/constituencies')}
        style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        Constituencies
      </button>

      {/* Header panel */}
      <div
        className="panel"
        style={{ padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
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
              {constituency.regionName} Region
            </p>
          </div>
          <span className={`pill ${constituency.status === 'Active' ? 'pill-ok' : 'pill-mute'}`}>
            {constituency.status}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 20,
            flexWrap: 'wrap',
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              group
            </span>
            {constituency.memberCount} members
          </span>
          {constituency.leaderName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                person
              </span>
              Coordinator: {constituency.leaderName}
            </span>
          )}
          {constituency.email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                mail
              </span>
              {constituency.email}
            </span>
          )}
          {constituency.meetingSchedule && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                calendar_month
              </span>
              {constituency.meetingSchedule}
            </span>
          )}
        </div>

        {constituency.description && (
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: '16px 0 0',
              lineHeight: 1.6,
            }}
          >
            {constituency.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={activeTab === 'members' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
          onClick={() => setActiveTab('members')}
        >
          Members ({members.length})
        </button>
        <button
          className={activeTab === 'activities' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
          onClick={() => setActiveTab('activities')}
        >
          Activities ({activities.length})
        </button>
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              style={{
                height: 40,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredMembers.length === 0 ? (
              <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
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
                    padding: '12px 16px',
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-pill)',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-pill)',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        person
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
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
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '2px 0 0',
                        }}
                      >
                        {m.profession}
                      </p>
                    )}
                  </div>
                  {m.reg_no && (
                    <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      {m.reg_no}
                    </span>
                  )}
                  <span
                    className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`}
                  >
                    {m.status ?? 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
          {filteredMembers.length > 0 && (
            <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 12 }}>
              {verifiedCount} of {members.length} verified
            </p>
          )}
        </div>
      )}

      {/* Activities tab */}
      {activeTab === 'activities' && (
        <div>
          {activities.length === 0 ? (
            <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>
              No activities recorded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map((a) => (
                <div key={a.id} className="panel" style={{ padding: '16px 20px' }}>
                  <div
                    style={{
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
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {a.type && (
                        <span
                          className="pill pill-mute"
                          style={{ marginBottom: 4, display: 'block' }}
                        >
                          {a.type}
                        </span>
                      )}
                      {a.activityDate && (
                        <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                          {new Date(a.activityDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
