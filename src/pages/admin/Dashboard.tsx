import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { tacticalService } from '@/services/tacticalService'
import { useToast } from '@/hooks/use-toast'

import type { 
  AuditLogEntry, 
  RegionalStat, 
  PendingVerification,
  Broadcast
} from '@/types/admin'



// KPI Component matching the reference kit
function KPI({ label, value, delta, variant }: { label: string, value: string, delta?: string, variant: 'r' | 'g' | 'k' | 'gr' }) {
  const isDown = delta?.toLowerCase().includes('down')
  return (
    <div className={cn("kpi", variant)}>
      <div className="l">{label}</div>
      <div className="v tnum">{value}</div>
      {delta && (
        <div className={cn("d", isDown && "dn")}>
          <span className="material-symbols-outlined" style={{ fontSize: '11px', verticalAlign: 'middle', marginRight: '4px' }}>
            {isDown ? 'south' : 'north'}
          </span>
          {delta}
        </div>
      )}
    </div>
  )
}



export default function AdminDashboard() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState<{ label: string, value: string, change: string }[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  
  // Broadcast State
  const [broadcast, setBroadcast] = useState({
    title: 'Eastern region jobs program — first cohort begins Monday',
    content: 'Patriots — the first 600 youth begin paid apprenticeships across 14 districts of the Eastern region this Monday.',
    target_type: 'REGION' as Broadcast['target_type'],
    target_value: 'Eastern',
    priority: 'Normal' as Broadcast['priority'],
    channel: 'In-app' as Broadcast['channel']
  })
  const [isSending, setIsSending] = useState(false)

  // Targeting Data
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<{ id: number; name: string; region_id: number }[]>([])
  const [diasporaChapters, setDiasporaChapters] = useState<{ id: string; name: string; country: string }[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [stats, audit, pending, regs, consts, diaspora, regional] = await Promise.all([
          adminService.getGlobalStats(),
          adminService.getSystemAuditLogs(),
          adminService.getPendingVerifications(),
          adminService.getGhanaRegions(),
          adminService.getGhanaConstituencies(),
          adminService.getDiasporaChapters(),
          adminService.getRegionalStats()
        ])
        setGlobalStats(stats)
        setAuditLogs(audit)
        setPendingVerifications(pending)
        setRegions(regs as unknown as { id: number; name: string }[])
        setConstituencies(consts as unknown as { id: number; name: string; region_id: number }[])
        setDiasporaChapters(diaspora as unknown as { id: string; name: string; country: string }[])
        setRegionalStats(regional)
      } catch (error) {
        console.error('[SYSTEM] Dashboard: Data fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])



  const handleSendBroadcast = async () => {
    if (!broadcast.title || !broadcast.content) {
      toast({
        title: "Validation Error",
        description: "Please provide both a headline and message content.",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      const success = await tacticalService.sendBroadcast({
        title: broadcast.title,
        content: broadcast.content,
        target_type: broadcast.target_type,
        target_value: broadcast.target_value,
        priority: broadcast.priority,
        channel: broadcast.channel,
        status: 'Sent'
      })

      if (success) {
        toast({
          title: "Broadcast Dispatched",
          description: `Message sent to targeted ${broadcast.target_type.toLowerCase()} audience.`,
        })
        // Reset form or keep for next? Let's clear content but keep target for speed
        setBroadcast(prev => ({ ...prev, content: '' }))
      } else {
        throw new Error('Service response failed')
      }
    } catch {
      toast({
        title: "Dispatch Failure",
        description: "Strategic communication layer encountered an error.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleExport = async () => {
    if (regionalStats.length === 0) {
      toast({
        title: "No data available",
        description: "There is no regional data to export at this time.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    toast({
      title: "Generating export",
      description: "Aggregating regional performance telemetry...",
    })
    
    try {
      // Aggregate real regional data
      const headers = ['Region', 'Member Count', 'Chapters', 'Performance Status', 'Activity Level']
      const rows = regionalStats.map(r => [
        r.region,
        r.memberCount,
        r.chapters,
        r.performance,
        r.memberCount > 1000 ? 'Peak' : r.memberCount > 100 ? 'High' : 'Normal'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      const timestamp = new Date().toISOString().split('T')[0]
      a.setAttribute('href', url)
      a.setAttribute('download', `base_regional_performance_${timestamp}.csv`)
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)

      setIsExporting(false)
      toast({
        title: "Export complete",
        description: "The regional performance report has been successfully generated.",
      })
    } catch (error) {
      console.error('[DASHBOARD] Export failure:', error)
      setIsExporting(false)
      toast({
        title: "Export failed",
        description: "A critical error occurred during data aggregation.",
        variant: "destructive"
      })
    }
  }




  return (
    <div className="main">
      <div className="top">
        <div>
          <div className="crumbs">Admin / Mission control</div>
          <h2>Today's operations</h2>
        </div>
        <div className="actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>file_download</span>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <button 
            className="btn btn-dest btn-sm"
            onClick={() => navigate('/admin/broadcasts')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>notifications_active</span>
            Send broadcast
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis">
        {isLoading ? (
          <>
            <div className="kpi r animate-pulse h-24 bg-white" />
            <div className="kpi g animate-pulse h-24 bg-white" />
            <div className="kpi k animate-pulse h-24 bg-white" />
            <div className="kpi gr animate-pulse h-24 bg-white" />
          </>
        ) : (
          <>
            {globalStats.length > 0 ? (
              globalStats.map((stat, idx) => (
                <KPI 
                  key={stat.label}
                  variant={idx === 0 ? 'r' : idx === 1 ? 'g' : idx === 2 ? 'k' : 'gr'}
                  label={stat.label}
                  value={stat.value}
                  delta={stat.change}
                />
              ))
            ) : (
              <>
                <KPI 
                  variant="r" 
                  label="Verifications pending" 
                  value={pendingVerifications.length.toString()} 
                  delta="Syncing..." 
                />
                <KPI variant="g" label="Patriots" value="--" delta="--" />
                <KPI variant="k" label="Logistics" value="--" delta="--" />
                <KPI variant="gr" label="Field" value="--" delta="--" />
              </>
            )}
          </>
        )}
      </div>

      <div className="twocol">
        
        {/* Verification queue */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>ID verification queue</h3>
              <div className="meta">{pendingVerifications.length} pending · sorted by oldest first</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/verification')}>View all</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Reg. no.</th>
                <th>Region</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pendingVerifications.slice(0, 5).map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="who">
                      <div className="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center text-[10px] font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <b>{member.name}</b>
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="reg">{member.id.slice(0, 8).toUpperCase()}</span></td>
                  <td>{member.chapter || member.region}</td>
                  <td>{new Date(member.submitted).toLocaleDateString()}</td>
                  <td>
                    <span className={cn("pill", (member.status === 'Processing' || member.status === 'In Review') ? "pill-warn" : "pill-ok")}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="ico ok" onClick={() => navigate(`/admin/verification?id=${member.id}`)}>
                        <span className="material-symbols-outlined">check</span>
                      </button>
                      <button className="ico no">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <button className="ico">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pendingVerifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-on-surface-muted text-xs italic">
                    All verifications complete. Operational baseline maintained.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column: composer + log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Broadcast composer */}
          <div className="panel compose">
            <div className="ph">
              <h3>New broadcast</h3>
              <span className="pill pill-mute">Mission Control</span>
            </div>
            
            <div className="field">
              <span className="lbl">Headline</span>
              <input 
                className="title" 
                value={broadcast.title}
                onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                placeholder="Mobilization directive..."
              />
            </div>
            
            <div className="field">
              <span className="lbl">Message</span>
              <textarea 
                value={broadcast.content}
                onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                placeholder="Tactical update content..."
                style={{ minHeight: '80px' }}
              />
            </div>
            
            <div className="field">
              <span className="lbl">Target Audience</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <select 
                  className="reg" 
                  style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', color: 'var(--on-surface)', width: '100%' }}
                  value={broadcast.target_type}
                  onChange={(e) => {
                    const type = e.target.value as Broadcast['target_type']
                    setBroadcast({ ...broadcast, target_type: type, target_value: 'ALL' })
                    setSelectedRegionId(null)
                  }}
                >
                  <option value="ALL">National (All Members)</option>
                  <option value="REGION">Regional Targeting</option>
                  <option value="CONSTITUENCY">Constituency Targeting</option>
                  <option value="DIASPORA">Diaspora Chapters</option>
                </select>
                
                {broadcast.target_type === 'REGION' && (
                  <select 
                    className="reg"
                    value={broadcast.target_value}
                    onChange={(e) => setBroadcast({ ...broadcast, target_value: e.target.value })}
                    style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', color: 'var(--on-surface)' }}
                  >
                    <option value="ALL">Select Region...</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                )}

                {broadcast.target_type === 'CONSTITUENCY' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="reg"
                      value={selectedRegionId || ''}
                      onChange={(e) => {
                        const id = parseInt(e.target.value)
                        setSelectedRegionId(id)
                        setBroadcast({ ...broadcast, target_value: 'ALL' })
                      }}
                      style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', color: 'var(--on-surface)', flex: 1 }}
                    >
                      <option value="">Filter by Region...</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>

                    <select 
                      className="reg"
                      value={broadcast.target_value}
                      onChange={(e) => setBroadcast({ ...broadcast, target_value: e.target.value })}
                      style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', color: 'var(--on-surface)', flex: 2 }}
                      disabled={!selectedRegionId}
                    >
                      <option value="ALL">Select Constituency...</option>
                      {constituencies
                        .filter(c => !selectedRegionId || c.region_id === selectedRegionId)
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {broadcast.target_type === 'DIASPORA' && (
                  <select 
                    className="reg"
                    value={broadcast.target_value}
                    onChange={(e) => setBroadcast({ ...broadcast, target_value: e.target.value })}
                    style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', color: 'var(--on-surface)' }}
                  >
                    <option value="ALL">All Diaspora Chapters</option>
                    {diasporaChapters.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.country})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="toolbar">
              <div className="left">
                <select 
                  className="reg"
                  value={broadcast.priority}
                  onChange={(e) => setBroadcast({ ...broadcast, priority: e.target.value as Broadcast['priority'] })}
                  style={{ background: 'transparent', border: 'none', fontSize: '10px', color: 'var(--on-surface-muted)', cursor: 'pointer' }}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">URGENT</option>
                </select>
                <div style={{ width: '1px', height: '12px', background: 'var(--border)', margin: '0 8px' }} />
                <select 
                  className="reg"
                  value={broadcast.channel}
                  onChange={(e) => setBroadcast({ ...broadcast, channel: e.target.value as Broadcast['channel'] })}
                  style={{ background: 'transparent', border: 'none', fontSize: '10px', color: 'var(--on-surface-muted)', cursor: 'pointer' }}
                >
                  <option value="In-app">In-App</option>
                  <option value="SMS">SMS</option>
                  <option value="Push">Push</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn btn-dest btn-sm" 
                  disabled={isSending}
                  onClick={handleSendBroadcast}
                >
                  {isSending ? 'Sending...' : 'Deploy Broadcast →'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="panel">
            <div className="ph">
              <h3>Recent admin activity</h3>
              <span className="meta">Last 24h</span>
            </div>
            <div className="log">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="log-row">
                  <span className="stamp">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="body">
                    <p><b>{log.adminName.split(' ')[0]}</b> {log.action.toLowerCase().replace('_', ' ')}</p>
                    <span>{log.resource}</span>
                  </div>
                  <span className={cn(
                    "tag",
                    log.action.includes('CREATE') ? "create" : 
                    log.action.includes('DELETE') ? "delete" : "edit"
                  )}>
                    {log.action.split('_')[0]}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="py-8 text-center text-on-surface-muted text-xs italic">
                  No recent mobilization telemetry.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

