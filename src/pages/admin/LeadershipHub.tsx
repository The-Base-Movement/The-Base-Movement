import { useState, useEffect, useCallback } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import type { Member, Chapter } from '@/types/admin'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { BrandLine } from '@/components/ui/BrandLine'

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

export default function LeadershipHub() {
  const [applications, setApplications] = useState<ChapterApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

  const fetchAllLeaders = useCallback(async () => {
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name, leader_name, leader_id')
      .not('leader_name', 'is', null)
      .neq('leader_name', 'Unassigned')
      .order('name', { ascending: true })
    if (!chapters) return

    const leaderIds = chapters.filter((c) => c.leader_id).map((c) => c.leader_id as string)
    const userMap: Record<
      string,
      {
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
    > = {}

    if (leaderIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select(
          'id, avatar_url, registration_number, phone_number, status, platform, region, constituency, country, profession'
        )
        .in('id', leaderIds)
      for (const u of users || []) userMap[u.id] = u
    }

    setAllLeaders(
      chapters
        .filter((c) => c.leader_name)
        .map((c) => ({
          id: c.id,
          chapter_name: c.name,
          leader_name: c.leader_name,
          leader_id: c.leader_id,
          avatar_url: c.leader_id ? (userMap[c.leader_id]?.avatar_url ?? null) : null,
          registration_number: c.leader_id
            ? (userMap[c.leader_id]?.registration_number ?? null)
            : null,
          phone_number: c.leader_id ? (userMap[c.leader_id]?.phone_number ?? null) : null,
          status: c.leader_id ? (userMap[c.leader_id]?.status ?? null) : null,
          platform: c.leader_id ? (userMap[c.leader_id]?.platform ?? null) : null,
          region: c.leader_id ? (userMap[c.leader_id]?.region ?? null) : null,
          constituency: c.leader_id ? (userMap[c.leader_id]?.constituency ?? null) : null,
          country: c.leader_id ? (userMap[c.leader_id]?.country ?? null) : null,
          profession: c.leader_id ? (userMap[c.leader_id]?.profession ?? null) : null,
        }))
    )
  }, [])

  useEffect(() => {
    fetchApplications()
    fetchAllLeaders()
  }, [fetchApplications, fetchAllLeaders])

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
      const success = await adminService.updateChapter(selectedChapterId, {
        leader_name: selectedMember.name,
        leader_id: selectedMember.authId,
        ...(appointRole === 'Chapter Leader' ? { status: 'Active' } : {}),
      })
      if (success) {
        await supabase.from('chapter_leaders').insert({
          chapter_id: selectedChapterId,
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

  const handleRemoveLeader = async (l: AppointedLeader) => {
    const { error } = await supabase
      .from('chapters')
      .update({ leader_name: 'Unassigned', leader_id: null })
      .eq('id', l.id)
    if (error) {
      toast.error('Failed to remove officer.')
      return
    }
    setAllLeaders((prev) => prev.filter((x) => x.id !== l.id))
    toast.success(`${l.leader_name} removed from ${l.chapter_name}.`)
  }

  const filteredApps = applications.filter(
    (app: ChapterApplication) =>
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="main">
      {/* Page Header */}
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              stars
            </span>
            Leadership hub
          </h2>
          <BrandLine />
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
            }}
          >
            Vetting and authorization for movement chapter leadership and regional operations.
          </p>
        </div>
        <div className="actions">
          <button
            className="btn btn-outline"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isGenerating ? 'sync' : 'analytics'}
            </span>
            {isGenerating ? 'Compiling...' : 'Generate Audit'}
          </button>
          <button className="btn btn-primary" onClick={openAppointModal}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add_circle
            </span>
            Direct Appoint
          </button>
        </div>
      </div>

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
        <button
          className="btn btn-outline"
          style={{ height: 36, padding: '0 20px', flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            filter_list
          </span>
          Filter Status
        </button>
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
