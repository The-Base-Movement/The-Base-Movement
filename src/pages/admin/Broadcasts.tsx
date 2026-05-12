import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Broadcast } from '@/services/adminService'

export default function Broadcasts() {
  const navigate = useNavigate()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcastMetrics, setBroadcastMetrics] = useState<Record<string, { total: number; read: number }>>({})

  const fetchMetrics = useCallback(async (id: string) => {
    try {
      const stats = await adminService.getBroadcastMetrics(id)
      setBroadcastMetrics(prev => ({ ...prev, [id]: stats }))
    } catch {
      // fail silently
    }
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const bData = await adminService.getBroadcasts()
      setBroadcasts(bData)
      bData.slice(0, 5).forEach(b => fetchMetrics(b.id))
    } catch {
      toast.error('Failed to load broadcast history.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchMetrics])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredBroadcasts = broadcasts.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const priorityPill = (p: string) => {
    if (p === 'Urgent') return 'pill pill-err'
    if (p === 'High') return 'pill pill-warn'
    return 'pill pill-mute'
  }

  const targetLabel = (type: string, value?: string) =>
    type === 'ALL' ? 'National' : value ?? type

  const templates = [
    { title: 'National Membership Drive', type: 'ALL', priority: 'High', content: 'All chapters are invited to initiate regional registration drives this weekend. Goal: 10,000 new verified members.' },
    { title: 'Regional Strategic Briefing', type: 'REGION', priority: 'Normal', content: 'Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT.' },
    { title: 'Level Red Emergency Alert', type: 'ALL', priority: 'Urgent', content: 'IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates.' },
    { title: 'Constituency Outreach', type: 'CONSTITUENCY', priority: 'Normal', content: 'Local chapter engagement initiative starting in your area. Please coordinate with regional leads.' },
  ]

  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            Communication hub
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>campaign</span>
            Communication hub
          </h2>
        </div>
        <div className="actions">
          <button className="btn btn-dest btn-sm" onClick={() => navigate('/admin/broadcasts/new')}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
            New broadcast
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 20 }}>
        <div className="kpi k">
          <div className="kpi-label">Total broadcasts</div>
          <div className="kpi-val">{isLoading ? '—' : broadcasts.length}</div>
          <div className="kpi-sub">All deployments</div>
        </div>
        <div className="kpi r">
          <div className="kpi-label">Urgent alerts</div>
          <div className="kpi-val">{isLoading ? '—' : broadcasts.filter(b => b.priority === 'Urgent').length}</div>
          <div className="kpi-sub">Critical priority</div>
        </div>
        <div className="kpi g">
          <div className="kpi-label">Field saturation</div>
          <div className="kpi-val">100%</div>
          <div className="kpi-sub">All members reached</div>
        </div>
        <div className="kpi gr">
          <div className="kpi-label">HQ connection</div>
          <div className="kpi-val">24/7</div>
          <div className="kpi-sub">Direct uptime</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* Broadcast history */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Broadcast history</h3>
              <div className="meta">HQ-to-field transmission log</div>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
              <input
                type="text"
                placeholder="Search broadcasts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  height: 32, paddingLeft: 30, paddingRight: 10,
                  border: '1px solid hsl(var(--border))', borderRadius: 4,
                  fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 700,
                  outline: 'none', width: 200, background: '#fff',
                  color: 'hsl(var(--on-surface))',
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '44px 18px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))' }}>hourglass_empty</span>
              <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Retrieving comm logs...</p>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div style={{ padding: '44px 18px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))' }}>campaign</span>
              <p style={{ marginTop: 8, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No broadcasts found</p>
            </div>
          ) : (
            <div>
              {filteredBroadcasts.map((b, i) => {
                const metrics = broadcastMetrics[b.id]
                const readPct = metrics && metrics.total > 0 ? Math.round((metrics.read / metrics.total) * 100) : null
                return (
                  <div key={b.id} style={{ padding: '14px 18px', borderBottom: i < filteredBroadcasts.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
                      <span className={priorityPill(b.priority)}>{b.priority}</span>
                      <span className="pill pill-mute">{targetLabel(b.target_type, b.target_value)}</span>
                    </div>
                    <h4 style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 800, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))' }}>
                      {b.title}
                    </h4>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.55, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                      {b.content}
                    </p>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                        {new Date(b.created_at).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--primary))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check_circle</span>
                        Confirmed
                      </span>
                      {metrics && readPct !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                            {metrics.read}/{metrics.total} read
                          </span>
                          <div style={{ width: 56, height: 4, background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${readPct}%`, height: '100%', background: 'hsl(var(--primary))', transition: 'width 0.8s' }} />
                          </div>
                        </div>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: 'auto', fontSize: 11 }}
                        onClick={() => fetchMetrics(b.id)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
                        Refresh metrics
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Mobilization presets */}
          <div className="panel">
            <div className="ph">
              <div>
                <h3>Mobilization presets</h3>
                <div className="meta">Quick-start protocols</div>
              </div>
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onClick={() => navigate('/admin/broadcasts/new', { state: { template: t } })}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.background = 'hsl(var(--container-low))' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span className={priorityPill(t.priority)}>{t.priority}</span>
                    <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>{t.type}</span>
                  </div>
                  <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', display: 'block', marginBottom: 3 }}>{t.title}</b>
                  <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.45, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, maxHeight: 30, overflow: 'hidden' }}>
                    {t.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Red */}
          <div className="panel" style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', color: '#fff', overflow: 'hidden', position: 'relative', borderTop: '3px solid hsl(var(--destructive))' }}>
            <div style={{ position: 'absolute', right: -20, bottom: -20, pointerEvents: 'none', opacity: 0.06 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 130, color: '#fff' }}>campaign</span>
            </div>
            <div style={{ padding: '18px', position: 'relative', zIndex: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--destructive))', display: 'block', marginBottom: 10 }}>crisis_alert</span>
              <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: '#fff', margin: '0 0 8px' }}>Protocol red</h3>
              <p style={{ margin: '0 0 16px', fontSize: 11.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.55, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts.
              </p>
              <button
                className="btn btn-dest"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/admin/broadcasts/new', { state: { template: templates[2] } })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>warning</span>
                Trigger tactical alert
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
