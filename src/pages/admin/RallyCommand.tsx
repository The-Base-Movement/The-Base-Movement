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
import { BrandLine } from '@/components/ui/BrandLine'

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
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Users className="w-8 h-8 text-on-surface" />
            Rally command
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Real-time attendance operational metrics and geo-fenced verification for field actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-micro px-10 font-bold tracking-tight hover:bg-stone-50 transition-all h-12 shadow-sm active:scale-95"
          >
            <Filter className="w-4 h-4 mr-2" /> Global Manifest
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Schedule Action
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🗺️ Action List & Activation States */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-sm border-border/40 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta">Field actions</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground/80" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
                {actions.map((action) => (
                  <div 
                    key={action.id} 
                    onClick={() => setSelectedAction(action)}
                    className={cn(
                      "p-5 cursor-pointer transition-all border-l-4",
                      selectedAction?.id === action.id 
                        ? "bg-muted/10 border-destructive" 
                        : "hover:bg-muted/5 border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                        action.status === 'Live' ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted/10 text-muted-foreground/80"
                      )}>
                        {action.status.toLowerCase()}
                      </span>
                      <span className="text-micro font-bold text-muted-foreground/80">{format(new Date(action.start_time), 'MMM dd, HH:mm')}</span>
                    </div>
                    <h3 className="text-tiny font-bold normal-case tracking-tight text-on-surface leading-tight">{action.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-3 h-3 text-muted-foreground/40" />
                      <p className="text-micro font-bold text-muted-foreground/80 normal-case truncate">{action.location_name}</p>
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
                <Card className="rounded-sm border-border/40 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-micro font-bold normal-case text-muted-foreground/80">Verified strength</span>
                    <Users className="w-4 h-4 text-muted-foreground/80" />
                  </div>
                  <p className="text-3xl font-bold tracking-tighter text-on-surface">{attendance.filter(a => a.is_verified).length}</p>
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case mt-1">Confirmed field personnel</p>
                </Card>
                <Card className="rounded-sm border-border/40 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-micro font-bold normal-case text-muted-foreground/80">Check-in velocity</span>
                    <Clock className="w-4 h-4 text-muted-foreground/80" />
                  </div>
                  <p className="text-3xl font-bold tracking-tighter text-on-surface">{attendance.length}</p>
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case mt-1">Total signals received</p>
                </Card>
                <Card className="rounded-sm border-border/40 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-micro font-bold normal-case text-muted-foreground/80">Target achievement</span>
                    <Navigation className="w-4 h-4 text-muted-foreground/80" />
                  </div>
                  <p className="text-3xl font-bold tracking-tighter text-on-surface">
                    {Math.round((attendance.length / selectedAction.target_attendance) * 100)}%
                  </p>
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case mt-1">Goal: {selectedAction.target_attendance}</p>
                </Card>
              </div>

              {/* Attendance Manifest Table */}
               <Card className="rounded-sm border-border/40 shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold normal-case font-meta">Attendance manifest</CardTitle>
                    <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 mt-1">Verified check-ins via geo-fenced mobile operational metrics.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
                      <input 
                        className="bg-muted/10 border-none h-9 pl-9 pr-4 text-micro font-bold normal-case focus:ring-1 focus:ring-border/40 rounded-sm w-48"
                        placeholder="Search member..."
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/10 border-b border-border/40">
                        <tr>
                          <th className="px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80">Member</th>
                          <th className="px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80">Signal time</th>
                          <th className="px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80">Status</th>
                          <th className="px-6 py-4 text-micro font-bold normal-case text-muted-foreground/80 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-micro font-bold text-muted-foreground/80 normal-case">No signals detected for this action</td>
                          </tr>
                        ) : (
                          attendance.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-muted/10 flex items-center justify-center font-bold text-micro normal-case rounded-sm">
                                    {entry.user_name?.charAt(0)}
                                  </div>
                                  <span className="text-micro font-bold normal-case text-on-surface">{entry.user_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-on-surface/60">{format(new Date(entry.check_in_time), 'HH:mm:ss')}</span>
                              </td>
                              <td className="px-6 py-4">
                                {entry.is_verified ? (
                                  <div className="flex items-center gap-1.5 text-primary">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span className="text-micro font-bold normal-case">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-orange-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-micro font-bold normal-case">Pending</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!entry.is_verified && (
                                  <Button 
                                    variant="primary"
                                    size="sm"
                                    className="rounded-sm text-micro font-bold capitalize tracking-tight h-9 px-6 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                                    onClick={() => handleVerify(entry.id)}
                                    disabled={verifying === entry.id}
                                  >
                                    {verifying === entry.id ? 'Verifying Signal...' : 'Manual Verify'}
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
              <Card className="rounded-sm border-border/40 shadow-sm bg-background overflow-hidden">
                <div className="bg-on-surface px-6 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-destructive" />
                    <h3 className="text-white text-micro font-bold normal-case">Geo-fence boundary verification</h3>
                  </div>
                  <span className="text-micro font-bold text-white/40 normal-case">{selectedAction.geofence_radius_meters}m radius</span>
                </div>
                <div className="h-64 bg-muted/10 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                  <div className="relative text-center">
                    <Navigation className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3 group-hover:rotate-45 transition-transform duration-700" />
                    <p className="text-micro font-bold normal-case text-muted-foreground/80">Satellite engagement visualization</p>
                    <p className="text-micro font-bold text-on-surface mt-2 normal-case">{selectedAction.location_name}</p>
                  </div>
                  {/* Visual Geofence Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-destructive/20 animate-ping opacity-20" />
                    <div className="w-16 h-16 rounded-full bg-destructive/5 border border-destructive/20" />
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-border/40 rounded-sm bg-muted/5">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-micro font-bold normal-case text-muted-foreground/80">Select a field action to view tactical operational metrics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
