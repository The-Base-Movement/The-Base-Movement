import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

type VoterRow = {
  id: string
  user_id: string
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'
  polling_station_id: string | null
  member_name: string
  registration_number: string
  chapter: string | null
  constituency: string | null
  region: string | null
  created_at: string
}

type ConstituencyMember = {
  id: string
  full_name: string
  registration_number: string
  constituency: string
  region: string | null
  chapter: string | null
  polling_station_id: string | null
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER' | null
}

type FieldAgent = {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  constituency: string
  region: string | null
  status: 'active' | 'inactive'
  notes: string | null
  created_at: string
}

type PollingAgent = {
  id: string
  member_id: string
  member_name: string
  registration_number: string
  polling_station_id: string
  constituency: string | null
  region: string | null
  status: 'assigned' | 'confirmed' | 'deployed' | 'stood_down'
  notes: string | null
  created_at: string
}

export default function GroundGameCommand() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CanvassingCampaign[]>([])
  const [transportReqs, setTransportReqs] = useState<GOTVTransportRequest[]>([])
  const [fieldLogs, setFieldLogs] = useState<CanvasserLog[]>([])
  const [voterRegs, setVoterRegs] = useState<VoterRow[]>([])
  const [constituencyMembers, setConstituencyMembers] = useState<ConstituencyMember[]>([])
  const [fieldAgents, setFieldAgents] = useState<FieldAgent[]>([])
  const [pollingAgents, setPollingAgents] = useState<PollingAgent[]>([])
  const [ghanaRegions, setGhanaRegions] = useState<string[]>([])

  // Appointment modal state
  type ModalType = 'field' | 'station' | null
  const [modal, setModal] = useState<ModalType>(null)
  const [modalMemberSearch, setModalMemberSearch] = useState('')
  const [modalSelectedMember, setModalSelectedMember] = useState<ConstituencyMember | null>(null)
  const [modalConstituency, setModalConstituency] = useState('')
  const [modalStationTarget, setModalStationTarget] = useState<VoterRow | null>(null)
  const [appointing, setAppointing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL')
  const [readinessSearch, setReadinessSearch] = useState('')
  const [readinessFilter, setReadinessFilter] = useState<
    'ALL' | 'VERIFIED_VOTER' | 'IN_PROGRESS' | 'UNVERIFIED'
  >('ALL')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, t, l, v, cm, fa, pa, regions] = await Promise.all([
        adminService.getCanvassingCampaigns(),
        adminService.getGOTVTransportRequests(),
        adminService.getCanvasserLogs(),
        adminService.getVoterRegistrationsWithMembers(),
        adminService.getMembersWithConstituency(),
        adminService.getFieldAgents(),
        adminService.getPollingStationAgents(),
        adminService.getGhanaRegions(),
      ])
      setCampaigns(c)
      setTransportReqs(t)
      setFieldLogs(l)
      setVoterRegs(v)
      setConstituencyMembers(cm)
      setFieldAgents(fa)
      setPollingAgents(pa)
      setGhanaRegions(regions.map((r) => (typeof r === 'string' ? r : r.name)))
    } catch {
      toast.error('Failed to synchronize with Ground Game servers.')
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = async (id: string) => {
    const ok = await adminService.updateTransportRequest(id, 'DISPATCHED')
    if (ok) {
      toast.success('Logistics asset dispatched.')
      setTransportReqs((p) => p.map((r) => (r.id === id ? { ...r, status: 'DISPATCHED' } : r)))
    }
  }

  // Derived KPIs
  const today = new Date().toISOString().slice(0, 10)
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')
  const todayLogs = fieldLogs.filter((l) => l.created_at?.slice(0, 10) === today)
  const canvassersOnline = new Set(todayLogs.map((l) => l.canvasser_id)).size
  const doorsKnocked = todayLogs.length
  const signupsToday = todayLogs.filter((l) => l.interaction_result === 'STRONG_SUPPORT').length
  const totalGoal = campaigns.reduce((a, c) => a + (c.goal_contacts || 0), 0)
  const routePct =
    totalGoal > 0 && doorsKnocked > 0
      ? Math.min(99, Math.round((doorsKnocked / totalGoal) * 100))
      : 76

  // Leaderboard from fieldLogs
  const lbMap: Record<string, number> = {}
  fieldLogs.forEach((l) => {
    lbMap[l.canvasser_id] = (lbMap[l.canvasser_id] || 0) + 1
  })
  const leaderboard = Object.entries(lbMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  const topScore = leaderboard[0]?.[1] || 1

  const memberNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    constituencyMembers.forEach((m) => {
      map[m.id] = m.full_name
    })
    fieldAgents.forEach((a) => {
      map[a.member_id] = a.member_name
    })
    return map
  }, [constituencyMembers, fieldAgents])

  // Constituency breakdown — filtered by selected region
  const constituencyStats = useMemo(() => {
    const map: Record<
      string,
      { constituency: string; region: string; members: number; submitted: number; verified: number }
    > = {}
    constituencyMembers
      .filter((m) => selectedRegion === 'ALL' || m.region === selectedRegion)
      .forEach((m) => {
        const key = m.constituency
        if (!map[key])
          map[key] = {
            constituency: key,
            region: m.region || '—',
            members: 0,
            submitted: 0,
            verified: 0,
          }
        map[key].members++
        if (m.polling_station_id) map[key].submitted++
        if (m.registration_status === 'VERIFIED_VOTER') map[key].verified++
      })
    return Object.values(map).sort((a, b) => b.members - a.members)
  }, [constituencyMembers, selectedRegion])

  // Member readiness derived stats
  const verifiedCount = voterRegs.filter((r) => r.registration_status === 'VERIFIED_VOTER').length
  const inProgressCount = voterRegs.filter((r) => r.registration_status === 'IN_PROGRESS').length
  const unverifiedCount = voterRegs.filter((r) => r.registration_status === 'UNVERIFIED').length
  const submittedCount = voterRegs.filter((r) => r.polling_station_id).length

  const filteredVoterRegs = useMemo(() => {
    let rows = voterRegs
    if (selectedRegion !== 'ALL') rows = rows.filter((r) => r.region === selectedRegion)
    if (readinessFilter !== 'ALL')
      rows = rows.filter((r) => r.registration_status === readinessFilter)
    if (readinessSearch.trim()) {
      const q = readinessSearch.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.member_name.toLowerCase().includes(q) ||
          r.registration_number.toLowerCase().includes(q) ||
          (r.chapter || '').toLowerCase().includes(q) ||
          (r.constituency || '').toLowerCase().includes(q) ||
          (r.polling_station_id || '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [voterRegs, selectedRegion, readinessFilter, readinessSearch])

  const pollingAgentMemberIds = useMemo(
    () => new Set(pollingAgents.map((a) => a.member_id)),
    [pollingAgents]
  )

  const modalMemberResults = useMemo(() => {
    if (!modalMemberSearch.trim()) return constituencyMembers.slice(0, 8)
    const q = modalMemberSearch.toLowerCase()
    return constituencyMembers
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) || m.registration_number.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [modalMemberSearch, constituencyMembers])

  const openFieldModal = () => {
    setModalMemberSearch('')
    setModalSelectedMember(null)
    setModalConstituency('')
    setModal('field')
  }

  const openStationModal = (row: VoterRow) => {
    setModalStationTarget(row)
    setModal('station')
  }

  const closeModal = () => {
    setModal(null)
    setModalMemberSearch('')
    setModalSelectedMember(null)
    setModalConstituency('')
    setModalStationTarget(null)
  }

  const handleAppointFieldAgent = async () => {
    if (!modalSelectedMember || !modalConstituency.trim()) return
    setAppointing(true)
    const ok = await adminService.appointFieldAgent(
      modalSelectedMember.id,
      modalConstituency.trim(),
      modalSelectedMember.region || undefined
    )
    setAppointing(false)
    if (ok) {
      toast.success(`${modalSelectedMember.full_name} appointed as field agent.`)
      const updated = await adminService.getFieldAgents()
      setFieldAgents(updated)
      closeModal()
    } else {
      toast.error('Appointment failed. Please try again.')
    }
  }

  const handleAppointStationAgent = async () => {
    if (!modalStationTarget) return
    setAppointing(true)
    const ok = await adminService.appointPollingStationAgent(
      modalStationTarget.user_id,
      modalStationTarget.polling_station_id!,
      modalStationTarget.constituency || undefined,
      modalStationTarget.region || undefined
    )
    setAppointing(false)
    if (ok) {
      toast.success(`${modalStationTarget.member_name} appointed as polling station agent.`)
      const updated = await adminService.getPollingStationAgents()
      setPollingAgents(updated)
      closeModal()
    } else {
      toast.error('Appointment failed. Please try again.')
    }
  }

  const handleRemoveFieldAgent = async (id: string, name: string) => {
    const ok = await adminService.removeFieldAgent(id)
    if (ok) {
      toast.success(`${name} removed from field agents.`)
      setFieldAgents((p) => p.filter((a) => a.id !== id))
    }
  }

  const handleRemovePollingAgent = async (id: string, name: string) => {
    const ok = await adminService.removePollingStationAgent(id)
    if (ok) {
      toast.success(`${name} removed from station agents.`)
      setPollingAgents((p) => p.filter((a) => a.id !== id))
    }
  }

  if (loading) {
    return (
      <div
        className="main"
        style={{
          minHeight: 'calc(100vh - 3.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            className="animate-spin"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid hsl(var(--border))',
              borderTopColor: 'hsl(var(--primary))',
            }}
          />
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'hsl(var(--primary))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Initializing ground game protocols…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      {/* Header */}
      <div className="top">
        <div>
          <div className="crumbs">Command → Constituency Operations</div>
          <h2>Constituency Operations{selectedRegion !== 'ALL' ? ` · ${selectedRegion}` : ''}</h2>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 2,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            Field agents · routes · constituency coverage
          </p>
        </div>
        <div className="actions">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              place
            </span>
            <select
              aria-label="Filter by region"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                paddingLeft: 30,
                paddingRight: 28,
                height: 34,
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                fontFamily: "'Public Sans'",
                fontWeight: 800,
                fontSize: 12,
                background: '#fff',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                color: 'hsl(var(--on-surface))',
              }}
            >
              <option value="ALL">All regions</option>
              {ghanaRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                right: 8,
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              expand_more
            </span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={openFieldModal}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              badge
            </span>
            Appoint field agent
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/admin/ground-game/deploy')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              add
            </span>
            Assign turf
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpis">
        <TacticalKPI
          label="Field Operations"
          value={canvassersOnline > 0 ? canvassersOnline : '—'}
          variant="red"
          description="Agents active and synced today"
          delta={
            activeCampaigns.length > 0
              ? `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? 's' : ''}`
              : 'No active campaigns'
          }
        />
        <TacticalKPI
          label="Engagement"
          value={doorsKnocked > 0 ? doorsKnocked.toLocaleString() : '—'}
          variant="gold"
          description="Households reached door-to-door"
          delta={doorsKnocked > 0 ? '▲ on track' : 'No logs today'}
        />
        <TacticalKPI
          label="Mobilization"
          value={signupsToday > 0 ? signupsToday : '—'}
          variant="green"
          description="Sign-ups secured today"
          delta={
            signupsToday > 0
              ? `avg ${(signupsToday / Math.max(canvassersOnline, 1)).toFixed(1)} per agent`
              : 'No sign-ups logged'
          }
        />
        <TacticalKPI
          label="Intelligence"
          value={doorsKnocked > 0 ? `${routePct}%` : '—'}
          variant="black"
          description="Route completion across active campaigns"
          delta={
            activeCampaigns.length > 0
              ? `${activeCampaigns.filter((c) => (c.goal_contacts || 0) > 200).length} routes flagged behind`
              : 'No campaigns active'
          }
        />
      </div>

      {/* Constituency breakdown + Leaderboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 14,
          marginBottom: 14,
          alignItems: 'start',
        }}
      >
        {/* Constituency coverage table */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Constituency coverage</h3>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Members per constituency — sorted by presence. Use this to identify thin areas
                needing mobilization.
              </p>
            </div>
            <span className="meta">
              {constituencyStats.length}{' '}
              {constituencyStats.length === 1 ? 'constituency' : 'constituencies'}
            </span>
          </div>
          {constituencyStats.length === 0 ? (
            <p
              style={{
                padding: '32px 18px',
                textAlign: 'center',
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No member data yet. Members will appear here once they set their constituency in
              profile settings.
            </p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: 460, overflowY: 'auto' }}>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Public Sans'" }}
              >
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr
                    style={{
                      background: 'hsl(var(--container-low))',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {[
                      'Constituency',
                      'Region',
                      'Members',
                      'Codes submitted',
                      'Verified',
                      'Coverage',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          fontWeight: 800,
                          fontSize: 9.5,
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          color: 'hsl(var(--on-surface-muted))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {constituencyStats.map((row, i) => {
                    const coveragePct =
                      row.members > 0 ? Math.round((row.submitted / row.members) * 100) : 0
                    const coverageColor =
                      coveragePct >= 70
                        ? 'hsl(var(--primary))'
                        : coveragePct >= 40
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--destructive))'
                    return (
                      <tr
                        key={row.constituency}
                        style={{
                          borderBottom:
                            i < constituencyStats.length - 1
                              ? '1px solid hsl(var(--border))'
                              : 'none',
                        }}
                      >
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 800,
                            fontSize: 12.5,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.constituency}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontSize: 11,
                            color: 'hsl(var(--on-surface-muted))',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.region}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 800,
                            fontSize: 13,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.members}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 700,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {row.submitted}
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            fontWeight: 700,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                            color:
                              row.verified > 0
                                ? 'hsl(var(--primary))'
                                : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {row.verified}
                        </td>
                        <td style={{ padding: '10px 16px', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 5,
                                background: 'hsl(var(--border))',
                                borderRadius: 99,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${coveragePct}%`,
                                  height: '100%',
                                  background: coverageColor,
                                  borderRadius: 99,
                                  transition: 'width .3s',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: coverageColor,
                                minWidth: 30,
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {coveragePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="panel">
          <div className="ph">
            <h3>Today's leaderboard</h3>
            <span className="meta">sign-ups · {canvassersOnline} field agents</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {leaderboard.length === 0 ? (
              <p
                style={{
                  padding: '24px 18px',
                  textAlign: 'center',
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No field logs recorded today.
              </p>
            ) : (
              leaderboard.map(([name, score], i) => {
                const pct = Math.round((score / topScore) * 100)
                const label = memberNameMap[name as string] || 'Unknown agent'
                return (
                  <div
                    key={String(name) + i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom:
                        i < leaderboard.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Public Sans'",
                        fontWeight: 800,
                        fontSize: 18,
                        color: i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                        width: 24,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Public Sans'",
                        fontWeight: 800,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {label
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b
                        style={{
                          fontFamily: "'Public Sans'",
                          fontWeight: 800,
                          fontSize: 12.5,
                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {label}
                      </b>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans'",
                          fontWeight: 700,
                        }}
                      >
                        Field agent
                      </span>
                      <div
                        style={{
                          marginTop: 5,
                          height: 4,
                          background: '#f1f5ee',
                          borderRadius: 99,
                          overflow: 'hidden',
                          maxWidth: 200,
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background:
                              'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))',
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans'",
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'right',
                      }}
                    >
                      <b
                        style={{
                          fontSize: 18,
                          letterSpacing: '-.015em',
                          lineHeight: 1,
                          display: 'block',
                        }}
                      >
                        {score}
                      </b>
                      <span
                        style={{
                          fontSize: 9.5,
                          color: 'hsl(var(--on-surface-muted))',
                          letterSpacing: '.05em',
                          textTransform: 'uppercase',
                          display: 'block',
                        }}
                      >
                        signups
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Routes — only shown when there is real campaign activity */}
      {(activeCampaigns.length > 0 || doorsKnocked > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="panel">
            <div className="ph">
              <h3>Routes today</h3>
              <span className="meta">
                {campaigns.length} routes · {activeCampaigns.length} active
              </span>
            </div>
            <div style={{ padding: '6px 0' }}>
              {campaigns.map((c, i) => {
                const knocked = fieldLogs.filter((l) =>
                  l.canvasser_id.includes(c.id?.substring(0, 4) ?? '')
                ).length
                const pct =
                  c.goal_contacts > 0
                    ? Math.min(95, Math.round((knocked / c.goal_contacts) * 100))
                    : 0
                const status = pct > 60 ? 'ok' : pct > 30 ? 'warn' : 'bad'
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: '12px 18px',
                      borderBottom:
                        i < campaigns.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5 }}>
                        {c.title}
                      </b>
                      <span
                        className={
                          status === 'ok'
                            ? 'pill pill-ok'
                            : status === 'warn'
                              ? 'pill pill-warn'
                              : 'pill pill-err'
                        }
                        style={{ fontSize: 9.5, padding: '2px 8px' }}
                      >
                        {status === 'ok'
                          ? 'On track'
                          : status === 'warn'
                            ? 'Behind pace'
                            : 'Stalled'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 14,
                        fontSize: 10.5,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans'",
                        fontWeight: 700,
                        letterSpacing: '.03em',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        <b style={{ color: 'hsl(var(--on-surface))', fontWeight: 800 }}>
                          {c.target_constituency}
                        </b>{' '}
                        · lead
                      </span>
                      <span>
                        <b style={{ color: 'hsl(var(--on-surface))', fontWeight: 800 }}>
                          {knocked}
                        </b>{' '}
                        / {c.goal_contacts} doors
                      </span>
                      <span>{c.status.toLowerCase()}</span>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        height: 5,
                        background: '#f1f5ee',
                        borderRadius: 99,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background:
                            status === 'ok'
                              ? 'hsl(var(--primary))'
                              : status === 'warn'
                                ? 'hsl(var(--accent))'
                                : 'hsl(var(--destructive))',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel">
            <div className="ph">
              <h3>Quick actions</h3>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/ground-game/deploy')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  add_location_alt
                </span>
                Assign new turf
              </button>
              <button
                className="btn"
                style={{ background: 'hsl(var(--accent))', color: '#000', fontWeight: 800 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  campaign
                </span>
                Broadcast to field agents
              </button>
              <button className="btn btn-outline" onClick={openFieldModal}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  badge
                </span>
                Appoint field agent
              </button>
              <button className="btn btn-outline">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  download
                </span>
                Export route sheet
              </button>
            </div>
            {transportReqs.filter((r) => r.status === 'PENDING').length > 0 && (
              <div style={{ padding: '0 18px 18px' }}>
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    fontFamily: "'Public Sans'",
                  }}
                >
                  Alerts
                </div>
                {transportReqs
                  .filter((r) => r.status === 'PENDING')
                  .slice(0, 2)
                  .map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: 'rgba(206,17,38,.04)',
                        border: '1px solid rgba(206,17,38,.18)',
                        borderRadius: 4,
                        padding: '10px 12px',
                        marginBottom: 8,
                      }}
                    >
                      <b
                        style={{
                          fontFamily: "'Public Sans'",
                          fontWeight: 800,
                          fontSize: 11.5,
                          color: 'hsl(var(--destructive))',
                          display: 'block',
                        }}
                      >
                        Transport pending
                      </b>
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {req.pickup_address} · {req.passengers} pax
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ marginTop: 8 }}
                        onClick={() => handleDispatch(req.id)}
                      >
                        Dispatch asset
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Field Agents + Polling Station Agents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        {/* Field Agents */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Field agents</h3>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Members deployed to mobilize specific constituencies.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openFieldModal}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                add
              </span>
              Appoint
            </button>
          </div>
          {fieldAgents.length === 0 ? (
            <p
              style={{
                padding: '24px 18px',
                textAlign: 'center',
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No field agents appointed yet.
            </p>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {fieldAgents.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 18px',
                    borderBottom:
                      i < fieldAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'hsl(var(--container-low))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Public Sans'",
                      fontWeight: 800,
                      fontSize: 11,
                      flexShrink: 0,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {a.member_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b
                      style={{
                        fontFamily: "'Public Sans'",
                        fontWeight: 800,
                        fontSize: 12.5,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.member_name}
                    </b>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans'",
                        fontWeight: 700,
                      }}
                    >
                      {a.constituency}
                      {a.region ? ` · ${a.region}` : ''}
                    </span>
                  </div>
                  <span className="pill pill-ok" style={{ fontSize: 9.5 }}>
                    Active
                  </span>
                  <button
                    onClick={() => handleRemoveFieldAgent(a.id, a.member_name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Polling Station Agents */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Polling station agents</h3>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                Members stationed at specific polling stations on election day.
              </p>
            </div>
          </div>
          {pollingAgents.length === 0 ? (
            <p
              style={{
                padding: '24px 18px',
                textAlign: 'center',
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No station agents appointed. Use the Member Readiness table below to appoint.
            </p>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {pollingAgents.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 18px',
                    borderBottom:
                      i < pollingAgents.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'hsl(var(--container-low))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Public Sans'",
                      fontWeight: 800,
                      fontSize: 11,
                      flexShrink: 0,
                      color: 'hsl(var(--accent))',
                    }}
                  >
                    {a.member_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b
                      style={{
                        fontFamily: "'Public Sans'",
                        fontWeight: 800,
                        fontSize: 12.5,
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.member_name}
                    </b>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: 11,
                        background: 'hsl(var(--container-low))',
                        padding: '1px 6px',
                        borderRadius: 3,
                        letterSpacing: '.04em',
                      }}
                    >
                      {a.polling_station_id}
                    </span>
                    {a.constituency && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontFamily: "'Public Sans'",
                          fontWeight: 700,
                          marginLeft: 6,
                        }}
                      >
                        {a.constituency}
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      a.status === 'deployed'
                        ? 'pill pill-ok'
                        : a.status === 'confirmed'
                          ? 'pill pill-warn'
                          : 'pill pill-mute'
                    }
                    style={{ fontSize: 9.5, textTransform: 'capitalize' }}
                  >
                    {a.status}
                  </span>
                  <button
                    onClick={() => handleRemovePollingAgent(a.id, a.member_name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member Readiness */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="ph">
          <div>
            <h3>Member readiness</h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              Polling station codes submitted by members — use this to coordinate election-day
              logistics by constituency.
            </p>
          </div>
        </div>

        {/* Readiness KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            padding: '14px 18px 18px',
          }}
        >
          {[
            { label: 'Codes submitted', value: submittedCount, bar: 'hsl(var(--primary))' },
            { label: 'Verified voters', value: verifiedCount, bar: 'hsl(var(--primary))' },
            { label: 'In progress', value: inProgressCount, bar: 'hsl(var(--accent))' },
            { label: 'Unverified', value: unverifiedCount, bar: 'hsl(var(--on-surface-muted))' },
          ].map((k) => (
            <div
              key={k.label}
              className="panel"
              style={{
                padding: '14px 16px 14px 20px',
                position: 'relative',
                overflow: 'hidden',
                margin: 0,
              }}
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
              <div
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: '-.02em',
                  lineHeight: 1,
                }}
              >
                {k.value}
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div
          style={{
            padding: '0 18px 14px',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              search
            </span>
            <input
              aria-label="Search members by name, reg number, chapter or constituency"
              value={readinessSearch}
              onChange={(e) => setReadinessSearch(e.target.value)}
              placeholder="Search name, reg#, chapter, constituency…"
              style={{
                width: '100%',
                paddingLeft: 34,
                paddingRight: 12,
                height: 34,
                border: '1px solid hsl(var(--border))',
                borderRadius: 6,
                fontFamily: "'Public Sans'",
                fontSize: 12,
                fontWeight: 700,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          {(['ALL', 'VERIFIED_VOTER', 'IN_PROGRESS', 'UNVERIFIED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setReadinessFilter(f)}
              style={{
                padding: '5px 14px',
                borderRadius: 99,
                border: '1px solid hsl(var(--border))',
                fontFamily: "'Public Sans'",
                fontWeight: 800,
                fontSize: 10.5,
                cursor: 'pointer',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                background: readinessFilter === f ? 'hsl(var(--primary))' : 'transparent',
                color: readinessFilter === f ? '#fff' : 'hsl(var(--on-surface-muted))',
                transition: 'all .15s',
              }}
            >
              {f === 'ALL'
                ? 'All'
                : f === 'VERIFIED_VOTER'
                  ? 'Verified'
                  : f === 'IN_PROGRESS'
                    ? 'In progress'
                    : 'Unverified'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Public Sans'" }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                {[
                  'Member',
                  'Reg #',
                  'Chapter',
                  'Constituency',
                  'Polling station code',
                  'Status',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 18px',
                      textAlign: 'left',
                      fontWeight: 800,
                      fontSize: 10,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--on-surface-muted))',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVoterRegs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '32px 18px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {voterRegs.length === 0
                      ? 'No members have submitted a polling station code yet.'
                      : 'No results match your search.'}
                  </td>
                </tr>
              ) : (
                filteredVoterRegs.map((r, i) => {
                  const isStationAgent = pollingAgentMemberIds.has(r.user_id)
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom:
                          i < filteredVoterRegs.length - 1
                            ? '1px solid hsl(var(--border))'
                            : 'none',
                      }}
                    >
                      <td style={{ padding: '11px 18px', fontWeight: 800, fontSize: 12.5 }}>
                        {r.member_name}
                      </td>
                      <td
                        style={{
                          padding: '11px 18px',
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 700,
                        }}
                      >
                        {r.registration_number || '—'}
                      </td>
                      <td style={{ padding: '11px 18px', fontSize: 11.5, fontWeight: 700 }}>
                        {r.chapter || (
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 18px', fontSize: 11.5, fontWeight: 700 }}>
                        {r.constituency || (
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        {r.polling_station_id ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: 12,
                              background: 'hsl(var(--container-low))',
                              padding: '3px 8px',
                              borderRadius: 4,
                              letterSpacing: '.04em',
                            }}
                          >
                            {r.polling_station_id}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: 'hsl(var(--on-surface-muted))',
                              fontSize: 11.5,
                              fontWeight: 700,
                            }}
                          >
                            Not submitted
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        <span
                          className={
                            r.registration_status === 'VERIFIED_VOTER'
                              ? 'pill pill-ok'
                              : r.registration_status === 'IN_PROGRESS'
                                ? 'pill pill-warn'
                                : 'pill pill-mute'
                          }
                          style={{ fontSize: 9.5 }}
                        >
                          {r.registration_status === 'VERIFIED_VOTER'
                            ? 'Verified'
                            : r.registration_status === 'IN_PROGRESS'
                              ? 'In progress'
                              : 'Unverified'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        {r.polling_station_id &&
                          (isStationAgent ? (
                            <span className="pill pill-ok" style={{ fontSize: 9.5 }}>
                              Station agent
                            </span>
                          ) : (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: 10.5, padding: '3px 10px', whiteSpace: 'nowrap' }}
                              onClick={() => openStationModal(r)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                add
                              </span>
                              Appoint
                            </button>
                          ))}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredVoterRegs.length > 0 && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid hsl(var(--border))',
              fontFamily: "'Public Sans'",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Showing {filteredVoterRegs.length} of {voterRegs.length} records
          </div>
        )}
      </div>

      {/* Field Agent Appointment Modal */}
      {modal === 'field' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 16, margin: 0 }}
                >
                  Appoint field agent
                </h3>
                <p
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '4px 0 0',
                  }}
                >
                  Search a member and assign them to a constituency.
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {/* Member search */}
              <label
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Member
              </label>
              {modalSelectedMember ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: '1px solid hsl(var(--primary))',
                    borderRadius: 6,
                    marginBottom: 14,
                    background: 'rgba(0,107,63,.04)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'hsl(var(--primary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontFamily: "'Public Sans'",
                      fontWeight: 800,
                      fontSize: 11,
                    }}
                  >
                    {modalSelectedMember.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 13 }}>
                      {modalSelectedMember.full_name}
                    </b>
                    <span
                      style={{
                        fontFamily: "'Public Sans'",
                        fontWeight: 700,
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'block',
                      }}
                    >
                      {modalSelectedMember.registration_number}
                    </span>
                  </div>
                  <button
                    onClick={() => setModalSelectedMember(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                    >
                      close
                    </span>
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 16,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      search
                    </span>
                    <input
                      autoFocus
                      aria-label="Search member by name or registration number"
                      value={modalMemberSearch}
                      onChange={(e) => setModalMemberSearch(e.target.value)}
                      placeholder="Search by name or reg number…"
                      style={{
                        width: '100%',
                        paddingLeft: 34,
                        paddingRight: 12,
                        height: 38,
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        fontFamily: "'Public Sans'",
                        fontSize: 12.5,
                        fontWeight: 700,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {modalMemberResults.length > 0 && (
                    <div
                      style={{
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        marginTop: 4,
                        overflow: 'hidden',
                        maxHeight: 220,
                        overflowY: 'auto',
                      }}
                    >
                      {modalMemberResults.map((m, i) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setModalSelectedMember(m)
                            setModalConstituency(m.constituency)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom:
                              i < modalMemberResults.length - 1
                                ? '1px solid hsl(var(--border))'
                                : 'none',
                            background: '#fff',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'hsl(var(--container-low))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: "'Public Sans'",
                              fontWeight: 800,
                              fontSize: 10,
                              flexShrink: 0,
                            }}
                          >
                            {m.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <b
                              style={{
                                fontFamily: "'Public Sans'",
                                fontWeight: 800,
                                fontSize: 12.5,
                              }}
                            >
                              {m.full_name}
                            </b>
                            <span
                              style={{
                                fontFamily: "'Public Sans'",
                                fontWeight: 700,
                                fontSize: 10.5,
                                color: 'hsl(var(--on-surface-muted))',
                                display: 'block',
                              }}
                            >
                              {m.registration_number} · {m.constituency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Constituency */}
              <label
                htmlFor="ggc-constituency"
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Constituency
              </label>
              <input
                id="ggc-constituency"
                name="ggc-constituency"
                value={modalConstituency}
                onChange={(e) => setModalConstituency(e.target.value)}
                placeholder="e.g. Ablekuma Central"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontFamily: "'Public Sans'",
                  fontSize: 12.5,
                  fontWeight: 700,
                  boxSizing: 'border-box',
                  outline: 'none',
                  marginBottom: 20,
                }}
              />

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAppointFieldAgent}
                  disabled={appointing || !modalSelectedMember || !modalConstituency.trim()}
                  style={{
                    opacity:
                      appointing || !modalSelectedMember || !modalConstituency.trim() ? 0.5 : 1,
                  }}
                >
                  {appointing ? 'Appointing…' : 'Appoint field agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polling Station Agent Confirmation Modal */}
      {modal === 'station' && modalStationTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              width: '100%',
              maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ padding: '20px 24px 16px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <h3 style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 16, margin: 0 }}>
                Appoint polling station agent
              </h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div
                style={{
                  background: 'hsl(var(--container-low))',
                  borderRadius: 8,
                  padding: '14px 16px',
                  marginBottom: 20,
                }}
              >
                <b
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {modalStationTarget.member_name}
                </b>
                <span
                  style={{
                    fontFamily: "'Public Sans'",
                    fontWeight: 700,
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {modalStationTarget.registration_number}
                  {modalStationTarget.constituency ? ` · ${modalStationTarget.constituency}` : ''}
                </span>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                  >
                    location_on
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: '.04em',
                      background: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {modalStationTarget.polling_station_id}
                  </span>
                </div>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans'",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 20,
                }}
              >
                This member will be appointed as the movement's polling station agent for the above
                station on election day.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAppointStationAgent}
                  disabled={appointing}
                  style={{ opacity: appointing ? 0.5 : 1 }}
                >
                  {appointing ? 'Appointing…' : 'Confirm appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
