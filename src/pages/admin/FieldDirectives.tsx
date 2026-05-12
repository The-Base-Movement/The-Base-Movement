import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { FieldDirective, FieldReport } from '@/services/adminService'
import { toast } from 'sonner'

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
      toast.success(`Report ${status.toLowerCase()}.`)
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
    }
  }

  const priorityPill = (p: string) => {
    if (p === 'Urgent') return <span className="pill pill-err">{p}</span>
    if (p === 'High')   return <span className="pill pill-warn">{p}</span>
    return <span className="pill pill-mute">{p}</span>
  }

  const statusPill = (s: string) => {
    if (s === 'Verified') return <span className="pill pill-ok">Verified</span>
    if (s === 'Rejected') return <span className="pill pill-err">Rejected</span>
    return <span className="pill pill-warn">Pending</span>
  }

  const fieldStyle = {
    width: '100%',
    height: 40,
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    padding: '0 12px',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    outline: 'none',
    background: '#fff',
    color: 'hsl(var(--on-surface))',
  }
  const labelStyle = {
    display: 'block',
    fontSize: 9.5,
    fontWeight: 800,
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '.06em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Public Sans', sans-serif",
    marginBottom: 5,
  }

  const activeDirectives = directives.filter(d => d.status !== 'Completed')
  const pendingReports   = reports.filter(r => r.status === 'Pending')
  const verifiedReports  = reports.filter(r => r.status === 'Verified')
  const totalPoints      = directives.reduce((s, d) => s + (d.points_awarded || 0), 0)

  if (loading) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }}>flag</span>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Synchronizing tactical feed…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top */}
      <div className="top">
        <div>
          <div className="crumbs">Admin · Ground game · Field directives</div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--destructive))' }}>flag</span>
            Field directives
          </h2>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bar_chart</span>Analytics
          </button>
          <button className="btn btn-dest btn-sm" onClick={() => setIsCreating(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>Issue directive
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis">
        <div className="kpi r">
          <div className="l">Active directives</div>
          <div className="v">{activeDirectives.length}</div>
          <div className="d">{directives.length} total issued</div>
        </div>
        <div className="kpi g">
          <div className="l">Pending reports</div>
          <div className="v">{pendingReports.length}</div>
          <div className="d dn">{pendingReports.length > 0 ? 'Awaiting review' : 'Queue clear'}</div>
        </div>
        <div className="kpi gr">
          <div className="l">Verified actions</div>
          <div className="v">{verifiedReports.length}</div>
          <div className="d">of {reports.length} reports</div>
        </div>
        <div className="kpi k">
          <div className="l">Points in circulation</div>
          <div className="v">{totalPoints.toLocaleString()}</div>
          <div className="d">across all directives</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="twocol" style={{ gridTemplateColumns: '1fr 1.4fr' }}>

        {/* Directives list */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Active directives</h3>
              <div className="meta">{activeDirectives.length} in field</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsCreating(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>New
            </button>
          </div>
          {directives.length === 0 ? (
            <div style={{ padding: '48px 18px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>flag</span>
              <p style={{ margin: 0, fontSize: 12, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>No directives issued yet.</p>
            </div>
          ) : (
            <div>
              {directives.map((d, i, arr) => (
                <div key={d.id} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {priorityPill(d.priority)}
                      <span className="pill pill-mute">{d.target_type}</span>
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>
                      {d.points_awarded} pts
                    </span>
                  </div>
                  <p style={{ margin: '0 0 4px', fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 13, lineHeight: 1.35 }}>{d.title}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.5 }}>{d.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>schedule</span>
                    <span style={{ fontSize: 10.5, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>
                      {d.deadline ? new Date(d.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports feed */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Situational awareness feed</h3>
              <div className="meta">{reports.length} reports · {pendingReports.length} pending</div>
            </div>
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tune</span>Filter
            </button>
          </div>

          {reports.length === 0 ? (
            <div style={{ padding: '48px 18px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>sensors</span>
              <p style={{ margin: 0, fontSize: 12, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Situational feed is quiet.</p>
            </div>
          ) : (
            <div>
              {reports.map((report, i, arr) => (
                <div key={report.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  {/* Media */}
                  {report.media_url && (
                    <div style={{ aspectRatio: '16/7', overflow: 'hidden', background: '#181d19', position: 'relative' }}>
                      <img src={report.media_url} alt="Field report" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} loading="lazy" decoding="async" />
                      <div style={{ position: 'absolute', top: 10, left: 10 }}>
                        {statusPill(report.status)}
                      </div>
                      {report.location_lat && (
                        <div style={{ position: 'absolute', bottom: 10, left: 10, padding: '3px 8px', background: 'rgba(0,0,0,.55)', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'hsl(var(--destructive))' }}>location_on</span>
                          <span style={{ fontSize: 10, fontFamily: "'Public Sans'", fontWeight: 800, color: '#fff' }}>GPS verified</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '14px 18px' }}>
                    {/* Reporter row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: '#f1f5ee', flexShrink: 0 }}>
                        <img src={`https://i.pravatar.cc/56?u=${report.member_id}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12 }}>Member #{report.member_id.slice(0, 8).toUpperCase()}</b>
                        <span style={{ display: 'block', fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>
                          {new Date(report.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!report.media_url && statusPill(report.status)}
                    </div>

                    <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'hsl(var(--on-surface))', lineHeight: 1.55 }}>
                      "{report.report_text || 'Completed tactical directive as requested. Awaiting point verification.'}"
                    </p>

                    {report.status === 'Pending' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }} onClick={() => handleVerify(report.id, 'Rejected')}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>Reject
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleVerify(report.id, 'Verified')}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>Verify
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

      {/* Issue directive modal */}
      {isCreating && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,19,16,.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setIsCreating(false) }}
        >
          <div className="animate-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 32px 64px -16px rgba(0,0,0,.4)' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', color: '#fff', padding: '20px 22px', borderTop: '3px solid hsl(var(--destructive))', position: 'relative' }}>
              <button
                onClick={() => setIsCreating(false)}
                style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))' }}>flag</span>
                <div>
                  <h3 style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 16, margin: 0 }}>Issue new directive</h3>
                  <p style={{ fontFamily: "'Public Sans'", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,.55)', margin: 0, marginTop: 2 }}>Deploy tactical objectives to the field</p>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Directive title <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Regional Flyer Blitz"
                    style={fieldStyle}
                    value={newDirective.title}
                    onChange={e => setNewDirective({ ...newDirective, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Target level</label>
                  <select
                    style={{ ...fieldStyle, appearance: 'none' as const }}
                    value={newDirective.target_type}
                    onChange={e => setNewDirective({ ...newDirective, target_type: e.target.value as FieldDirective['target_type'] })}
                  >
                    <option>Regional</option>
                    <option>Chapter</option>
                    <option>Global</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Objective description <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                <textarea
                  rows={3}
                  placeholder="Describe the tactical goal for field agents..."
                  style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.55 }}
                  value={newDirective.description}
                  onChange={e => setNewDirective({ ...newDirective, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select
                    style={{ ...fieldStyle, appearance: 'none' as const }}
                    value={newDirective.priority}
                    onChange={e => setNewDirective({ ...newDirective, priority: e.target.value as FieldDirective['priority'] })}
                  >
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Points awarded</label>
                  <input
                    type="number"
                    style={fieldStyle}
                    value={newDirective.points_awarded}
                    onChange={e => setNewDirective({ ...newDirective, points_awarded: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Deadline</label>
                  <input
                    type="date"
                    style={fieldStyle}
                    value={newDirective.deadline}
                    onChange={e => setNewDirective({ ...newDirective, deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setIsCreating(false)} disabled={isSubmitting}>Cancel</button>
              <button className="btn btn-dest" onClick={handleIssueDirective} disabled={isSubmitting} style={{ minWidth: 160 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send</span>
                {isSubmitting ? 'Deploying…' : 'Deploy directive →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
