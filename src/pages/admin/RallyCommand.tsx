import { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  MapPin, 
  ShieldCheck, 
  Plus, 
  Search,
  Filter,
  Activity,
  Clock,
  Navigation,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { FieldAction, RallyAttendance } from '@/types/admin'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { BrandLine } from '@/components/admin/BrandLine'
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border/40 border-t-destructive animate-spin" />
          <p className="text-micro font-bold normal-case text-primary">Initializing mobilization command...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Rally Header */}
      <div className="flex-columns items-center flex-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 m-0">
            <Users className="w-8 h-8 text-on-surface" />
            Rally command
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-2 mb-0">Real-time attendance operational metrics and geo-fenced verification for field actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-micro px-8 font-bold tracking-tight bg-white hover:bg-muted/30 transition-all h-10 shadow-sm active:scale-95"
          >
            <Filter className="w-4 h-4 mr-2" /> Global Manifest
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-10 h-10 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Schedule Action
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 mt-12">
        <TacticalKPI 
          label="Field Actions"
          value={actions.length}
          description="Scheduled & live"
          trend={{ direction: 'neutral', value: 'Vault' }}
        />
        <TacticalKPI 
          label="Live Now"
          value={actions.filter(a => a.status === 'Live').length}
          description="Active points"
          trend={{ direction: 'neutral', value: 'Live' }}
        />
        <TacticalKPI 
          label="Attendance"
          value={attendance.length}
          description="Manifested patriots"
          trend={{ direction: 'up', value: 'Pulse' }}
        />
        <TacticalKPI 
          label="Verified"
          value={`${attendance.length > 0 ? Math.round((attendance.filter(a => a.is_verified).length / attendance.length) * 100) : 0}%`}
          description="Identity match rate"
          trend={{ direction: 'up', value: 'Elite' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🗺️ Action List & Activation States */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-fit">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold tracking-tight uppercase">Field actions</CardTitle>
                <Activity className="w-5 h-5 text-muted-foreground/40" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto custom-scrollbar">
                {actions.map((action) => (
                  <div 
                    key={action.id} 
                    onClick={() => setSelectedAction(action)}
                    className={cn(
                      "p-6 cursor-pointer transition-all border-l-4",
                      selectedAction?.id === action.id 
                        ? "bg-muted/30 border-destructive" 
                        : "hover:bg-muted/10 border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                        action.status === 'Live' 
                          ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
                          : "bg-muted/10 text-muted-foreground/40 border-border/20"
                      )}>
                        {action.status}
                      </span>
                      <span className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">{format(new Date(action.start_time), 'MMM dd, HH:mm')}</span>
                    </div>
                    <h3 className="text-sm font-bold text-on-surface leading-tight m-0">{action.title}</h3>
                    <div className="flex items-center gap-2 mt-3">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/40" />
                      <p className="text-micro font-bold text-muted-foreground/60 uppercase tracking-tighter truncate m-0">{action.location_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📟 Tactical Operations & Attendance Manifest */}
        <div className="lg:col-span-2 space-y-8">
          {selectedAction ? (
            <>
              {/* Live operational metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-sm border-border/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">Verified strength</span>
                    <Users className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-on-surface m-0 leading-none">{attendance.filter(a => a.is_verified).length}</p>
                    <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter mt-2 m-0">Confirmed field personnel</p>
                  </div>
                </Card>
                <Card className="rounded-sm border-border/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">Check-in velocity</span>
                    <Clock className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-on-surface m-0 leading-none">{attendance.length}</p>
                    <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter mt-2 m-0">Total signals received</p>
                  </div>
                </Card>
                <Card className="rounded-sm border-border/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">Target achievement</span>
                    <Navigation className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-on-surface m-0 leading-none">
                      {Math.round((attendance.length / selectedAction.target_attendance) * 100)}%
                    </p>
                    <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter mt-2 m-0">Goal: {selectedAction.target_attendance}</p>
                  </div>
                </Card>
              </div>

              {/* Attendance Manifest Table */}
               <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
                <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight uppercase">Attendance manifest</CardTitle>
                    <CardDescription className="text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter mt-1">Verified check-ins via geo-fenced mobile operational metrics.</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                    <input 
                      className="w-full md:w-64 h-10 pl-10 pr-4 bg-white border border-border/40 rounded-sm text-xs font-bold text-on-surface focus:outline-none focus:border-primary transition-colors"
                      placeholder="Search member..."
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/10 border-b border-border/40">
                        <tr>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Member</th>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Signal time</th>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">No signals detected for this action</td>
                          </tr>
                        ) : (
                          attendance.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-9 h-9 bg-muted/40 border border-border/20 rounded-sm flex items-center justify-center font-bold text-xs text-on-surface">
                                    {entry.user_name?.charAt(0)}
                                  </div>
                                  <span className="text-xs font-bold text-on-surface">{entry.user_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-muted-foreground/60 uppercase">
                                {format(new Date(entry.check_in_time), 'HH:mm:ss')}
                              </td>
                              <td className="px-6 py-4">
                                {entry.is_verified ? (
                                  <div className="flex items-center gap-2 text-primary">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-micro font-bold uppercase tracking-widest">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-accent">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-micro font-bold uppercase tracking-widest text-accent">Pending</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!entry.is_verified && (
                                  <Button 
                                    variant="primary"
                                    size="sm"
                                    className="rounded-sm text-micro font-bold capitalize tracking-tight h-8 px-5 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                                    onClick={() => handleVerify(entry.id)}
                                    disabled={verifying === entry.id}
                                  >
                                    {verifying === entry.id ? 'Verifying...' : 'Manual Verify'}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Location Verification Map Placeholder */}
              <Card className="rounded-sm border-border/60 shadow-lg bg-on-surface overflow-hidden relative group h-80">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                
                <div className="absolute top-0 inset-x-0 p-6 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-destructive animate-bounce" />
                    <div>
                      <h3 className="text-white text-xs font-bold uppercase tracking-widest m-0 leading-none">Geo-fence verification</h3>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1.5 m-0">{selectedAction.location_name}</p>
                    </div>
                  </div>
                  <span className="text-micro font-bold text-white/40 uppercase tracking-widest border border-white/10 px-2.5 py-1 rounded-sm">{selectedAction.geofence_radius_meters}m radius</span>
                </div>

                <div className="h-full flex items-center justify-center relative z-20 pt-20">
                  <div className="relative text-center">
                    <Navigation className="w-16 h-16 text-white/10 mx-auto mb-4 group-hover:rotate-45 transition-transform duration-1000" />
                    <p className="text-micro font-bold uppercase tracking-widest text-white/40">Satellite Engagement Visualization</p>
                  </div>
                  
                  {/* Visual Geofence Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-destructive/20 animate-ping opacity-30" />
                    <div className="w-24 h-24 rounded-full bg-destructive/5 border border-destructive/20 flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-sm bg-muted/10 space-y-6">
              <AlertCircle className="w-16 h-16 text-muted-foreground/10" />
              <div className="text-center max-w-sm px-6">
                <p className="text-sm font-bold text-on-surface uppercase tracking-tight">Deployment Pending</p>
                <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 leading-relaxed">Select a field action from the operational log to view tactical metrics and member manifests.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
