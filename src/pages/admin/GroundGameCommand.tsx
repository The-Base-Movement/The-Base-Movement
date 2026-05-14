import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/types/admin'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

export default function GroundGameCommand() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<CanvassingCampaign[]>([])
  const [transportReqs, setTransportReqs] = useState<GOTVTransportRequest[]>([])
  const [fieldLogs, setFieldLogs] = useState<CanvasserLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, t, l] = await Promise.all([
        adminService.getCanvassingCampaigns(),
        adminService.getGOTVTransportRequests(),
        adminService.getCanvasserLogs()
      ])
      setCampaigns(c); setTransportReqs(t); setFieldLogs(l)
    } catch {
      toast.error('Failed to synchronize with Ground Game servers.')
    } finally { setLoading(false) }
  }

  const handleDispatch = async (id: string) => {
    const ok = await adminService.updateTransportRequest(id, 'DISPATCHED')
    if (ok) {
      toast.success('Logistics asset dispatched.')
      setTransportReqs(p => p.map(r => r.id === id ? { ...r, status: 'DISPATCHED' } : r))
    }
  }

  // Derived KPIs
  const today = new Date().toISOString().slice(0, 10)
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
  const todayLogs = fieldLogs.filter(l => l.created_at?.slice(0, 10) === today)
  const canvassersOnline = new Set(todayLogs.map(l => l.canvasser_id)).size
  const doorsKnocked = todayLogs.length
  const signupsToday = todayLogs.filter(l => l.interaction_result === 'STRONG_SUPPORT').length
  const totalGoal = campaigns.reduce((a, c) => a + (c.goal_contacts || 0), 0)
  const routePct = totalGoal > 0 && doorsKnocked > 0 ? Math.min(99, Math.round((doorsKnocked / totalGoal) * 100)) : 76

  // Leaderboard from fieldLogs
  const lbMap: Record<string, number> = {}
  fieldLogs.forEach(l => { lbMap[l.canvasser_id] = (lbMap[l.canvasser_id] || 0) + 1 })
  const leaderboard = Object.entries(lbMap).sort(([, a], [, b]) => b - a).slice(0, 5)
  const topScore = leaderboard[0]?.[1] || 1

  const PLACEHOLDER_LB = [
    { name: 'Yaw Kankam', area: 'Lapaz 04 · 4h 12m', score: 32, pct: 90 },
    { name: 'Esi Mensah', area: 'Lapaz 04 · 3h 48m', score: 28, pct: 78 },
    { name: 'Akua Owusu', area: 'Achimota 07 · 3h 02m', score: 22, pct: 62 },
    { name: 'Kweku Donkor', area: 'Lapaz 04 · 2h 41m', score: 18, pct: 50 },
    { name: 'Ama Sarpong', area: 'Achimota 07 · 2h 18m', score: 15, pct: 42 },
  ]

  const PLACEHOLDER_ROUTES = [
    { name: 'Route A-12 · Lapaz market loop', lead: 'Yaw K.', knocked: 184, goal: 240, signups: 32, time: '4h 12m', status: 'ok', pct: 78 },
    { name: 'Route A-13 · Lapaz school corridor', lead: 'Esi M.', knocked: 152, goal: 200, signups: 28, time: '3h 48m', status: 'ok', pct: 76 },
    { name: 'Route B-04 · Achimota north', lead: 'Akua O.', knocked: 96, goal: 200, signups: 22, time: '3h 02m', status: 'warn', pct: 48 },
    { name: 'Route C-09 · Awoshie estates', lead: 'Naa A.', knocked: 22, goal: 180, signups: 4, time: 'idle 1h+', status: 'bad', pct: 12 },
  ]

  if (loading) {
    return (
      <div className="main flex items-center justify-center" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold text-primary uppercase tracking-[.06em] animate-pulse">Initializing ground game protocols…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* Header */}
      <div className="top">
        <div>
          <div className="crumbs">Command → Ground game</div>
          <h2>Ground game · Greater Accra</h2>
          <div className="bl"><div /><div /><div /></div>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12.5, marginTop: 2, maxWidth: 560, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Daily field operations — turf assignments, canvasser activity, and route progress for branch 04.</p>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>place</span>Switch region
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/ground-game/deploy')}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>Assign turf
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[18px]">
        <TacticalKPI 
          label="Field Operations"
          value={canvassersOnline || 28}
          variant="red"
          description="Canvassers currently active and synchronized with command center"
          delta={`of ${activeCampaigns.length > 0 ? activeCampaigns.length * 8 : 42} assigned today`}
        />
        <TacticalKPI 
          label="Engagement"
          value={doorsKnocked > 0 ? doorsKnocked.toLocaleString() : '1,184'}
          variant="gold"
          description="Total households reached through door-to-door mobilization"
          delta="▲ on track · 64% of day"
        />
        <TacticalKPI 
          label="Mobilization"
          value={signupsToday || 214}
          variant="green"
          description="Strategic sign-ups and support commitments secured today"
          delta="avg 7.6 per canvasser"
        />
        <TacticalKPI 
          label="Intelligence"
          value={`${routePct}%`}
          variant="black"
          description="Overall route completion progress for current tactical assignments"
          delta={activeCampaigns.length > 0 ? `${activeCampaigns.filter(c => (c.goal_contacts || 0) > 200).length} routes flagged behind` : '2 routes flagged behind'}
        />
      </div>

      {/* Map + Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Live turf map */}
        <div className="panel">
          <div className="ph">
            <h3>Live turf map · Lapaz 04</h3>
            <span className="meta">updated 14 s ago</span>
          </div>
          <div style={{ height: 440, background: '#f1f5ee', position: 'relative', overflow: 'hidden' }}>
            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,107,63,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,107,63,.04) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
            {/* Roads */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '35%', height: 14, background: '#dfe4dd' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '62%', height: 8, background: '#dfe4dd' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '28%', width: 12, background: '#dfe4dd' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '68%', width: 8, background: '#dfe4dd' }} />
            {/* Parks */}
            <div style={{ position: 'absolute', width: 120, height: 120, left: '10%', top: '8%', background: 'rgba(0,107,63,.12)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', width: 80, height: 80, left: '75%', top: '72%', background: 'rgba(0,107,63,.12)', borderRadius: '50%' }} />
            {/* Water */}
            <div style={{ position: 'absolute', right: -40, bottom: -40, width: 200, height: 140, background: 'rgba(0,107,180,.1)', borderRadius: '60% 40% 50% 50%' }} />
            {/* Turf outlines */}
            {[
              { label: 'Turf A · Active', style: { left: '35%', top: '42%', width: 140, height: 140 } },
              { label: 'Turf B · Active', style: { left: '62%', top: '25%', width: 100, height: 100 } },
            ].map(t => (
              <div key={t.label} style={{ position: 'absolute', border: '2px dashed hsl(var(--accent))', borderRadius: '50%', opacity: .6, ...t.style }}>
                <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', background: 'hsl(var(--accent))', color: '#fff', padding: '2px 8px', fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 3, whiteSpace: 'nowrap' }}>
                  {t.label}
                </div>
              </div>
            ))}
            {/* Canvasser pins — use field logs or placeholders */}
            {(fieldLogs.length > 0 ? fieldLogs.slice(0, 5) : [
              { id: 'yaw', canvasser_id: 'YAW', interaction_result: 'STRONG_SUPPORT', pos: { left: '40%', top: '48%' }, label: 'Yaw K.', sub: '32 sign-ups' },
              { id: 'esi', canvasser_id: 'ESI', interaction_result: 'STRONG_SUPPORT', pos: { left: '65%', top: '30%' }, label: 'Esi M.', sub: '28 sign-ups' },
              { id: 'kofi', canvasser_id: 'KFI', interaction_result: 'UNDECIDED', pos: { left: '22%', top: '70%' }, label: 'Kofi A.', sub: 'idle · 14 m' },
              { id: 'akua', canvasser_id: 'AKU', interaction_result: 'STRONG_SUPPORT', pos: { left: '78%', top: '68%' }, label: 'Akua O.', sub: '22 sign-ups' },
              { id: 'naa', canvasser_id: 'NAA', interaction_result: 'HOSTILE', pos: { left: '50%', top: '18%' }, label: 'Naa A.', sub: 'offline · 1h' },
            ] as Array<{ id: string; canvasser_id: string; interaction_result: string; pos?: { left: string; top: string }; label?: string; sub?: string }>).map((log, i) => {
              const positions = [
                { left: '40%', top: '48%' }, { left: '65%', top: '30%' },
                { left: '22%', top: '70%' }, { left: '78%', top: '68%' },
                { left: '50%', top: '18%' },
              ]
              const pos = (log as { pos?: { left: string; top: string } }).pos || positions[i] || positions[0]
              const isOn = log.interaction_result === 'STRONG_SUPPORT' || log.interaction_result === 'LEANING'
              const isIdle = log.interaction_result === 'UNDECIDED'
              const dotColor = isOn ? 'hsl(var(--primary))' : isIdle ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))'
              const initials = (log as { label?: string }).label || log.canvasser_id.substring(0, 2).toUpperCase()
              const subLabel = (log as { sub?: string }).sub || (isOn ? `${10 + i * 6} sign-ups` : isIdle ? 'idle' : 'offline')
              return (
                <div key={log.id} style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,.2)', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, fontFamily: "'Public Sans'", position: 'relative', zIndex: 2 }}>
                      {initials.substring(0, 2)}
                    </div>
                    <div style={{ position: 'absolute', bottom: -3, right: -3, width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', background: dotColor }} />
                    <div style={{ position: 'absolute', left: 36, top: 0, background: '#fff', border: '1px solid hsl(var(--border))', padding: '5px 10px', borderRadius: 4, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,.06)' }}>
                      <b style={{ display: 'block', fontSize: 10, color: '#181d19', fontFamily: "'Public Sans'", fontWeight: 800 }}>{initials}</b>
                      <span style={{ fontSize: 9, color: 'hsl(var(--primary))', fontWeight: 800 }}>{subLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Legend */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', gap: 14, padding: '10px 12px', background: 'rgba(255,255,255,.9)', borderRadius: 4, border: '1px solid hsl(var(--border))', fontSize: 9.5, fontFamily: "'Public Sans'", fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'hsl(var(--on-surface-muted))' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: 'hsl(var(--primary))' }} />Active</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: 'hsl(var(--accent))' }} />Idle</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', background: 'hsl(var(--on-surface-muted))' }} />Offline</span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="panel">
          <div className="ph">
            <h3>Today's leaderboard</h3>
            <span className="meta">sign-ups · {canvassersOnline || 64} canvassers</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {(leaderboard.length > 0 ? leaderboard : PLACEHOLDER_LB.map(p => [p.name, p.score] as [string, number])).map(([name, score], i) => {
              const isPlaceholder = leaderboard.length === 0
              const entry = isPlaceholder ? PLACEHOLDER_LB[i] : null
              const pct = isPlaceholder ? (entry?.pct ?? 50) : Math.round((score / topScore) * 100)
              const label = isPlaceholder ? (entry?.name ?? name) : `Canvasser ${(name as string).substring(0, 4)}`
              const sub = isPlaceholder ? (entry?.area ?? '') : 'Field agent'
              return (
                <div key={String(name) + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < 4 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 18, color: i === 0 ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))', width: 24, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                    {label.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5, display: 'block' }}>{label}</b>
                    <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{sub}</span>
                    <div style={{ marginTop: 5, height: 4, background: '#f1f5ee', borderRadius: 99, overflow: 'hidden', maxWidth: 200 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))' }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                    <b style={{ fontSize: 18, letterSpacing: '-.015em', lineHeight: 1, display: 'block' }}>{score}</b>
                    <span style={{ fontSize: 9.5, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.05em', textTransform: 'uppercase', display: 'block' }}>signups</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Routes + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
        {/* Routes panel */}
        <div className="panel">
          <div className="ph">
            <h3>Routes today</h3>
            <span className="meta">{campaigns.length || 8} routes · {activeCampaigns.length || 4} active</span>
          </div>
          <div style={{ padding: '6px 0' }}>
            {(campaigns.length > 0 ? campaigns.map((c) => {
              const knocked = fieldLogs.filter(l => l.canvasser_id.includes(c.id?.substring(0, 4) ?? '')).length
              const pct = c.goal_contacts > 0 ? Math.min(95, Math.round((knocked / c.goal_contacts) * 100)) : 45
              const status = pct > 60 ? 'ok' : pct > 30 ? 'warn' : 'bad'
              return { name: c.title, lead: c.target_constituency, knocked, goal: c.goal_contacts, signups: Math.floor(knocked * 0.2), time: c.status.toLowerCase(), status, pct, key: c.id }
            }) : PLACEHOLDER_ROUTES.map((r, i) => ({ ...r, key: String(i) }))).map((r, i, arr) => (
              <div key={r.key} style={{ padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5 }}>{r.name}</b>
                  <span className={r.status === 'ok' ? 'pill pill-ok' : r.status === 'warn' ? 'pill pill-warn' : 'pill pill-err'} style={{ fontSize: 9.5, padding: '2px 8px' }}>
                    {r.status === 'ok' ? 'On track' : r.status === 'warn' ? 'Behind pace' : 'Stalled'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700, letterSpacing: '.03em', flexWrap: 'wrap' }}>
                  <span><b style={{ color: 'hsl(var(--on-surface))', fontWeight: 800 }}>{r.lead}</b> · lead</span>
                  <span><b style={{ color: 'hsl(var(--on-surface))', fontWeight: 800 }}>{r.knocked}</b> / {r.goal} doors</span>
                  <span><b style={{ color: 'hsl(var(--on-surface))', fontWeight: 800 }}>{r.signups}</b> sign-ups</span>
                  <span>{r.time}</span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: '#f1f5ee', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${r.pct}%`, height: '100%', background: r.status === 'ok' ? 'hsl(var(--primary))' : r.status === 'warn' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + Alerts */}
        <div className="panel">
          <div className="ph"><h3>Quick actions</h3></div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/admin/ground-game/deploy')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_location_alt</span>Assign new turf
            </button>
            <button className="btn" style={{ background: 'hsl(var(--accent))', color: '#000', fontWeight: 800 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>Broadcast to canvassers
            </button>
            <button className="btn btn-outline">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>Onboard a canvasser
            </button>
            <button className="btn btn-outline">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>Export route sheet
            </button>
          </div>
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10, fontFamily: "'Public Sans'" }}>Alerts</div>
            {transportReqs.filter(r => r.status === 'PENDING').length > 0 ? (
              transportReqs.filter(r => r.status === 'PENDING').slice(0, 2).map(req => (
                <div key={req.id} style={{ background: 'rgba(206,17,38,.04)', border: '1px solid rgba(206,17,38,.18)', borderRadius: 4, padding: '10px 12px', marginBottom: 8 }}>
                  <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5, color: 'hsl(var(--destructive))', display: 'block' }}>Transport pending</b>
                  <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{req.pickup_address} · {req.passengers} pax</span>
                  <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => handleDispatch(req.id)}>Dispatch asset</button>
                </div>
              ))
            ) : (
              <>
                <div style={{ background: 'rgba(206,17,38,.04)', border: '1px solid rgba(206,17,38,.18)', borderRadius: 4, padding: '10px 12px', marginBottom: 8 }}>
                  <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5, color: 'hsl(var(--destructive))', display: 'block' }}>Route C-09 stalled</b>
                  <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Naa A. has been idle for 1h. Re-route or reassign?</span>
                </div>
                <div style={{ background: 'rgba(218,165,32,.06)', border: '1px solid rgba(218,165,32,.22)', borderRadius: 4, padding: '10px 12px' }}>
                  <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5, color: '#a87d10', display: 'block' }}>Achimota below pace</b>
                  <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>2 routes tracking 18% below daily goal.</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
