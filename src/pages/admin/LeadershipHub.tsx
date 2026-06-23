/**
 * Leadership Hub Page Component
 * -------------------------------------------------------------
 * Component for movement vetting, leader application management, compliance audit,
 * and direct officer appointments.
 */

import { useState, useEffect, useCallback } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import type { Member, Chapter } from '@/types/admin'
import { chapterService } from '@/services/chapterService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular subcomponents
import { SearchBar } from '@/components/SearchBar'
import { ChapterApplicationsTable } from './leadershiphub/ChapterApplicationsTable'
import { AppointedLeadersTable } from './leadershiphub/AppointedLeadersTable'
import { VisionStatementsList } from './leadershiphub/VisionStatementsList'
import { DirectAppointModal } from './leadershiphub/DirectAppointModal'
import { LeaderProfileModal } from './leadershiphub/LeaderProfileModal'

interface AppointedLeader {
  id: string
  chapter_name: string
  leader_name: string
  leader_id: string | null
  avatar_url: string | null
  registration_number: string | null
  phone_number: string | null
  status: string | null
  platform: string | null
  region: string | null
  constituency: string | null
  country: string | null
  profession: string | null
}

// Main page component rendering KPI metrics, applications table, and active leadership assignments
export default function LeadershipHub() {
  const [applications, setApplications] = useState<ChapterApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>(
    'All'
  )

  const [filterOpen, setFilterOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [appointModal, setAppointModal] = useState(false)
  const [appointMembers, setAppointMembers] = useState<Member[]>([])
  const [appointChapters, setAppointChapters] = useState<Chapter[]>([])
  const [appointSearch, setAppointSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState('')
  const [appointRole, setAppointRole] = useState('Chapter Leader')
  const [isAppointing, setIsAppointing] = useState(false)
  const [appointLoading, setAppointLoading] = useState(false)
  const [allLeaders, setAllLeaders] = useState<AppointedLeader[]>([])
  const [leadersSearch, setLeadersSearch] = useState('')
  const [viewLeader, setViewLeader] = useState<AppointedLeader | null>(null)

  // Fetch candidate chapter leadership applications
  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await adminService.getChapterApplications()
      setApplications(data)
    } catch (err) {
      console.error('[LEADERSHIP] Failed to fetch applications:', err)
      toast.error('Sync failed', { description: 'Could not synchronize chapter applications.' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Resolve and cache profile information for all appointed chapter officers
  const fetchAllLeaders = useCallback(async () => {
    const chapters = await chapterService.getAppointedLeaders()
    if (!chapters.length) return

    const leaderIds = chapters.filter((c) => c.leader_id).map((c) => c.leader_id as string)
    const userMap = await chapterService.getLeaderProfiles(leaderIds)

    setAllLeaders(
      chapters
        .filter((c) => c.leader_name)
        .map((c) => {
          const profile = c.leader_id ? userMap[c.leader_id] : null
          return {
            id: c.id,
            chapter_name: c.name,
            leader_name: c.leader_name!,
            leader_id: c.leader_id,
            avatar_url: (profile?.avatar_url as string | null) ?? null,
            registration_number: (profile?.registration_number as string | null) ?? null,
            phone_number: (profile?.phone_number as string | null) ?? null,
            status: (profile?.status as string | null) ?? null,
            platform: (profile?.platform as string | null) ?? null,
            region: (profile?.region as string | null) ?? null,
            constituency: (profile?.constituency as string | null) ?? null,
            country: (profile?.country as string | null) ?? null,
            profession: (profile?.profession as string | null) ?? null,
          }
        })
    )
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications()
      fetchAllLeaders()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchApplications, fetchAllLeaders])

  // Approve a chapter leadership application and update active application lists
  const handleApprove = async (id: string, name: string) => {
    try {
      const success = await adminService.approveChapterApplication(id)
      if (success) {
        toast.success('Leader appointed', {
          description: `${name} has been authorized as a Chapter Leader.`,
        })
        fetchApplications(true)
      } else {
        toast.error('Authorization failed', {
          description: 'Could not approve the application. Please try again.',
        })
      }
    } catch (err) {
      console.error('[LEADERSHIP] Approval failed:', err)
      toast.error('Authorization failed')
    }
  }

  // Reject a chapter leadership application and decline the officer request
  const handleReject = async (id: string, name: string) => {
    try {
      const success = await adminService.rejectChapterApplication(id)
      if (success) {
        toast.error('Application rejected', {
          description: `${name}'s leadership request has been declined.`,
        })
        fetchApplications(true)
      }
    } catch (err) {
      console.error('[LEADERSHIP] Rejection failed:', err)
      toast.error('Rejection failed')
    }
  }

  // Download a plain text compliance audit report for national leaders
  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const report = await adminService.generateComplianceReport('National')
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `thebase_leadership_audit_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Audit report downloaded')
    } catch (err) {
      console.error('[AUDIT] Report generation failed:', err)
      toast.error('Could not generate audit report')
    } finally {
      setIsGenerating(false)
    }
  }

  // Open direct appointment modal and populate active members and chapters
  const openAppointModal = async () => {
    setAppointModal(true)
    setAppointLoading(true)
    setSelectedMember(null)
    setSelectedChapterId('')
    setAppointSearch('')
    setAppointRole('Chapter Leader')
    try {
      const [members, chapters] = await Promise.all([
        adminService.getMembers(),
        adminService.getChapters(),
      ])
      setAppointMembers(members.filter((m) => m.status === 'Active' || m.status === 'Approved'))
      setAppointChapters(chapters)
      if (chapters.length > 0) setSelectedChapterId(chapters[0].id)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setAppointLoading(false)
    }
  }

  // Confirm appointment of a member to a specific chapter leadership role
  const handleAppoint = async () => {
    if (!selectedMember) {
      toast.error('Select a member first')
      return
    }
    if (!selectedChapterId) {
      toast.error('Select a chapter first')
      return
    }
    setIsAppointing(true)
    try {
      const appointedChapter = appointChapters.find((c) => c.id === selectedChapterId)
      const chapterName = appointedChapter?.name

      const success = await adminService.updateChapter(selectedChapterId, {
        leader_name: selectedMember.name,
        leader_id: selectedMember.authId,
        ...(appointRole === 'Chapter Leader' ? { status: 'Active' } : {}),
      })
      if (success) {
        if (chapterName && selectedMember.authId) {
          await chapterService.assignMemberToChapter(selectedMember.authId, chapterName)
        }
        await chapterService.insertChapterLeader(selectedChapterId, {
          name: selectedMember.name,
          role: appointRole,
          image_url: selectedMember.avatarUrl || null,
        })
        toast.success(`${selectedMember.name} appointed as ${appointRole}`)
        setAppointModal(false)
        fetchApplications(true)
        fetchAllLeaders()
      } else {
        toast.error('Appointment failed — chapter may not have write permission')
      }
    } catch (err) {
      console.error('[APPOINT] Error:', err)
      toast.error('Appointment failed')
    } finally {
      setIsAppointing(false)
    }
  }

  // Remove the currently assigned leader from a chapter, resetting to Unassigned
  const handleRemoveLeader = async (l: AppointedLeader) => {
    try {
      await chapterService.unassignChapterLeader(l.id)
      setAllLeaders((prev) => prev.filter((x) => x.id !== l.id))
      toast.success(`${l.leader_name} removed from ${l.chapter_name}.`)
    } catch {
      toast.error('Failed to remove officer.')
    }
  }

  const filteredApps = applications.filter((app: ChapterApplication) => {
    const matchesSearch =
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="main">
      <AdminPageHeader
        title="Leadership hub"
        icon="stars"
        description="Vetting and authorization for movement chapter leadership and regional operations."
        actions={
          <>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {isGenerating ? 'sync' : 'analytics'}
              </span>
              {isGenerating ? 'Compiling...' : 'Generate Audit'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAppointModal}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add_circle
              </span>
              Direct Appoint
            </button>
          </>
        }
      />

      <div className="kpis">
        <TacticalKPI
          label="Growth Rate"
          value="+12%"
          variant="red"
          description="Mobilization velocity"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI
          label="Pending Requests"
          value={applications.filter((a: ChapterApplication) => a.status === 'Pending').length}
          variant="gold"
          description="Awaiting vetting"
          trend={{ direction: 'neutral', value: 'Vetting' }}
        />
        <TacticalKPI
          label="Leaders Appointed"
          value={applications.filter((a: ChapterApplication) => a.status === 'Approved').length}
          variant="black"
          description="Authorized officers"
          trend={{ direction: 'up', value: 'Active' }}
        />
        <TacticalKPI
          label="Active Chapters"
          value={new Set(applications.map((a: ChapterApplication) => a.proposed_chapter_name)).size}
          variant="green"
          description="Regional sectors"
          trend={{ direction: 'up', value: 'Optimal' }}
        />
      </div>

      {/* Intelligence & Filtering */}
      <div
        className="panel"
        style={{
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          overflow: 'visible',
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search applications…"
            variant="dashboard"
          />
        </div>
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <button
            className={statusFilter !== 'All' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            style={{ width: '100%' }}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              tune
            </span>
            {statusFilter === 'All' ? 'Filter' : statusFilter}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, marginLeft: 'auto' }}
            >
              {filterOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {filterOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setFilterOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt)
                      setFilterOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 14px',
                      background:
                        statusFilter === opt ? 'hsl(var(--container-low))' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 15,
                        color:
                          statusFilter === opt
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {statusFilter === opt ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <ChapterApplicationsTable
        isLoading={isLoading}
        filteredApps={filteredApps}
        onReject={handleReject}
        onApprove={handleApprove}
        onRefresh={() => fetchApplications()}
      />

      {/* Direct Appoint Modal */}
      <DirectAppointModal
        isOpen={appointModal}
        onClose={() => setAppointModal(false)}
        appointLoading={appointLoading}
        appointSearch={appointSearch}
        setAppointSearch={setAppointSearch}
        appointMembers={appointMembers}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        appointChapters={appointChapters}
        selectedChapterId={selectedChapterId}
        setSelectedChapterId={setSelectedChapterId}
        appointRole={appointRole}
        setAppointRole={setAppointRole}
        isAppointing={isAppointing}
        onConfirmAppoint={handleAppoint}
      />

      {/* Vision & Strategy Section */}
      {/* ── All Appointed Leaders ──────────────────────── */}
      <AppointedLeadersTable
        allLeaders={allLeaders}
        leadersSearch={leadersSearch}
        setLeadersSearch={setLeadersSearch}
        onViewLeader={setViewLeader}
        onRemoveLeader={handleRemoveLeader}
      />

      <VisionStatementsList filteredApps={filteredApps} />

      {/* Leader profile modal */}
      <LeaderProfileModal viewLeader={viewLeader} onClose={() => setViewLeader(null)} />
    </div>
  )
}
