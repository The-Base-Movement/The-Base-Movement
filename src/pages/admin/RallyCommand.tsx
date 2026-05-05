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
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { FieldAction, RallyAttendance } from '@/types/admin'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-[var(--brand-red)] animate-spin" />
          <p className="text-[10px] font-bold normal-case text-stone-400">Initializing mobilization command...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🚀 Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-stone-900" />
            Rally command
          </h1>
          <p className="text-stone-500 text-sm mt-1">Real-time attendance telemetry and geo-fenced verification for field actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" /> Global manifest
          </Button>
          <Button className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Schedule action
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🗺️ Action List & Activation States */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta">Field actions</CardTitle>
                <Activity className="w-4 h-4 text-stone-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                {actions.map((action) => (
                  <div 
                    key={action.id} 
                    onClick={() => setSelectedAction(action)}
                    className={cn(
                      "p-5 cursor-pointer transition-all border-l-4",
                      selectedAction?.id === action.id 
                        ? "bg-stone-50 border-[var(--brand-red)]" 
                        : "hover:bg-stone-50/50 border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                        action.status === 'Live' ? "bg-red-100 text-red-600 animate-pulse" : "bg-stone-100 text-stone-500"
                      )}>
                        {action.status.toLowerCase()}
                      </span>
                      <span className="text-[9px] font-bold text-stone-400">{format(new Date(action.start_time), 'MMM dd, HH:mm')}</span>
                    </div>
                    <h3 className="text-[11px] font-bold normal-case tracking-tight text-stone-900 leading-tight">{action.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-3 h-3 text-stone-300" />
                      <p className="text-[9px] font-bold text-stone-400 normal-case truncate">{action.location_name}</p>
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
              {/* Live Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl border-stone-200 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold normal-case text-stone-400">Verified strength</span>
                    <Users className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-stone-900">{attendance.filter(a => a.is_verified).length}</p>
                  <p className="text-[9px] font-bold text-stone-400 normal-case mt-1">Confirmed field personnel</p>
                </Card>
                <Card className="rounded-xl border-stone-200 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold normal-case text-stone-400">Check-in velocity</span>
                    <Clock className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-stone-900">{attendance.length}</p>
                  <p className="text-[9px] font-bold text-stone-400 normal-case mt-1">Total signals received</p>
                </Card>
                <Card className="rounded-xl border-stone-200 shadow-sm bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold normal-case text-stone-400">Target achievement</span>
                    <Navigation className="w-4 h-4 text-stone-400" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-stone-900">
                    {Math.round((attendance.length / selectedAction.target_attendance) * 100)}%
                  </p>
                  <p className="text-[9px] font-bold text-stone-400 normal-case mt-1">Goal: {selectedAction.target_attendance}</p>
                </Card>
              </div>

              {/* Attendance Manifest Table */}
               <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold normal-case font-meta">Attendance manifest</CardTitle>
                    <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">Verified check-ins via geo-fenced mobile telemetry.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                      <input 
                        className="bg-stone-50 border-none h-9 pl-9 pr-4 text-[10px] font-bold normal-case focus:ring-1 focus:ring-stone-200 rounded-lg w-48"
                        placeholder="Search member..."
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 border-b border-stone-100">
                        <tr>
                          <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Patriot</th>
                          <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Signal time</th>
                          <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400">Status</th>
                          <th className="px-6 py-4 text-[9px] font-bold normal-case text-stone-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-bold text-stone-400 normal-case">No signals detected for this action</td>
                          </tr>
                        ) : (
                          attendance.map((entry) => (
                            <tr key={entry.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-stone-100 flex items-center justify-center font-bold text-[10px] normal-case rounded-lg">
                                    {entry.user_name?.charAt(0)}
                                  </div>
                                  <span className="text-[10px] font-bold normal-case text-stone-900">{entry.user_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold text-stone-600">{format(new Date(entry.check_in_time), 'HH:mm:ss')}</span>
                              </td>
                              <td className="px-6 py-4">
                                {entry.is_verified ? (
                                  <div className="flex items-center gap-1.5 text-[var(--brand-green)]">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold normal-case">Verified</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-orange-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold normal-case">Pending</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!entry.is_verified && (
                                  <Button 
                                    size="sm" 
                                    className="bg-black text-white rounded-lg text-[8px] font-bold normal-case h-8 px-4 shadow-sm"
                                    onClick={() => handleVerify(entry.id)}
                                    disabled={verifying === entry.id}
                                  >
                                    {verifying === entry.id ? 'Verifying...' : 'Manual verify'}
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
              <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
                <div className="bg-stone-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[var(--brand-red)]" />
                    <h3 className="text-white text-[10px] font-bold normal-case">Geo-fence boundary verification</h3>
                  </div>
                  <span className="text-[9px] font-bold text-stone-500 normal-case">{selectedAction.geofence_radius_meters}m radius</span>
                </div>
                <div className="h-64 bg-stone-100 flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
                  <div className="relative text-center">
                    <Navigation className="w-12 h-12 text-stone-200 mx-auto mb-3 group-hover:rotate-45 transition-transform duration-700" />
                    <p className="text-[10px] font-bold normal-case text-stone-400">Satellite engagement visualization</p>
                    <p className="text-[9px] font-bold text-stone-900 mt-2 normal-case">{selectedAction.location_name}</p>
                  </div>
                  {/* Visual Geofence Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-[var(--brand-red)]/20 animate-ping opacity-20" />
                    <div className="w-16 h-16 rounded-full bg-[var(--brand-red)]/5 border border-[var(--brand-red)]/20" />
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="h-[600px] flex items-center justify-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/30">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-[10px] font-bold normal-case text-stone-400">Select a field action to view tactical telemetry</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
