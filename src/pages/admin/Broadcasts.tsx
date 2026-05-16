import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Broadcast } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

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

  const priorityStyle = (p: string): React.CSSProperties => {
    if (p === 'Urgent') return { background: 'rgba(239,68,68,0.1)', color: 'hsl(var(--destructive))', border: '1px solid rgba(239,68,68,0.2)' }
    if (p === 'High') return { background: 'rgba(245,158,11,0.1)', color: 'hsl(var(--accent))', border: '1px solid rgba(245,158,11,0.2)' }
    return { background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }
  }

  const targetLabel = (type: string, value?: string) =>
    type === 'ALL' ? 'National' : value ?? type

  const templates = [
    { title: 'National Membership Drive', type: 'ALL', priority: 'High', content: 'All chapters are invited to initiate regional registration drives this weekend. Goal: 10,000 new verified members.' },
    { title: 'Regional Strategic Briefing', type: 'REGION', priority: 'Normal', content: 'Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT.' },
    { title: 'Level Red Emergency Alert', type: 'ALL', priority: 'Urgent', content: 'IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates.' },
    { title: 'Constituency Outreach', type: 'CONSTITUENCY', priority: 'Normal', content: 'Local chapter engagement initiative starting in your area. Please coordinate with regional leads.' },
  ]

  const pillBase: React.CSSProperties = { padding: '2px 10px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, fontFamily: "'Public Sans', sans-serif" }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>campaign</span>
            Communication hub
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Platform-wide transmission and regional mobilization protocols.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/broadcasts/new')}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
          New broadcast
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <TacticalKPI label="Communication" value={isLoading ? '—' : broadcasts.length} description="Total deployments" trend={{ direction: 'neutral', value: 'Vault' }} />
        <TacticalKPI label="Priority" value={isLoading ? '—' : broadcasts.filter(b => b.priority === 'Urgent').length} description="Urgent alerts" trend={{ direction: 'down', value: 'Critical' }} />
        <TacticalKPI label="Saturation" value="100%" description="Member reach" trend={{ direction: 'up', value: 'Pulse' }} />
        <TacticalKPI label="HQ Connection" value="24/7" description="Direct uplink" trend={{ direction: 'up', value: 'Online' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="xl:grid-cols-[1fr_320px]">
        {/* Broadcast history */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Broadcast history</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>HQ-to-field transmission log</div>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
              <input name="searchQuery" id="input-ee6569"
                type="text"
                placeholder="Search broadcasts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ height: 36, paddingLeft: 30, paddingRight: 12, border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', background: '#fff', color: 'hsl(var(--on-surface))', width: 220, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--border))', animation: 'spin 1s linear infinite' }}>hourglass_empty</span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Retrieving comm logs…</p>
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--border))' }}>campaign</span>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No broadcasts found</p>
            </div>
          ) : (
            <div style={{ maxHeight: 800, overflowY: 'auto' }}>
              {filteredBroadcasts.map((b) => {
                const metrics = broadcastMetrics[b.id]
                const readPct = metrics && metrics.total > 0 ? Math.round((metrics.read / metrics.total) * 100) : null
                return (
                  <div key={b.id} style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <span style={{ ...pillBase, ...priorityStyle(b.priority) }}>{b.priority}</span>
                      <span style={{ ...pillBase, background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }}>
                        {targetLabel(b.target_type, b.target_value)}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>{b.title}</div>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 12 }}>{b.content}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                          {new Date(b.created_at).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--primary))' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          Confirmed
                        </span>
                        {metrics && readPct !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{metrics.read}/{metrics.total} Read</span>
                            <div style={{ width: 64, height: 4, background: 'hsl(var(--border))', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'hsl(var(--primary))', width: `${readPct}%`, transition: 'width 1s ease' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={() => fetchMetrics(b.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
                        Refresh
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mobilization presets */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Mobilization presets</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Quick-start protocols</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>bar_chart</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map((t, i) => (
                <div
                  key={i}
                  onClick={() => navigate('/admin/broadcasts/new', { state: { template: t } })}
                  style={{ padding: '12px 14px', border: '1px solid hsl(var(--border))', borderRadius: 4, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary))')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...pillBase, ...priorityStyle(t.priority) }}>{t.priority}</span>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.type}</span>
                  </div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{t.title}</div>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Red */}
          <div style={{ background: 'hsl(var(--on-surface))', borderRadius: 6, borderTop: '4px solid hsl(var(--destructive))', padding: 28, position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 160, color: '#fff' }}>campaign</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--destructive))' }}>warning</span>
              </div>
              <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 10 }}>Protocol Red</h3>
              <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
                Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts.
              </p>
              <button
                className="btn btn-dest"
                style={{ width: '100%' }}
                onClick={() => navigate('/admin/broadcasts/new', { state: { template: templates[2] } })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>error</span>
                Trigger Tactical Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
