import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { supabase } from '@/lib/supabase'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { Constituency, ConstituencyActivity } from '@/types/admin'
import { toast } from 'sonner'

type Member = {
  id: string
  full_name: string
  avatar_url?: string
  status?: string
  profession?: string
  registration_number?: string
}

type UserOption = {
  id: string
  full_name: string
  avatar_url?: string
}

type Modal = 'add-activity' | 'assign-leader' | null

export default function AdminConstituencyLeadHub() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'activities'>('members')
  const [modal, setModal] = useState<Modal>(null)

  // Activity form
  const [actTitle, setActTitle] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actType, setActType] = useState('')
  const [actDate, setActDate] = useState('')
  const [actSaving, setActSaving] = useState(false)

  // Leader assignment
  const [leaderSearch, setLeaderSearch] = useState('')
  const [leaderOptions, setLeaderOptions] = useState<UserOption[]>([])
  const [leaderSaving, setLeaderSaving] = useState(false)

  const numericId = id ? parseInt(id, 10) : NaN

  useEffect(() => {
    if (isNaN(numericId)) return
    const load = async () => {
      const c = await constituencyService.getConstituencyById(numericId)
      if (!c) {
        setLoading(false)
        return
      }
      setConstituency(c)
      const [{ data: membersData }, acts] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, avatar_url, status, profession, registration_number')
          .eq('constituency', c.name)
          .order('full_name', { ascending: true }),
        constituencyService.getConstituencyActivities(numericId),
      ])
      setMembers(membersData ?? [])
      setActivities(acts)
      setLoading(false)
    }
    load()
  }, [numericId])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!leaderSearch.trim()) {
        setLeaderOptions([])
        return
      }
      const { data } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${leaderSearch}%`)
        .limit(10)
      setLeaderOptions(data ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [leaderSearch])

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!constituency) return
    setActSaving(true)
    const ok = await constituencyService.addActivity(constituency.id, {
      title: actTitle,
      description: actDesc,
      type: actType,
      activityDate: actDate,
    })
    if (ok) {
      const updated = await constituencyService.getConstituencyActivities(constituency.id)
      setActivities(updated)
      setActTitle('')
      setActDesc('')
      setActType('')
      setActDate('')
      setModal(null)
      toast.success('Activity added')
    } else {
      toast.error('Failed to add activity')
    }
    setActSaving(false)
  }

  const handleDeleteActivity = async (activityId: string) => {
    const ok = await constituencyService.deleteActivity(activityId)
    if (ok) {
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
      toast.success('Activity removed')
    } else {
      toast.error('Failed to remove activity')
    }
  }

  const handleAssignLeader = async (u: UserOption) => {
    if (!constituency) return
    setLeaderSaving(true)
    const ok = await constituencyService.updateConstituency(constituency.id, {
      leaderId: u.id,
      leaderName: u.full_name,
    })
    if (ok) {
      setConstituency((prev) =>
        prev ? { ...prev, leaderId: u.id, leaderName: u.full_name } : prev
      )
      setModal(null)
      setLeaderSearch('')
      toast.success('Coordinator assigned')
    } else {
      toast.error('Failed to assign coordinator')
    }
    setLeaderSaving(false)
  }

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
          onClick={() => navigate('/admin/constituencies')}
        >
          Back
        </button>
      </div>
    )
  }

  const verifiedCount = members.filter(
    (m) => m.status === 'Active' || m.status === 'Approved'
  ).length

  return (
    <div className="main">
      <AdminPageHeader
        title={constituency.name}
        description={`${constituency.regionName} Region · Admin Hub`}
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/admin/constituencies')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            All Constituencies
          </button>
        }
      />

      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div
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
              background: 'hsl(var(--primary))',
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
            Members
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {constituency.memberCount}
          </p>
        </div>

        <div
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
              background: 'hsl(var(--accent))',
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
            Verified
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {verifiedCount}
          </p>
        </div>

        <div
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
              background: 'hsl(var(--on-surface))',
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
            Activities
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {activities.length}
          </p>
        </div>
      </div>

      {/* Coordinator panel */}
      <div
        className="panel"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Coordinator
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {constituency.leaderName ?? (
              <span style={{ fontStyle: 'italic', color: 'hsl(var(--on-surface-muted))' }}>
                Unassigned
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setModal('assign-leader')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            manage_accounts
          </span>
          {constituency.leaderId ? 'Reassign' : 'Assign'} Coordinator
        </button>
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
        <div className="panel" style={{ overflow: 'hidden' }}>
          {members.length === 0 ? (
            <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
              No members in this constituency.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {['Member', 'Profession', 'Reg No', 'Status'].map((h) => (
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
                {members.map((m) => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                          {m.full_name}
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
                      {m.profession ?? '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {m.registration_number ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`pill ${
                          m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : 'pill-warn'
                        }`}
                      >
                        {m.status ?? 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activities tab */}
      {activeTab === 'activities' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('add-activity')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Add Activity
            </button>
          </div>
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
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginTop: 8,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        alignItems: 'center',
                      }}
                    >
                      {a.type && <span className="pill pill-mute">{a.type}</span>}
                      {a.activityDate && (
                        <span>{new Date(a.activityDate).toLocaleDateString()}</span>
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

      {/* Add Activity Modal */}
      {modal === 'add-activity' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              width: '100%',
              maxWidth: 480,
              margin: '0 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 20px',
              }}
            >
              Add Activity
            </h2>
            <form
              onSubmit={handleAddActivity}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
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
                placeholder="Description"
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
              <input
                required
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                placeholder="Type (e.g. Meeting, Workshop) *"
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
              <input
                required
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actSaving}>
                  {actSaving ? 'Saving...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Leader Modal */}
      {modal === 'assign-leader' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              width: '100%',
              maxWidth: 480,
              margin: '0 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '0 0 20px',
              }}
            >
              Assign Coordinator
            </h2>
            <input
              value={leaderSearch}
              onChange={(e) => setLeaderSearch(e.target.value)}
              placeholder="Search member by name..."
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontFamily: "'Public Sans', sans-serif",
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />
            {leaderOptions.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {leaderOptions.map((u) => (
                  <button
                    key={u.id}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', gap: 12, padding: '10px 12px' }}
                    onClick={() => handleAssignLeader(u)}
                    disabled={leaderSaving}
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
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
                    <span style={{ fontSize: 14, color: 'hsl(var(--on-surface))' }}>
                      {u.full_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {leaderSearch && leaderOptions.length === 0 && (
              <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
                No members found.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
