import { useState, useEffect, useCallback } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import { toast } from 'sonner'

export default function LeadershipHub() {
  const [applications, setApplications] = useState<ChapterApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await adminService.getChapterApplications()
      setApplications(data)
    } catch (err) {
      console.error('[LEADERSHIP] Failed to fetch applications:', err)
      toast.error("Sync failed", {
        description: "Could not synchronize chapter applications.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleApprove = async (id: string, name: string) => {
    try {
      const success = await adminService.approveChapterApplication(id)
      if (success) {
        toast.success("Leader appointed", {
          description: `${name} has been authorized as a Chapter Leader.`,
        })
        fetchApplications(true)
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
      // Simulate movement audit generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Movement Audit Ready", {
        description: "Detailed leadership metrics have been compiled.",
      })
    } catch (err) {
      console.error('[AUDIT] Report generation failed:', err)
      toast.error("Generation failed", {
        description: "Could not compile movement audit data.",
      })
    } finally {
      setIsGenerating(false)
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
          <button className="btn btn-primary" onClick={() => toast.info("Chapter registration protocol initiated.")}>
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

      {/* Vision & Strategy Section */}
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
    </div>
  )
}
