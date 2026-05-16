import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { FieldAction, RallyAttendance } from '@/types/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

export default function RallyCommand() {
  const [actions, setActions] = useState<FieldAction[]>([])
  const [selectedAction, setSelectedAction] = useState<FieldAction | null>(null)
  const [attendance, setAttendance] = useState<RallyAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  const fetchActions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getFieldActions()
      setActions(data)
      if (data.length > 0 && !selectedAction) {
        setSelectedAction(data[0])
      }
    } catch (error) {
      console.error('[MOBILIZATION] Failed to fetch field actions:', error)
      toast.error('Failed to synchronize field actions.')
    } finally {
      setLoading(false)
    }
  }, [selectedAction])

  const fetchAttendance = useCallback(async (actionId: string) => {
    try {
      const data = await adminService.getFieldActionAttendance(actionId)
      setAttendance(data)
    } catch (error) {
      console.error('[MOBILIZATION] Failed to fetch attendance:', error)
      toast.error('Failed to synchronize attendance manifest.')
    }
  }, [])

  useEffect(() => {
    fetchActions()
  }, [fetchActions])

  useEffect(() => {
    if (selectedAction) {
      fetchAttendance(selectedAction.id)
    }
  }, [selectedAction, fetchAttendance])

  const handleVerify = async (id: string) => {
    setVerifying(id)
    try {
      const success = await adminService.verifyRallyAttendance(id)
      if (success) {
        toast.success('Attendance verified. Points awarded.')
        setAttendance(prev => prev.map(a => a.id === id ? { ...a, is_verified: true } : a))
      }
    } catch (error) {
      console.error('[MOBILIZATION] Manual verification failed:', error)
      toast.error('Verification failed.')
    } finally {
      setVerifying(null)
    }
  }

  if (loading) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'hsl(var(--primary))' }}>sync</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>Initializing mobilization command...</p>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      {/* 🏛️ Rally Header */}
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>groups</span>
            Rally command
          </h2>
          <div style={{ marginTop: 12 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            Real-time attendance operational metrics and geo-fenced verification for field actions.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
            Global Manifest
          </button>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Schedule Action
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpis">
        <TacticalKPI 
          label="Field Actions"
          value={actions.length}
          description="Scheduled & live"
          variant="black"
        />
        <TacticalKPI 
          label="Live Now"
          value={actions.filter(a => a.status === 'Live').length}
          description="Active points"
          variant="red"
        />
        <TacticalKPI 
          label="Attendance"
          value={attendance.length}
          description="Manifested patriots"
          variant="gold"
        />
        <TacticalKPI 
          label="Verified"
          value={`${attendance.length > 0 ? Math.round((attendance.filter(a => a.is_verified).length / attendance.length) * 100) : 0}%`}
          description="Identity match rate"
          variant="green"
        />
      </div>

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* 🗺️ Action List */}
        <aside style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Field actions</span>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>bolt</span>
            </div>
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {actions.map((action) => (
                <div 
                  key={action.id} 
                  onClick={() => setSelectedAction(action)}
                  style={{ 
                    padding: 24, 
                    cursor: 'pointer', 
                    borderLeft: `4px solid ${selectedAction?.id === action.id ? 'hsl(var(--destructive))' : 'transparent'}`,
                    background: selectedAction?.id === action.id ? 'hsl(var(--container-low))' : 'transparent',
                    borderBottom: '1px solid hsl(var(--border))'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="pill" style={{ 
                      background: action.status === 'Live' ? 'rgba(206, 17, 38, 0.1)' : 'hsl(var(--container-low))', 
                      color: action.status === 'Live' ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
                      fontSize: 8,
                      fontWeight: 900,
                      textTransform: 'uppercase'
                    }}>
                      {action.status}
                    </span>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>{format(new Date(action.start_time), 'MMM dd, HH:mm')}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))', margin: 0 }}>{action.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>location_on</span>
                    <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.location_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* 📟 Tactical Operations */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedAction ? (
            <>
              {/* Operational metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Verified strength</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>verified</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{attendance.filter(a => a.is_verified).length}</p>
                    <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Confirmed field personnel</p>
                  </div>
                </div>
                <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Check-in velocity</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>timer</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>{attendance.length}</p>
                    <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Total signals received</p>
                  </div>
                </div>
                <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Target achievement</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>flag</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>
                      {Math.round((attendance.length / (selectedAction.target_attendance || 1)) * 100)}%
                    </p>
                    <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Goal: {selectedAction.target_attendance}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="ph" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', color: 'hsl(var(--on-surface))' }}>Attendance manifest</span>
                    <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>Verified check-ins via geo-fenced signals</p>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>search</span>
                    <input aria-label="Search member" name="name-66c057" id="input-66c057" 
                      style={{ height: 38, width: 240, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12 }}
                      placeholder="Search member..."
                    />
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                    <tr>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Member</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Signal time</th>
                      <th style={{ padding: '14px 24px', textAlign: 'left', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Status</th>
                      <th style={{ padding: '14px 24px', textAlign: 'right', fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 60, textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>No signals detected for this action</td>
                      </tr>
                    ) : (
                      attendance.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                          <td style={{ padding: '14px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                                {entry.user_name?.charAt(0)}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 800 }}>{entry.user_name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 24px', fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
                            {format(new Date(entry.check_in_time), 'HH:mm:ss')}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            {entry.is_verified ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--primary))' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>Verified</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--accent))' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>hourglass_empty</span>
                                <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }}>Pending</span>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                            {!entry.is_verified && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleVerify(entry.id)}
                                disabled={verifying === entry.id}
                              >
                                {verifying === entry.id ? 'Verifying...' : 'Manual Verify'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Geo-fence Visualization */}
              <div className="panel" style={{ background: 'hsl(var(--on-surface))', color: '#fff', position: 'relative', overflow: 'hidden', height: 320 }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at center, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ color: 'hsl(var(--destructive))' }}>location_on</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geo-fence verification</h3>
                      <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{selectedAction.location_name}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 2 }}>{selectedAction.geofence_radius_meters}m radius</span>
                </div>

                <div style={{ height: 'calc(100% - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'rgba(255,255,255,0.05)' }}>explore</span>
                    <p style={{ margin: '12px 0 0', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>Satellite Engagement Visualization</p>
                  </div>
                  
                  {/* Visual pulses */}
                  <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px dashed rgba(206, 17, 38, 0.2)', animation: 'ping 3s infinite' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'hsl(var(--destructive))', boxShadow: '0 0 20px hsl(var(--destructive))' }} />
                </div>
              </div>
            </>
          ) : (
            <div className="panel" style={{ height: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, borderStyle: 'dashed' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'hsl(var(--on-surface-muted))', opacity: 0.1 }}>priority_high</span>
              <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <p style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>Deployment Pending</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', marginTop: 8, lineHeight: 1.6 }}>Select a field action from the operational log to view tactical metrics and member manifests.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
