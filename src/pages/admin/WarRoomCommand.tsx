import { useState, useEffect } from 'react'
import { Send, CheckCircle2, AlertTriangle, MessageSquareWarning, Radio, Activity } from 'lucide-react'
import { adminService } from '@/services/adminService'
import type { RapidResponseDirective, CrisisIncident, MediaCounterNarrative } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/neon-button'

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-extrabold text-[13px] tabular-nums tracking-[.04em]" style={{ color: 'hsl(var(--accent))' }}>
      {format(time, 'dd MMM · HH:mm:ss')} GMT
    </span>
  )
}

const REGIONS = [
  { name: 'Greater Accra', members: 112408, pct: 92, status: 'ok' },
  { name: 'Ashanti',        members: 84712,  pct: 78, status: 'ok' },
  { name: 'Eastern',        members: 42201,  pct: 64, status: 'ok' },
  { name: 'Western',        members: 31540,  pct: 58, status: 'ok' },
  { name: 'Central',        members: 28118,  pct: 52, status: 'ok' },
  { name: 'Volta',          members: 21440,  pct: 48, status: 'warn' },
  { name: 'Northern',       members: 14802,  pct: 32, status: 'bad' },
  { name: 'Upper East',     members: 8914,   pct: 28, status: 'bad' },
  { name: 'Bono',           members: 7318,   pct: 24, status: 'bad' },
]

export default function WarRoomCommand() {
  const [directives, setDirectives] = useState<RapidResponseDirective[]>([])
  const [incidents, setIncidents] = useState<CrisisIncident[]>([])
  const [narratives, setNarratives] = useState<MediaCounterNarrative[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWarRoomIntelligence()
  }, [])

  const fetchWarRoomIntelligence = async () => {
    setLoading(true)
    try {
      const [dirData, incData, narData] = await Promise.all([
        adminService.getRapidResponseDirectives(),
        adminService.getCrisisIncidents(),
        adminService.getMediaCounterNarratives()
      ])
      setDirectives(dirData)
      setIncidents(incData)
      setNarratives(narData)
    } catch (error) {
      console.error('[WAR_ROOM] Failed to fetch intelligence:', error)
      toast.error('Failed to synchronize with War Room servers.')
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    { label: 'Sign-ups · today', value: '2,418', delta: '▲ 18% vs yesterday', deltaUp: true, accent: 'hsl(var(--destructive))' },
    { label: 'MoMo donations', value: '₵148K', delta: '▲ 24% MTD', deltaUp: true, accent: 'hsl(var(--accent))' },
    { label: 'Field canvassers', value: String(directives.length > 0 ? `${directives.length * 12}+` : '487'), delta: `${directives.length} active sectors`, deltaUp: true, accent: 'hsl(var(--primary))' },
    { label: 'Verified members', value: '355,840', delta: '+ 2,418 today', deltaUp: true, accent: 'rgba(255,255,255,.6)' },
    { label: 'Active incidents', value: String(incidents.length || '0'), delta: incidents.length > 0 ? 'Needs attention' : 'All clear', deltaUp: incidents.length === 0, accent: 'hsl(var(--destructive))' },
  ]

  if (loading) {
    return (
      <div className="-mx-[28px] -mt-[24px] bg-[#0a0d0b] flex items-center justify-center" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[rgba(206,17,38,.3)] border-t-destructive rounded-full animate-spin" />
          <p className="text-[11px] font-extrabold text-destructive uppercase tracking-[.06em] animate-pulse">Initializing war room protocols…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-[28px] -mt-[24px] bg-[#0a0d0b] text-[#e8ece7] pb-24" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      <div className="px-6 pt-5">

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[10px] text-[rgba(255,255,255,.4)] font-bold uppercase tracking-[.05em] mb-1">Command center → War room</div>
            <div className="flex items-center gap-3">
              <h2 className="font-meta font-extrabold text-[22px] text-white tracking-[-0.015em] leading-tight">
                War Room — live mobilization
              </h2>
              <span className="inline-flex items-center gap-[6px] font-extrabold text-[10.5px] uppercase tracking-[.06em] px-[10px] py-1 rounded-full border"
                style={{ color: 'hsl(var(--destructive))', background: 'rgba(206,17,38,.12)', borderColor: 'rgba(206,17,38,.3)' }}>
                <span className="w-[6px] h-[6px] rounded-full animate-pulse block" style={{ background: 'hsl(var(--destructive))' }} />
                Live · updating
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <LiveClock />
            <button
              className="h-8 px-3 text-[11px] font-extrabold rounded-[4px] border flex items-center gap-1.5 transition-colors"
              style={{ background: 'transparent', color: 'rgba(255,255,255,.8)', borderColor: 'rgba(255,255,255,.18)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--destructive))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--destructive))' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,.18)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.8)' }}
              onClick={() => window.location.href = '/admin/broadcasts/new'}
            >
              Send broadcast
            </button>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[10px] mb-[14px]">
          {kpis.map((k, i) => (
            <div key={i} className="relative rounded-[6px] overflow-hidden px-4 py-[14px]"
              style={{ background: 'rgba(17,22,18,.5)', border: '1px solid #1c221e', borderLeft: `3px solid ${k.accent}` }}>
              <div className="text-[9.5px] font-extrabold uppercase tracking-[.06em]" style={{ color: 'rgba(255,255,255,.5)' }}>{k.label}</div>
              <div className="font-extrabold text-[26px] tracking-[-0.02em] leading-none my-2 text-white tabular-nums">{k.value}</div>
              <div className={cn("text-[10.5px] font-extrabold inline-flex items-center gap-1", k.deltaUp ? '' : '')}
                style={{ color: k.deltaUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                {k.delta}
              </div>
            </div>
          ))}
        </div>

        {/* ── 3-column grid: Map · Table · Feed ── */}
        <div className="grid gap-[12px] mb-[12px]" style={{ gridTemplateColumns: '1.4fr .8fr 1fr' }}>

          {/* Map panel */}
          <div className="rounded-[6px] overflow-hidden" style={{ background: 'rgba(17,22,18,.5)', border: '1px solid #1c221e' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1c221e' }}>
              <h3 className="font-extrabold text-[12.5px] text-white">Ghana · live ground game</h3>
              <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>
                10 regions · {REGIONS.length} tracked
              </span>
            </div>
            <div className="relative" style={{ height: 380, background: 'radial-gradient(ellipse at center, #1c2620 0%, #0a0d0b 70%)' }}>
              <svg viewBox="0 0 400 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <path d="M150 30 L235 40 L260 80 L275 130 L290 200 L280 270 L260 320 L230 350 L180 355 L140 340 L120 290 L115 230 L105 170 L120 100 Z"
                  fill="rgba(0,107,63,.06)" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" />
                <path d="M150 30 L235 40 L260 80 L275 130 L290 200 L280 270 L260 320 L230 350 L180 355 L140 340 L120 290 L115 230 L105 170 L120 100 Z"
                  fill="none" stroke="rgba(218,165,32,.25)" strokeWidth="1" strokeDasharray="2,3" />
                <text x="200" y="195" textAnchor="middle" fontFamily="Public Sans" fontSize="9" fontWeight="800" fill="rgba(255,255,255,.18)" letterSpacing="3">GHANA</text>
              </svg>

              {/* Animated pins */}
              {[
                { city: 'Accra', x: '50%', y: '80%', color: 'hsl(var(--primary))', count: '412 online' },
                { city: 'Kumasi', x: '45%', y: '55%', color: 'hsl(var(--accent))', count: '218 online' },
                { city: 'Tamale', x: '62%', y: '35%', color: 'hsl(var(--destructive))', count: '94 alert' },
                { city: 'Cape Coast', x: '30%', y: '75%', color: 'hsl(var(--primary))', count: '86 online' },
                { city: 'Koforidua', x: '60%', y: '65%', color: 'hsl(var(--accent))', count: '71 online' },
              ].map(pin => (
                <div key={pin.city} className="absolute" style={{ left: pin.x, top: pin.y, transform: 'translate(-50%,-50%)' }}>
                  <div className="relative">
                    <div className="w-[10px] h-[10px] rounded-full absolute" style={{ background: pin.color, boxShadow: `0 0 0 3px rgba(0,0,0,.6), 0 0 20px ${pin.color}` }} />
                    <div className="absolute rounded-full border border-current animate-ping" style={{ inset: -12, color: pin.color, opacity: 0.6 }} />
                    <div className="absolute left-[14px] top-[-4px] text-white text-[9.5px] font-extrabold tracking-[.05em] uppercase whitespace-nowrap px-2 py-0.5 rounded-[3px] border"
                      style={{ background: 'rgba(0,0,0,.7)', borderColor: '#1c221e' }}>
                      <span style={{ color: pin.color }}>{pin.city}</span> · {pin.count}
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-3 left-3 right-3 flex gap-[14px] px-3 py-[10px] text-[9.5px] font-extrabold uppercase tracking-[.05em] rounded-[4px] border"
                style={{ color: 'rgba(255,255,255,.7)', background: 'rgba(0,0,0,.6)', borderColor: '#1c221e', backdropFilter: 'blur(8px)' }}>
                <span className="flex items-center gap-[5px]"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(var(--primary))' }} />Active</span>
                <span className="flex items-center gap-[5px]"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(var(--accent))' }} />Below target</span>
                <span className="flex items-center gap-[5px]"><span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(var(--destructive))' }} />Alert</span>
              </div>
            </div>
          </div>

          {/* Regional table */}
          <div className="rounded-[6px] overflow-hidden" style={{ background: 'rgba(17,22,18,.5)', border: '1px solid #1c221e' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1c221e' }}>
              <h3 className="font-extrabold text-[12.5px] text-white">Regions · pace to goal</h3>
              <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>YTD</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d110f', borderBottom: '1px solid #1c221e' }}>
                    <th className="text-left px-4 py-2 text-[9px] font-extrabold uppercase tracking-[.06em]" style={{ color: 'rgba(255,255,255,.4)' }}>Region</th>
                    <th className="text-right px-4 py-2 text-[9px] font-extrabold uppercase tracking-[.06em]" style={{ color: 'rgba(255,255,255,.4)' }}>Members</th>
                    <th className="px-4 py-2 text-[9px] font-extrabold uppercase tracking-[.06em]" style={{ color: 'rgba(255,255,255,.4)' }}>% Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {REGIONS.map((r, i) => (
                    <tr key={r.name} style={{ borderBottom: i < REGIONS.length - 1 ? '1px solid #1c221e' : 'none' }}>
                      <td className="px-4 py-2 font-extrabold" style={{ color: '#e8ece7' }}>{r.name}</td>
                      <td className="px-4 py-2 text-right font-extrabold tabular-nums" style={{ color: '#e8ece7' }}>{r.members.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: '#1c221e' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${r.pct}%`,
                            background: r.status === 'ok' ? 'hsl(var(--primary))' : r.status === 'warn' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity stream */}
          <div className="rounded-[6px] overflow-hidden flex flex-col" style={{ background: 'rgba(17,22,18,.5)', border: '1px solid #1c221e' }}>
            <div className="px-4 py-3 flex justify-between items-center shrink-0" style={{ borderBottom: '1px solid #1c221e' }}>
              <h3 className="font-extrabold text-[12.5px] text-white">Activity stream</h3>
              <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>live</span>
            </div>
            <div className="overflow-y-auto flex-1 px-4" style={{ maxHeight: 380 }}>
              {incidents.length === 0 && directives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2 className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[10.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>All sectors clear</p>
                </div>
              ) : (
                <>
                  {incidents.map(inc => (
                    <div key={inc.id} className="flex gap-[10px] py-[11px]" style={{ borderBottom: '1px solid #1c221e' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: inc.severity === 'DEFCON1' || inc.severity === 'SEVERE' ? 'hsl(var(--destructive))' : 'hsl(var(--accent))' }}>
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] leading-[1.45]" style={{ color: '#e8ece7' }}>
                          <b className="font-extrabold text-white">{inc.region}</b> — {inc.incident_type.replace(/_/g, ' ').toLowerCase()}
                        </p>
                        <span className="text-[9.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>
                          {format(new Date(inc.created_at), 'HH:mm')} · {inc.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {directives.slice(0, 4).map(dir => (
                    <div key={dir.id} className="flex gap-[10px] py-[11px]" style={{ borderBottom: '1px solid #1c221e' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary))' }}>
                        <Activity className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] leading-[1.45]" style={{ color: '#e8ece7' }}>
                          <b className="font-extrabold text-white">{dir.title}</b>
                        </p>
                        <span className="text-[9.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>
                          {dir.target_region} · {dir.priority.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {narratives.slice(0, 3).map(nar => (
                    <div key={nar.id} className="flex gap-[10px] py-[11px]" style={{ borderBottom: '1px solid #1c221e' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--accent))' }}>
                        <MessageSquareWarning className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] leading-[1.45]" style={{ color: '#e8ece7' }}>
                          <b className="font-extrabold text-white">{nar.target_platform}</b> — digital directive
                        </p>
                        <span className="text-[9.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>
                          {nar.dispatch_status.toLowerCase()}
                        </span>
                      </div>
                      {nar.dispatch_status === 'PENDING' && (
                        <button className="text-[10px] font-extrabold px-3 rounded-[3px] shrink-0 h-7"
                          style={{ background: 'rgba(206,17,38,.15)', color: 'hsl(var(--destructive))', border: '1px solid rgba(206,17,38,.3)' }}>
                          Dispatch
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Lower row: Incidents detail + Narratives ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">

          {/* Active crisis incidents */}
          <div className="rounded-[6px] overflow-hidden" style={{ background: 'rgba(17,22,18,.5)', border: '1px solid #1c221e' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1c221e' }}>
              <h3 className="font-extrabold text-[12.5px] text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} /> Crisis incidents
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>
                {incidents.filter(i => i.status === 'INVESTIGATING').length} active
              </span>
            </div>
            <div>
              {incidents.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-3" style={{ color: 'hsl(var(--primary))' }} />
                  <p className="text-[10.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>No active incidents. All sectors secure.</p>
                </div>
              ) : incidents.map(inc => (
                <div key={inc.id} className="p-4 space-y-2" style={{ borderBottom: '1px solid #1c221e' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-tight rounded-full",
                        inc.severity === 'DEFCON1' ? "animate-pulse" : ""
                      )} style={{
                        background: inc.severity === 'DEFCON1' || inc.severity === 'SEVERE' ? 'rgba(206,17,38,.2)' : 'rgba(218,165,32,.2)',
                        color: inc.severity === 'DEFCON1' || inc.severity === 'SEVERE' ? 'hsl(var(--destructive))' : 'hsl(var(--accent))',
                        border: `1px solid ${inc.severity === 'DEFCON1' || inc.severity === 'SEVERE' ? 'rgba(206,17,38,.3)' : 'rgba(218,165,32,.3)'}`
                      }}>
                        {inc.severity}
                      </span>
                      <span className="text-[10.5px] font-extrabold" style={{ color: 'rgba(255,255,255,.7)' }}>{inc.region}</span>
                    </div>
                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'rgba(255,255,255,.4)' }}>
                      {format(new Date(inc.created_at), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-white">{inc.incident_type.replace(/_/g, ' ')}</p>
                  <p className="text-[11.5px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.6)' }}>{inc.description}</p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1c221e' }}>
                    <span className="text-[9px] font-extrabold uppercase tracking-tight px-2 py-0.5 rounded-full" style={{
                      background: inc.status === 'INVESTIGATING' ? 'rgba(218,165,32,.15)' : 'rgba(0,107,63,.15)',
                      color: inc.status === 'INVESTIGATING' ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
                    }}>
                      {inc.status.toLowerCase()}
                    </span>
                    <button className="text-[10px] font-extrabold px-4 h-8 rounded-[3px]"
                      style={{ background: 'rgba(0,107,63,.15)', color: 'hsl(var(--primary))', border: '1px solid rgba(0,107,63,.3)' }}>
                      Update status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media counter-narratives */}
          <div className="rounded-[6px] overflow-hidden relative" style={{ background: '#0d1510', border: '1px solid #1c221e' }}>
            <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #1c221e' }}>
              <h3 className="font-extrabold text-[12.5px] text-white flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-blue-400" /> Digital strike directives
              </h3>
              <Radio className="w-4 h-4" style={{ color: 'rgba(255,255,255,.4)' }} />
            </div>
            <div>
              {narratives.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[10.5px] font-bold uppercase tracking-[.04em]" style={{ color: 'rgba(255,255,255,.4)' }}>No active media campaigns.</p>
                </div>
              ) : narratives.map(nar => (
                <div key={nar.id} className="p-4 space-y-2 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #1c221e' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold text-blue-400">{nar.target_platform}</span>
                    <span className={cn(
                      "text-[8px] font-extrabold uppercase tracking-tight px-2 py-0.5 rounded-full",
                      nar.dispatch_status === 'DEPLOYED' ? "bg-emerald-900/50 text-emerald-400" : "bg-orange-900/50 text-orange-400"
                    )}>
                      {nar.dispatch_status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-[12px] leading-[1.45]" style={{ color: 'rgba(255,255,255,.8)' }}>"{nar.approved_messaging}"</p>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,.4)' }}>{nar.hashtags}</p>
                    {nar.dispatch_status === 'PENDING' && (
                      <Button variant="primary" className="h-8 px-4 text-[10px] font-extrabold tracking-tight rounded-[3px] gap-1.5 bg-blue-600 hover:bg-blue-700 border-0">
                        <Send className="w-3 h-3" /> Dispatch
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
