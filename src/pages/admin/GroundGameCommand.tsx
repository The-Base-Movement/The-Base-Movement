/**
 * Ground Game Command Page Component
 * -------------------------------------------------------------
 * Command center for ground mobilization operations, displaying canvassing campaigns,
 * field agent deployment rosters, route status, and voter readiness statistics.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { DotLoader } from '@/components/states'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Subcomponents
import { ConstituencyCoverageTable } from './groundgamecommand/ConstituencyCoverageTable'
import { LeaderboardPanel } from './groundgamecommand/LeaderboardPanel'
import { RoutesPanel } from './groundgamecommand/RoutesPanel'
import { QuickActionsPanel } from './groundgamecommand/QuickActionsPanel'
import { FieldAgentsList } from './groundgamecommand/FieldAgentsList'
import { PollingAgentsList } from './groundgamecommand/PollingAgentsList'
import { MemberReadinessTable } from './groundgamecommand/MemberReadinessTable'
import { AppointFieldAgentModal } from './groundgamecommand/AppointFieldAgentModal'
import { AppointStationAgentModal } from './groundgamecommand/AppointStationAgentModal'

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
  avatar_url: string | null
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
  const [readinessSortOrder, setReadinessSortOrder] = useState<'asc' | 'desc'>('asc')

  const rightColRef = useRef<HTMLDivElement>(null)
  const [rightColHeight, setRightColHeight] = useState<number | undefined>(undefined)

  // Asynchronously fetches campaigns, transport requests, canvasser logs, agents and regions
  async function fetchData() {
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData()
  }, [])

  useEffect(() => {
    if (!rightColRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setRightColHeight(entry.contentRect.height)
      }
    })
    observer.observe(rightColRef.current)
    return () => observer.disconnect()
  }, [fieldAgents, pollingAgents, transportReqs])

  // Marks a transport request status as dispatched in database
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
      ? Math.min(100, Math.round((doorsKnocked / totalGoal) * 100))
      : 0

  // Leaderboard from fieldLogs
  const lbMap: Record<string, number> = {}
  fieldLogs.forEach((l) => {
    lbMap[l.canvasser_id] = (lbMap[l.canvasser_id] || 0) + 1
  })
  const leaderboard = Object.entries(lbMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
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
    return [...rows].sort((a, b) => {
      const nameA = a.member_name || ''
      const nameB = b.member_name || ''
      return readinessSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [voterRegs, selectedRegion, readinessFilter, readinessSearch, readinessSortOrder])

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

  // Opens the field agent appointment modal and resets search state
  const openFieldModal = () => {
    setModalMemberSearch('')
    setModalSelectedMember(null)
    setModalConstituency('')
    setModal('field')
  }

  // Opens the polling station agent appointment modal for a target voter
  const openStationModal = (row: VoterRow) => {
    setModalStationTarget(row)
    setModal('station')
  }

  // Closes active appointment modal and resets all search states
  const closeModal = () => {
    setModal(null)
    setModalMemberSearch('')
    setModalSelectedMember(null)
    setModalConstituency('')
    setModalStationTarget(null)
  }

  // Appoints a selected member as a field agent for a specific constituency
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

  // Appoints a target voter member as a polling station agent in database
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

  // Removes/de-appoints a field agent from the roster
  const handleRemoveFieldAgent = async (id: string, name: string) => {
    const ok = await adminService.removeFieldAgent(id)
    if (ok) {
      toast.success(`${name} removed from field agents.`)
      setFieldAgents((p) => p.filter((a) => a.id !== id))
    }
  }

  // Removes/de-appoints a polling station agent from the database
  const handleRemovePollingAgent = async (id: string, name: string) => {
    const ok = await adminService.removePollingStationAgent(id)
    if (ok) {
      toast.success(`${name} removed from station agents.`)
      setPollingAgents((p) => p.filter((a) => a.id !== id))
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title={`Constituency Operations${selectedRegion !== 'ALL' ? ` · ${selectedRegion}` : ''}`}
        icon="campaign"
        description="Field agents · routes · constituency coverage"
        actions={
          <>
            <div
              className="desktop-only"
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            >
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
                id="region-filter-desktop"
                name="region-filter-desktop"
                aria-label="Filter by region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                style={{
                  paddingLeft: 30,
                  paddingRight: 28,
                  height: 34,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: "'Public Sans'",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  background: 'hsl(var(--card))',
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
          </>
        }
      />

      <div
        className="mobile-only"
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          marginBottom: 0,
        }}
      >
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 15,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            place
          </span>
          <select
            id="region-filter-mobile"
            name="region-filter-mobile"
            aria-label="Filter by region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 28,
              height: 38,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans'",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              background: 'hsl(var(--card))',
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
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
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            expand_more
          </span>
        </div>
      </div>

      {loading ? (
        <DotLoader
          label="Initializing ground game protocols…"
          style={{ padding: '80px 0', justifyContent: 'center' }}
        />
      ) : (
        <>
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
              variant="black"
              description="Sign-ups secured today"
              delta={
                signupsToday > 0
                  ? `avg ${(signupsToday / Math.max(canvassersOnline, 1)).toFixed(1)} per agent`
                  : 'No sign-ups logged'
              }
            />
            <TacticalKPI
              label="Intelligence"
              value={routePct > 0 ? `${routePct}%` : '—'}
              variant="green"
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
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 14,
              alignItems: 'stretch',
            }}
          >
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <ConstituencyCoverageTable constituencyStats={constituencyStats} />
            </div>
            <div style={{ flex: '0 1 340px', minWidth: 0 }}>
              <LeaderboardPanel
                leaderboard={leaderboard}
                canvassersOnline={canvassersOnline}
                memberNameMap={memberNameMap}
                topScore={topScore}
              />
            </div>
          </div>

          {/* Layout Grid: Routes (Left) and Agents/Actions (Right) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 14,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{ flex: '2 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column' }}
            >
              <RoutesPanel
                campaigns={campaigns}
                activeCampaigns={activeCampaigns}
                fieldLogs={fieldLogs}
                maxHeight={rightColHeight}
              />
            </div>
            <div
              ref={rightColRef}
              style={{
                flex: '1 1 300px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <QuickActionsPanel
                onNavigateDeploy={() => navigate('/admin/ground-game/deploy')}
                onBroadcast={() => {}}
                onAppointFieldAgent={openFieldModal}
                onExportRouteSheet={() => {}}
                pendingTransportRequests={transportReqs.filter((r) => r.status === 'PENDING')}
                onDispatchTransport={handleDispatch}
              />
              <FieldAgentsList
                fieldAgents={fieldAgents}
                onAppointFieldAgent={openFieldModal}
                onRemoveFieldAgent={handleRemoveFieldAgent}
              />
              <PollingAgentsList
                pollingAgents={pollingAgents}
                onRemovePollingAgent={handleRemovePollingAgent}
              />
            </div>
          </div>

          {/* Member Readiness */}
          <MemberReadinessTable
            voterRegs={voterRegs}
            filteredVoterRegs={filteredVoterRegs}
            submittedCount={submittedCount}
            verifiedCount={verifiedCount}
            inProgressCount={inProgressCount}
            unverifiedCount={unverifiedCount}
            readinessSearch={readinessSearch}
            setReadinessSearch={setReadinessSearch}
            readinessFilter={readinessFilter}
            setReadinessFilter={setReadinessFilter}
            readinessSortOrder={readinessSortOrder}
            setReadinessSortOrder={setReadinessSortOrder}
            pollingAgentMemberIds={pollingAgentMemberIds}
            openStationModal={openStationModal}
          />
        </>
      )}

      {/* Field Agent Appointment Modal */}
      <AppointFieldAgentModal
        isOpen={modal === 'field'}
        onClose={closeModal}
        modalSelectedMember={modalSelectedMember}
        setModalSelectedMember={setModalSelectedMember}
        modalMemberSearch={modalMemberSearch}
        setModalMemberSearch={setModalMemberSearch}
        modalMemberResults={modalMemberResults}
        modalConstituency={modalConstituency}
        setModalConstituency={setModalConstituency}
        appointing={appointing}
        onConfirm={handleAppointFieldAgent}
      />

      {/* Polling Station Agent Confirmation Modal */}
      <AppointStationAgentModal
        isOpen={modal === 'station'}
        onClose={closeModal}
        modalStationTarget={modalStationTarget}
        appointing={appointing}
        onConfirm={handleAppointStationAgent}
      />
    </div>
  )
}
