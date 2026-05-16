import { useState, useEffect, useCallback } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import type { Member, Chapter } from '@/types/admin'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

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
      toast.error("Sync failed", { description: "Could not synchronize chapter applications." })
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

    const leaderIds = chapters.filter(c => c.leader_id).map(c => c.leader_id as string)
    const userMap: Record<string, { avatar_url: string | null; registration_number: string | null; phone_number: string | null; status: string | null; platform: string | null; region: string | null; constituency: string | null; country: string | null; profession: string | null }> = {}

    if (leaderIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, avatar_url, registration_number, phone_number, status, platform, region, constituency, country, profession')
        .in('id', leaderIds)
      for (const u of users || []) userMap[u.id] = u
    }

    setAllLeaders(
      chapters
        .filter(c => c.leader_name)
        .map(c => ({
          id: c.id,
          chapter_name: c.name,
          leader_name: c.leader_name,
          leader_id: c.leader_id,
          avatar_url: c.leader_id ? (userMap[c.leader_id]?.avatar_url ?? null) : null,
          registration_number: c.leader_id ? (userMap[c.leader_id]?.registration_number ?? null) : null,
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
        toast.success("Leader appointed", {
          description: `${name} has been authorized as a Chapter Leader.`,
        })
        fetchApplications(true)
      } else {
        toast.error("Authorization failed", {
          description: "Could not approve the application. Please try again.",
        })
      }
    } catch (err) {
      console.error('[LEADERSHIP] Approval failed:', err)
      toast.error("Authorization failed")
    }
  }

  const handleReject = async (id: string, name: string) => {
    try {
      const success = await adminService.rejectChapterApplication(id)
      if (success) {
        toast.error("Application rejected", {
          description: `${name}'s leadership request has been declined.`,
        })
        fetchApplications(true)
      }
    } catch (err) {
      console.error('[LEADERSHIP] Rejection failed:', err)
      toast.error("Rejection failed")
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
      setAppointMembers(members.filter(m => m.status === 'Active' || m.status === 'Approved'))
      setAppointChapters(chapters)
      if (chapters.length > 0) setSelectedChapterId(chapters[0].id)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setAppointLoading(false)
    }
  }

  const handleAppoint = async () => {
    if (!selectedMember) { toast.error('Select a member first'); return }
    if (!selectedChapterId) { toast.error('Select a chapter first'); return }
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

  const filteredApps = applications.filter((app: ChapterApplication) =>
    app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>stars</span>
            Leadership hub
          </h2>
          <div style={{ marginTop: 12 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            Vetting and authorization for movement chapter leadership and regional operations.
          </p>
        </div>
        <div className="actions">
          <button 
            className="btn btn-outline"
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isGenerating ? 'sync' : 'analytics'}</span>
            {isGenerating ? 'Compiling...' : 'Generate Audit'}
          </button>
          <button className="btn btn-primary" onClick={openAppointModal}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Direct Appoint
          </button>
        </div>
      </div>

      <div className="kpis">
        <TacticalKPI 
          label="Growth Rate"
          value="+12%"
          variant="green"
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
      <div className="panel" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>search</span>
          <input 
            id="search-applications"
            name="searchQuery"
            aria-label="Search applications"
            type="text" 
            placeholder="Search applications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, paddingLeft: 40, paddingRight: 16, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontWeight: 700, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ height: 40, padding: '0 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span> Filter Status
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ph" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', color: 'hsl(var(--on-surface))' }}>Active applications</span>
            <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>Review and approve new Chapter Leaders</p>
          </div>
          <button 
            onClick={() => fetchApplications()} 
            className="btn btn-outline"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync</span>
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
              <tr>
                <th style={{ padding: '14px 32px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Applicant</th>
                <th style={{ padding: '14px 32px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Proposed chapter</th>
                <th style={{ padding: '14px 32px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Geography</th>
                <th style={{ padding: '14px 32px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Status</th>
                <th style={{ padding: '14px 32px', textAlign: 'right', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td colSpan={5} style={{ padding: '24px 32px' }}>
                      <div style={{ height: 40, background: 'hsl(var(--container-low))', width: '100%', borderRadius: 4 }} className="animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 80, textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}>folder_open</span>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>No leadership applications found</p>
                  </td>
                </tr>
              ) : filteredApps.map((app: ChapterApplication) => (
                <tr key={app.id} style={{ borderBottom: '1px solid hsl(var(--border))' }} className="hover:bg-muted/10 transition-colors">
                  <td style={{ padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                        {app.applicant_name?.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>{app.applicant_name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>ID: {app.applicant_id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--accent))' }}>verified_user</span>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{app.proposed_chapter_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800 }}>{app.region}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>{app.constituency}</p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px' }}>
                    <span className="pill" style={{ 
                      background: app.status === 'Approved' ? 'rgba(0, 168, 89, 0.1)' : app.status === 'Pending' ? 'rgba(218, 165, 32, 0.1)' : 'rgba(206, 17, 38, 0.1)',
                      color: app.status === 'Approved' ? 'hsl(var(--primary))' : app.status === 'Pending' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))',
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: 'uppercase'
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                    {app.status === 'Pending' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleReject(app.id, app.applicant_name || 'Applicant')}
                        >
                          Reject
                        </button>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(app.id, app.applicant_name || 'Applicant')}
                        >
                          Appoint Leader
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Appoint Modal */}
      {appointModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setAppointModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '14px 20px', background: 'hsl(var(--on-surface))', borderTop: '4px solid hsl(var(--primary))' }}>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>Direct Appoint</p>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '3px 0 0', fontWeight: 600 }}>Select a verified member and assign them to a chapter role.</p>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {appointLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}>Loading members…</div>
              ) : (
                <>
                  {/* Member search + list */}
                  <div>
                    <label htmlFor="appoint-member-search" style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Select member</label>
                    <input aria-label="Search by name, region, reg. ID, or phone…"
                      id="appoint-member-search"
                      name="appointSearch"
                      type="text"
                      placeholder="Search by name, region, reg. ID, or phone…"
                      value={appointSearch}
                      onChange={e => setAppointSearch(e.target.value)}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, boxSizing: 'border-box', outline: 'none', marginBottom: 8 }}
                    />
                    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 4, maxHeight: 220, overflowY: 'auto' }}>
                      {appointMembers
                        .filter(m => {
                          const q = appointSearch.toLowerCase()
                          return !q ||
                            m.name.toLowerCase().includes(q) ||
                            (m.region || '').toLowerCase().includes(q) ||
                            m.id.toLowerCase().includes(q) ||
                            (m.phone || '').toLowerCase().includes(q)
                        })
                        .slice(0, 20)
                        .map(m => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMember(m)}
                            style={{
                              padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                              borderBottom: '1px solid hsl(var(--border))',
                              background: selectedMember?.id === m.id ? 'hsla(var(--primary), 0.06)' : '#fff',
                              borderLeft: selectedMember?.id === m.id ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                              transition: 'all 0.1s'
                            }}
                          >
                            <div style={{ width: 34, height: 34, borderRadius: 4, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0, color: 'hsl(var(--on-surface))' }}>
                              {m.avatarUrl
                                ? <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                : m.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{m.name}</p>
                              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                                {m.id}{m.phone && m.phone !== 'N/A' ? ` · ${m.phone}` : ''}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                                {m.region}{m.constituency ? ` · ${m.constituency}` : ''}
                              </p>
                            </div>
                            <span className={`pill ${m.status === 'Active' || m.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`}>{m.status}</span>
                          </div>
                        ))
                      }
                      {appointMembers.filter(m => {
                        const q = appointSearch.toLowerCase()
                        return !q ||
                          m.name.toLowerCase().includes(q) ||
                          (m.region || '').toLowerCase().includes(q) ||
                          m.id.toLowerCase().includes(q) ||
                          (m.phone || '').toLowerCase().includes(q)
                      }).length === 0 && (
                        <p style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>No members found.</p>
                      )}
                    </div>
                  </div>

                  {/* Chapter + role selects */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label htmlFor="appoint-chapter-select" style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Chapter</label>
                      {appointChapters.length === 0 ? (
                        <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12, color: 'hsl(var(--destructive))', fontWeight: 700 }}>
                          No chapters found
                        </div>
                      ) : (
                        <select
                          id="appoint-chapter-select"
                          name="selectedChapterId"
                          value={selectedChapterId}
                          onChange={e => setSelectedChapterId(e.target.value)}
                          style={{ width: '100%', height: 40, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }}
                        >
                          {appointChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}</div>
                    <div>
                      <label htmlFor="appoint-role-select" style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Role</label>
                      <select
                        id="appoint-role-select"
                        name="appointRole"
                        value={appointRole}
                        onChange={e => setAppointRole(e.target.value)}
                        style={{ width: '100%', height: 40, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }}
                      >
                        <option>Chapter Leader</option>
                        <option>Deputy Leader</option>
                        <option>Secretary</option>
                        <option>Treasurer</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected member preview */}
                  {selectedMember && (
                    <div style={{ background: 'hsla(var(--primary), 0.06)', border: '1px solid hsla(var(--primary), 0.2)', borderRadius: 4, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>check_circle</span>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>
                        <strong>{selectedMember.name}</strong> will be appointed as <strong>{appointRole}</strong>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 10, background: 'hsl(var(--container-low))' }}>
              <button onClick={() => setAppointModal(false)} className="btn btn-outline" style={{ flex: 1, height: 42 }}>Cancel</button>
              <button
                onClick={handleAppoint}
                disabled={!selectedMember || !selectedChapterId || isAppointing}
                className="btn btn-primary"
                style={{ flex: 1, height: 42 }}
              >
                {isAppointing
                  ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_reg</span>
                }
                {isAppointing ? 'Appointing…' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vision & Strategy Section */}
      {/* ── All Appointed Leaders ──────────────────────── */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', color: 'hsl(var(--on-surface))' }}>Appointed chapter officers</span>
            <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>All leaders registered across chapters</p>
          </div>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', opacity: 0.4, pointerEvents: 'none' }}>search</span>
            <input
              type="text"
              placeholder="Search leaders…"
              value={leadersSearch}
              onChange={e => setLeadersSearch(e.target.value)}
              style={{ height: 36, paddingLeft: 32, paddingRight: 12, border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, outline: 'none', background: 'hsl(var(--container-low))', width: 220, boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
              <tr>
                {['Officer', 'Chapter', 'Phone', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 24px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const q = leadersSearch.toLowerCase()
                const filtered = allLeaders.filter(l =>
                  !q ||
                  l.leader_name.toLowerCase().includes(q) ||
                  l.chapter_name.toLowerCase().includes(q) ||
                  (l.registration_number || '').toLowerCase().includes(q) ||
                  (l.phone_number || '').toLowerCase().includes(q)
                )
                if (filtered.length === 0) return (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center', fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                      {allLeaders.length === 0 ? 'No leaders have been appointed yet.' : 'No officers match your search.'}
                    </td>
                  </tr>
                )
                return filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 4, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0, overflow: 'hidden', color: 'hsl(var(--on-surface))' }}>
                          {l.avatar_url
                            ? <img src={l.avatar_url} alt={l.leader_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : l.leader_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                          }
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{l.leader_name}</p>
                          {l.registration_number && <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>{l.registration_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>
                      {l.chapter_name}
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                      {l.phone_number || '—'}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setViewLeader(l)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
                          View
                        </button>
                        <button
                          className="btn btn-dest btn-sm"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('chapters')
                              .update({ leader_name: 'Unassigned', leader_id: null })
                              .eq('id', l.id)
                            if (error) { toast.error('Failed to remove officer.'); return }
                            setAllLeaders(prev => prev.filter(x => x.id !== l.id))
                            toast.success(`${l.leader_name} removed from ${l.chapter_name}.`)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {filteredApps.some((a: ChapterApplication) => a.status === 'Pending') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>
          {filteredApps.filter((a: ChapterApplication) => a.status === 'Pending').slice(0, 2).map((app: ChapterApplication) => (
            <div key={`detail-${app.id}`} className="panel" style={{ padding: 32 }}>
              <span style={{ display: 'block', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginBottom: 16, letterSpacing: '0.05em' }}>Applicant vision statement</span>
              <blockquote style={{ borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 20, margin: '0 0 24px 0', fontStyle: 'italic', color: 'hsl(var(--on-surface))', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                "{app.vision_statement}"
              </blockquote>
              <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', padding: 20, borderRadius: 4 }}>
                <span style={{ display: 'block', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>Experience summary</span>
                <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.5, fontWeight: 500 }}>{app.experience_summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Leader profile modal */}
      {viewLeader && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setViewLeader(null)}
        >
          <div
            style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '14px 20px', background: 'hsl(var(--on-surface))', borderTop: '4px solid hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff' }}>Officer profile</p>
              <button onClick={() => setViewLeader(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 6, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: 'hsl(var(--on-surface))' }}>
                  {viewLeader.avatar_url
                    ? <img src={viewLeader.avatar_url} alt={viewLeader.leader_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : viewLeader.leader_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                  }
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 17, color: 'hsl(var(--on-surface))' }}>{viewLeader.leader_name}</p>
                  <p style={{ margin: '3px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{viewLeader.profession || 'Chapter Officer'}</p>
                  <span className={`pill ${viewLeader.status === 'Active' || viewLeader.status === 'Approved' ? 'pill-ok' : 'pill-warn'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                    {viewLeader.status || 'Member'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: 'badge', label: 'Registration ID', value: viewLeader.registration_number },
                  { icon: 'apartment', label: 'Chapter', value: viewLeader.chapter_name },
                  { icon: 'phone', label: 'Phone', value: viewLeader.phone_number },
                  { icon: 'public', label: 'Network', value: viewLeader.platform === 'GHANA' ? 'Ghana Network' : viewLeader.platform === 'DIASPORA' ? 'Diaspora Network' : viewLeader.platform },
                  { icon: 'location_on', label: 'Location', value: viewLeader.platform === 'GHANA' ? [viewLeader.constituency, viewLeader.region].filter(Boolean).join(', ') : viewLeader.country },
                ].map(row => row.value ? (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid hsl(var(--border))' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))', flexShrink: 0 }}>{row.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>{row.label}</p>
                      <p style={{ margin: '2px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{row.value}</p>
                    </div>
                  </div>
                ) : null)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
