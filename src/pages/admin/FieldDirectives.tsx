import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { FieldDirective, FieldReport } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const inputSt: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1px solid hsl(var(--border))', background: '#fff', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }
const labelSt: React.CSSProperties = { fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }
const pillBase: React.CSSProperties = { padding: '2px 10px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, fontFamily: "'Public Sans', sans-serif" }

const priorityStyle = (p: string): React.CSSProperties => {
  if (p === 'Urgent') return { background: 'rgba(239,68,68,0.1)', color: 'hsl(var(--destructive))', border: '1px solid rgba(239,68,68,0.2)' }
  if (p === 'High') return { background: 'rgba(245,158,11,0.1)', color: 'hsl(var(--accent))', border: '1px solid rgba(245,158,11,0.2)' }
  return { background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }
}

const reportStatusStyle = (s: string): React.CSSProperties => {
  if (s === 'Verified') return { background: 'rgba(34,197,94,0.1)', color: 'hsl(var(--primary))', border: '1px solid rgba(34,197,94,0.2)' }
  if (s === 'Rejected') return { background: 'rgba(239,68,68,0.1)', color: 'hsl(var(--destructive))', border: '1px solid rgba(239,68,68,0.2)' }
  return { background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }
}

export default function FieldDirectives() {
  const [directives, setDirectives] = useState<FieldDirective[]>([])
  const [reports, setReports] = useState<FieldReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newDirective, setNewDirective] = useState<Omit<FieldDirective, 'id' | 'status'>>({
    title: '',
    description: '',
    target_type: 'Regional',
    priority: 'Normal',
    points_awarded: 50,
    deadline: '',
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [directivesData, reportsData] = await Promise.all([
          adminService.getFieldDirectives(),
          adminService.getFieldReports(),
        ])
        setDirectives(directivesData)
        setReports(reportsData)
      } catch {
        toast.error('Tactical synchronization failed.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleIssueDirective = async () => {
    if (!newDirective.title || !newDirective.description) {
      toast.error('Title and objective description are required.')
      return
    }
    setIsSubmitting(true)
    const success = await adminService.createFieldDirective({ ...newDirective })
    if (success) {
      toast.success('Directive deployed to the field.')
      setIsCreating(false)
      setNewDirective({ title: '', description: '', target_type: 'Regional', priority: 'Normal', points_awarded: 50, deadline: '' })
      const updated = await adminService.getFieldDirectives()
      setDirectives(updated)
    } else {
      toast.error('Failed to deploy directive.')
    }
    setIsSubmitting(false)
  }

  const handleVerify = async (reportId: string, status: 'Verified' | 'Rejected') => {
    const success = await adminService.verifyFieldReport(reportId, status)
    if (success) {
      toast.success(`Report ${status.toLowerCase()} successfully.`)
      const updated = await adminService.getFieldReports()
      setReports(updated)
    } else {
      toast.error('Failed to update report status.')
    }
  }

  const activeDirectives = directives.filter(d => d.status === 'Active')
  const pendingReports = reports.filter(r => r.status === 'Pending')
  const verifiedReports = reports.filter(r => r.status === 'Verified')
  const totalPointsEarned = verifiedReports.reduce((sum, report) => {
    const directive = directives.find(d => d.id === report.directive_id)
    return sum + (directive?.points_awarded || 0)
  }, 0)

  if (loading) {
    return (
      <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))', animation: 'spin 1s linear infinite' }}>hourglass_empty</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Synchronizing tactical feed…</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>flag</span>
            Field directives
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Platform-wide deployment of tactical objectives and field verification protocols.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/admin/mobilization-metrics" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bar_chart</span>
            Analytics
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
            Issue directive
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI label="Field Objectives" value={activeDirectives.length} description="Active directives" trend={{ direction: 'neutral', value: 'Vault' }} />
        <TacticalKPI label="Awaiting Review" value={pendingReports.length} description="Pending reports" trend={{ direction: pendingReports.length > 0 ? 'down' : 'neutral', value: 'Queue' }} />
        <TacticalKPI label="Verified Actions" value={verifiedReports.length} description="Successful missions" trend={{ direction: 'up', value: 'Elite' }} />
        <TacticalKPI label="Tactical Influence" value={totalPointsEarned.toLocaleString()} description="Points distributed" trend={{ direction: 'up', value: 'Pulse' }} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="xl:grid-cols-[1fr_2fr]">
        {/* Active Directives */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Active directives</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Operational field objectives</div>
            </div>
            <button className="btn btn-sm" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCreating(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            </button>
          </div>
          {directives.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))' }}>flag</span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No directives deployed</p>
            </div>
          ) : (
            <div style={{ maxHeight: 800, overflowY: 'auto' }}>
              {directives.map(d => (
                <div key={d.id} style={{ padding: '20px', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span style={{ ...pillBase, ...priorityStyle(d.priority) }}>{d.priority}</span>
                      <span style={{ ...pillBase, background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }}>{d.target_type}</span>
                    </div>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--accent))' }}>+{d.points_awarded} pts</span>
                  </div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>{d.title}</div>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 10 }}>{d.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                    {d.deadline ? new Date(d.deadline).toLocaleDateString() : 'Indefinite'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Situational Awareness Feed */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Situational awareness feed</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Real-time field intelligence</div>
            </div>
            <button className="btn btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>filter_list</span>
              Filter
            </button>
          </div>
          {reports.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))' }}>sensors</span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feed is quiet</p>
            </div>
          ) : (
            <div style={{ maxHeight: 800, overflowY: 'auto' }}>
              {reports.map(report => (
                <div key={report.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {report.media_url && (
                    <div style={{ position: 'relative', aspectRatio: '21/9', overflow: 'hidden', background: 'hsl(var(--container-low))' }}>
                      <img src={report.media_url} alt="Field report" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                        <span style={{ ...pillBase, ...reportStatusStyle(report.status), background: report.status === 'Verified' ? 'hsl(var(--primary))' : report.status === 'Rejected' ? 'hsl(var(--destructive))' : 'rgba(255,255,255,0.9)', color: (report.status === 'Verified' || report.status === 'Rejected') ? '#fff' : 'hsl(var(--on-surface))' }}>{report.status}</span>
                      </div>
                      {report.location_lat && (
                        <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}>sensors</span>
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GPS Verified</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid hsl(var(--border))', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={`https://i.pravatar.cc/100?u=${report.member_id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Patriot #{report.member_id.slice(0, 8).toUpperCase()}</div>
                          <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>{new Date(report.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      {!report.media_url && (
                        <span style={{ ...pillBase, ...reportStatusStyle(report.status) }}>{report.status}</span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: report.status === 'Pending' ? 12 : 0 }}>
                      {report.report_text ? `"${report.report_text}"` : 'No field notes provided.'}
                    </p>
                    {report.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-dest btn-sm" style={{ flex: 1 }} onClick={() => handleVerify(report.id, 'Rejected')}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                          Reject
                        </button>
                        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleVerify(report.id, 'Verified')}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          Verify
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Directive Modal */}
      {isCreating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
             onClick={() => setIsCreating(false)}>
          <div style={{ background: '#fff', borderRadius: 6, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}>flag</span>
                Issue new directive
              </div>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>Deploy tactical field objectives to the movement's national network.</p>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelSt}>Directive title</label>
                  <input style={inputSt} placeholder="e.g. Regional Flyer Blitz" value={newDirective.title} onChange={e => setNewDirective({ ...newDirective, title: e.target.value })} />
                </div>
                <div>
                  <label style={labelSt}>Target level</label>
                  <select style={{ ...inputSt, appearance: 'none' }} value={newDirective.target_type} onChange={e => setNewDirective({ ...newDirective, target_type: e.target.value as FieldDirective['target_type'] })}>
                    <option>Regional</option>
                    <option>Chapter</option>
                    <option>Global</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelSt}>Objective description</label>
                <textarea
                  style={{ ...inputSt, height: 100, padding: '10px 12px', resize: 'none', lineHeight: 1.6 }}
                  placeholder="Describe the tactical goal for field agents…"
                  value={newDirective.description}
                  onChange={e => setNewDirective({ ...newDirective, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelSt}>Priority</label>
                  <select style={{ ...inputSt, appearance: 'none' }} value={newDirective.priority} onChange={e => setNewDirective({ ...newDirective, priority: e.target.value as FieldDirective['priority'] })}>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={labelSt}>Points</label>
                  <input style={inputSt} type="number" value={newDirective.points_awarded} onChange={e => setNewDirective({ ...newDirective, points_awarded: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={labelSt}>Deadline</label>
                  <input style={inputSt} type="date" value={newDirective.deadline} onChange={e => setNewDirective({ ...newDirective, deadline: e.target.value })} />
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsCreating(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn btn-dest" style={{ flex: 1 }} onClick={handleIssueDirective} disabled={isSubmitting}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send</span>
                {isSubmitting ? 'Deploying…' : 'Deploy directive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
