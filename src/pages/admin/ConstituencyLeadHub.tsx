import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { constituencyService } from '@/services/constituencyService'
import { adminService } from '@/services/adminService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Helpdesk } from '@/components/admin/Helpdesk'
import { HubDonationsList } from './chapterhub/HubDonationsList'
import type { ChapterDonation } from './chapterhub/types'
import type { Constituency, ConstituencyActivity, ConstituencyLeader } from '@/types/admin'
import { toast } from 'sonner'
import { AddActivityModal } from './constituencyLeadHub/AddActivityModal'
import { AssignCommitteeModal } from './constituencyLeadHub/AssignCommitteeModal'
import { AssignLeaderModal } from './constituencyLeadHub/AssignLeaderModal'
import { ConstituencyHubKpis } from './constituencyLeadHub/ConstituencyHubKpis'
import { ConstituencyHubTabs } from './constituencyLeadHub/ConstituencyHubTabs'
import type { HubActiveTab, Modal, UserOption } from './constituencyLeadHub/types'

const PHONE_VISIBLE_ROLES = new Set([
  'CHAPTER_LEAD',
  'CHAPTER_SECRETARY',
  'CONSTITUENCY_LEAD',
  'SUPER_ADMIN',
  'FOUNDER',
  'ORGANIZER',
  'EXECUTIVE',
  'ADMIN',
])

type Member = {
  id: string
  full_name: string
  avatar_url?: string
  status?: string
  profession?: string
  registration_number?: string
}

export default function AdminConstituencyLeadHub() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [constituency, setConstituency] = useState<Constituency | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<ConstituencyActivity[]>([])
  const [committee, setCommittee] = useState<ConstituencyLeader[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<HubActiveTab>('members')
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

  // Committee assignment
  const [committeeMemberSearch, setCommitteeMemberSearch] = useState('')
  const [committeeMemberOptions, setCommitteeMemberOptions] = useState<UserOption[]>([])
  const [committeeRole, setCommitteeRole] = useState<ConstituencyLeader['role']>('Secretary')
  const [committeeSelectedMember, setCommitteeSelectedMember] = useState<UserOption | null>(null)
  const [committeeSaving, setCommitteeSaving] = useState(false)

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
      const [membersData, acts, comm, dons] = await Promise.all([
        constituencyService.getMembersByConstituencyName(c.name),
        constituencyService.getConstituencyActivities(numericId),
        constituencyService.getCommittee(numericId),
        constituencyService.getDonationsByConstituencyName(c.name),
      ])
      setMembers(membersData)
      setActivities(acts)
      setCommittee(comm)
      setDonations(dons)
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
      const data = await constituencyService.searchUsersByName(leaderSearch)
      setLeaderOptions(data)
    }, 300)
    return () => clearTimeout(t)
  }, [leaderSearch])

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!committeeMemberSearch.trim()) {
        setCommitteeMemberOptions([])
        return
      }
      const data = await constituencyService.searchUsersByName(committeeMemberSearch)
      setCommitteeMemberOptions(data)
    }, 300)
    return () => clearTimeout(t)
  }, [committeeMemberSearch])

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

  const handleAssignCommitteeMember = async () => {
    if (!constituency || !committeeSelectedMember) return
    // Check if this role is already filled
    const existingRole = committee.find((c) => c.role === committeeRole)
    if (existingRole) {
      toast.error(`A ${committeeRole} has already been assigned. Remove them first.`)
      return
    }
    setCommitteeSaving(true)
    const ok = await constituencyService.addCommitteeMember(constituency.id, {
      memberId: committeeSelectedMember.id,
      name: committeeSelectedMember.full_name,
      role: committeeRole,
      imageUrl: committeeSelectedMember.avatar_url,
    })
    if (ok) {
      const updated = await constituencyService.getCommittee(constituency.id)
      setCommittee(updated)
      setModal(null)
      setCommitteeMemberSearch('')
      setCommitteeSelectedMember(null)
      setCommitteeRole('Secretary')
      toast.success(`${committeeRole} assigned`)
    } else {
      toast.error('Failed to assign committee member')
    }
    setCommitteeSaving(false)
  }

  const handleRemoveCommitteeMember = async (cl: ConstituencyLeader) => {
    if (!confirm(`Remove ${cl.name} as ${cl.role}?`)) return
    const ok = await constituencyService.removeCommitteeMember(cl.id)
    if (ok) {
      setCommittee((prev) => prev.filter((c) => c.id !== cl.id))
      toast.success('Committee member removed')
    } else {
      toast.error('Failed to remove committee member')
    }
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

      <ConstituencyHubKpis
        memberCount={constituency.memberCount}
        verifiedCount={verifiedCount}
        activitiesCount={activities.length}
      />

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

      <ConstituencyHubTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        membersCount={members.length}
        donationsCount={donations.length}
        activitiesCount={activities.length}
        committeeCount={committee.length}
      />

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="panel" style={{ overflowX: 'auto' }}>
          {members.length === 0 ? (
            <p style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
              No members in this constituency.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
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
                          {m.full_name.split(' ')[0]}
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

      {/* Committee tab */}
      {activeTab === 'committee' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('assign-committee')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Assign Committee Member
            </button>
          </div>

          {/* Role cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {(['Secretary', 'Deputy Secretary', 'Treasurer'] as const).map((role) => {
              const cl = committee.find((c) => c.role === role)
              return (
                <div
                  key={role}
                  className="panel"
                  style={{
                    padding: '18px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Accent stripe */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background:
                        role === 'Secretary'
                          ? 'hsl(var(--primary))'
                          : role === 'Deputy Secretary'
                            ? 'hsl(var(--accent))'
                            : 'hsl(var(--on-surface))',
                    }}
                  />
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 10px',
                    }}
                  >
                    {role}
                  </p>
                  {cl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {cl.imageUrl ? (
                        <img
                          src={cl.imageUrl}
                          alt={cl.name}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-pill)',
                            objectFit: 'cover',
                            flexShrink: 0,
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
                            margin: 0,
                            fontSize: 14,
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
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          Assigned{' '}
                          {new Date(cl.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        className="btn btn-dest btn-sm"
                        onClick={() => handleRemoveCommitteeMember(cl)}
                        style={{ flexShrink: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        person_add
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontStyle: 'italic',
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        Unassigned
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Helpdesk tab */}
      {activeTab === 'donations' && (
        <HubDonationsList
          donations={donations}
          canSeePhone={PHONE_VISIBLE_ROLES.has(adminService.getCurrentUser()?.role ?? '')}
        />
      )}

      {activeTab === 'helpdesk' && <Helpdesk departmentId="constituency" />}

      {/* Assign Committee Member Modal */}
      {modal === 'assign-committee' && (
        <AssignCommitteeModal
          committeeRole={committeeRole}
          setCommitteeRole={setCommitteeRole}
          committeeMemberSearch={committeeMemberSearch}
          setCommitteeMemberSearch={setCommitteeMemberSearch}
          committeeMemberOptions={committeeMemberOptions}
          committeeSelectedMember={committeeSelectedMember}
          setCommitteeSelectedMember={setCommitteeSelectedMember}
          committeeSaving={committeeSaving}
          handleAssignCommitteeMember={handleAssignCommitteeMember}
          setModal={setModal}
        />
      )}

      {modal === 'add-activity' && (
        <AddActivityModal
          actTitle={actTitle}
          setActTitle={setActTitle}
          actDesc={actDesc}
          setActDesc={setActDesc}
          actType={actType}
          setActType={setActType}
          actDate={actDate}
          setActDate={setActDate}
          actSaving={actSaving}
          handleAddActivity={handleAddActivity}
          setModal={setModal}
        />
      )}

      {modal === 'assign-leader' && (
        <AssignLeaderModal
          leaderSearch={leaderSearch}
          setLeaderSearch={setLeaderSearch}
          leaderOptions={leaderOptions}
          leaderSaving={leaderSaving}
          handleAssignLeader={handleAssignLeader}
          setModal={setModal}
        />
      )}
    </div>
  )
}
