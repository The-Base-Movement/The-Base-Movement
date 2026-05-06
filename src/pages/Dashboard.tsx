import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { WelcomeModal } from '@/components/WelcomeModal'
import { ShareModal } from '@/components/ShareModal'
import { adminService } from '@/services/adminService'
import type { Notification, Achievement, LeaderboardEntry, FieldAction } from '@/types/admin'
import { Trophy, Medal, TrendingUp, Award, MapPin, Navigation, Calendar, ShieldCheck, Users } from 'lucide-react'
import { MovementRoadmap } from '@/components/MovementRoadmap'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { usePerformance } from '@/context/PerformanceContext'

interface GrowthStats {
  joined_last_hour: number
  joined_last_24h: number
  joined_last_7d: number
}

interface MemberData {
  full_name: string
  registration_number: string
  platform: string
  phone_number: string
  age_range: string
  gender: string
  region: string
  constituency: string
  chapter: string
  profession: string
  status?: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<GrowthStats | null>(null)
  const [member, setMember] = useState<MemberData | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [allAvailableAchievements, setAllAvailableAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [shareData, setShareData] = useState({ title: '', url: '' })
  const [fieldActions, setFieldActions] = useState<FieldAction[]>([])
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const { lowBandwidthMode } = usePerformance()

  const handleShare = () => {
    setShareData({
      title: 'Join "The Base" Movement - Ghana First!',
      url: `https://thebase.gh/join/${member?.full_name.toLowerCase().replace(/\s+/g, '') || 'member'}`
    })
    setIsShareModalOpen(true)
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      // 1. Fetch Live Growth Stats
      const liveStats = await adminService.getGrowthStats()
      setStats(liveStats)

      // 2. Fetch Active Member Profile & Gamification Data
      const regNo = localStorage.getItem('userRegNo')
      if (regNo) {
        const liveMember = await adminService.getMemberProfile(regNo)
        if (liveMember) {
          setMember({
            full_name: liveMember.name,
            registration_number: liveMember.id,
            platform: liveMember.type === 'Premium' ? 'DIASPORA' : 'GHANA',
            phone_number: liveMember.phone,
            age_range: 'Not Specified',
            gender: liveMember.gender || 'Not Set',
            region: liveMember.region,
            constituency: liveMember.constituency,
            chapter: liveMember.chapter || 'Central Chapter',
            profession: 'Member',
            status: liveMember.status
          })

          // Fetch achievements and localized leaderboard in the same scope
          const [userAchievements, regionLeaderboard, userPoints, allPossible] = await Promise.all([
            adminService.getMemberAchievements(liveMember.id),
            adminService.getLeaderboard(liveMember.region),
            adminService.getMemberPoints(liveMember.id),
            adminService.getAchievements()
          ])
          setAchievements(userAchievements)
          setLeaderboard(regionLeaderboard)
          setTotalPoints(userPoints)
          setAllAvailableAchievements(allPossible)

          // Fetch Active Field Actions
          const activeActions = await adminService.getFieldActions()
          setFieldActions(activeActions.filter(a => a.status === 'Live' || a.status === 'Upcoming'))
        }
      }
      
      // 3. Fetch Movement Directives
      const userNotifications = await adminService.getNotifications()
      setNotifications(userNotifications)

      // 4. Welcome Experience (First Time Only)
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        setIsWelcomeModalOpen(true)
        localStorage.setItem('hasSeenWelcome', 'true')
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleCheckIn = async (action: FieldAction) => {
    setCheckingIn(action.id)
    
    // 1. Get User Location
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      setCheckingIn(null)
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setUserLocation({ lat: latitude, lng: longitude })

      try {
        // In a real production app, we would verify the distance to action.location_lat/lng here
        // For now, we'll proceed with the signal dispatch
        const regNo = localStorage.getItem('userRegNo')
        const profile = await adminService.getMemberProfile(regNo || '')
        
        if (!profile) throw new Error('Profile not found')

        const { error } = await supabase
          .from('field_action_attendance')
          .insert([{
            action_id: action.id,
            user_id: profile.id,
            check_in_lat: latitude,
            check_in_lng: longitude,
            is_verified: false, // Admin verifies later, or auto-verify if distance < radius
            metadata: { platform: 'web_dashboard' }
          }])

        if (error) {
          if (error.code === '23505') toast.error('You have already signaled attendance for this action.')
          else throw error
        } else {
          toast.success(`Tactical signal dispatched from ${action.location_name}. Verification pending.`)
        }
      } catch (err) {
        console.error('[GEOLOCATION] Signal failed:', err)
        toast.error('Tactical signal failed to reach HQ.')
      } finally {
        setCheckingIn(null)
      }
    }, (error) => {
      console.error('[GEOLOCATION] Access denied:', error)
      toast.error('Please enable location services to check-in.')
      setCheckingIn(null)
    })
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-off-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-meta text-stone-500 uppercase tracking-widest text-xs animate-pulse">Synchronizing Live Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-12 py-8 sm:py-12">
      <WelcomeModal 
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        userName={member?.full_name || 'Member'}
        assignedChapter={{
          name: `The Base - ${member?.region || 'National'} Chapter`,
          region: member?.region || 'Ghana'
        }}
      />
      {/* Section 1: Growth Stats (Bento Grid Style) */}
      <section className="mb-12">
        <h2 className="text-on-surface mb-6 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>trending_up</span>
          Movement Growth
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface-warm border-t-[3px] border-t-accent p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>bolt</span>
            <p className="text-accent text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 1 hour</p>
            <h1 className="text-primary leading-none mb-0">
              {stats?.joined_last_hour?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Active citizens joining the cause</p>
          </div>
          <div className="bg-surface-warm border-t-[3px] border-t-accent p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>history</span>
            <p className="text-accent text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 24 hours</p>
            <h1 className="text-primary leading-none mb-0">
              {stats?.joined_last_24h?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Spanning all 16 regions of Ghana</p>
          </div>
          <div className="bg-surface-warm border-t-[3px] border-t-accent p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-primary mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>calendar_month</span>
            <p className="text-accent text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 7 days</p>
            <h1 className="text-primary leading-none mb-0">
              {stats?.joined_last_7d?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Growing collective impact nationwide</p>
          </div>
        </div>
      </section>

      {/* Section 2: Active Field Mobilization (Tactical Activation) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-on-surface flex items-center m-0">
            <span className="material-symbols-outlined mr-2 text-destructive" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>stadium</span>
            Active Field Mobilization
          </h2>
          <div className="flex items-center gap-4">
            {userLocation && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-right-4 duration-500">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Signal Active: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-destructive animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Live National Signal</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fieldActions.length === 0 ? (
            <div className="lg:col-span-2 bg-surface-warm border-2 border-dashed border-stone-200 p-12 text-center rounded-sm">
              <Calendar className="w-8 h-8 text-stone-200 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">No Active Field Actions Detected</p>
              <p className="text-[9px] text-stone-300 font-bold uppercase mt-1">Check back later for national rallies and town halls.</p>
            </div>
          ) : (
            fieldActions.map((action) => (
              <div key={action.id} className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden flex flex-col md:flex-row group hover:border-stone-300 transition-all">
                <div className="w-full md:w-32 bg-stone-900 flex flex-col items-center justify-center p-6 text-white border-b md:border-b-0 md:border-r border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">{format(new Date(action.start_time), 'MMM')}</span>
                  <span className="text-3xl font-black italic tracking-tighter">{format(new Date(action.start_time), 'dd')}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-destructive mt-2">{format(new Date(action.start_time), 'HH:mm')}</span>
                </div>
                <div className="flex-1 p-6 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                      action.status === 'Live' ? "bg-destructive/10 text-destructive" : "bg-stone-100 text-stone-500"
                    )}>
                      {action.status}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{action.type}</span>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-stone-900 mb-2 leading-tight">{action.title}</h3>
                  <div className="flex items-center gap-4 text-stone-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">{action.location_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{action.target_attendance} Target</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-50">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-stone-300" />
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{action.geofence_radius_meters}m Radius</span>
                    </div>
                    <Button 
                      onClick={() => handleCheckIn(action)}
                      className="bg-black text-white hover:bg-stone-800 rounded-none h-9 px-6 text-[9px] font-black uppercase tracking-widest shadow-lg"
                      disabled={checkingIn === action.id}
                    >
                      {checkingIn === action.id ? 'Signaling...' : 'Field Check-in'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Section 2: Movement Directives (New Feed) */}
        <section className="lg:col-span-7">
          <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden mb-8">
            <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>campaign</span>
                Movement Directives
              </h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{notifications.length} Active Alerts</span>
            </div>
            <div className="divide-y divide-stone-50 max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-stone-200 text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}>notifications_off</span>
                  <p className="text-xs text-stone-400 uppercase font-bold tracking-widest">Standing by for HQ directives</p>
                </div>
              ) : (
                notifications.map((note) => (
                  <div key={note.id} className={`p-6 transition-all border-l-4 ${note.is_read ? 'border-transparent' : 'border-primary bg-emerald-50/20'}`}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {note.type === 'Alert' && (
                          <span className="px-2 py-0.5 bg-destructive text-white text-[8px] font-black uppercase tracking-widest rounded-none">Urgent</span>
                        )}
                        <h4 className={`text-sm font-black uppercase tracking-tight m-0 ${note.is_read ? 'text-stone-600' : 'text-stone-900'}`}>
                          {note.title}
                        </h4>
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest shrink-0">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">{note.message}</p>
                    {!note.is_read && (
                      <button 
                        onClick={async () => {
                          const success = await adminService.markNotificationRead(note.id)
                          if (success) {
                            setNotifications(prev => prev.map(n => n.id === note.id ? { ...n, is_read: true } : n))
                          }
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Acknowledge Directive
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface-warm border-t-[3px] border-t-accent overflow-hidden rounded-sm shadow-sm">
            <div className="p-6 sm:p-8">
              <h3 className="mb-6 sm:mb-8 border-b border-accent/20 pb-4 text-on-surface">Member Identity Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-12">
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-widest mb-1 font-bold">Full Name</p>
                  <p className="text-lg font-bold text-on-surface truncate mb-0">{member?.full_name || 'Not Available'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-widest mb-1 font-bold">Registration Number</p>
                  <p className="text-lg font-bold text-on-surface break-all sm:break-normal mb-0">{member?.registration_number || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Platform</p>
                  <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold tracking-tighter rounded-full">
                    {member?.platform || 'GHANA'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Verification Status</p>
                  <span className={cn(
                    "inline-block px-3 py-1 text-white text-[10px] font-bold tracking-tighter rounded-full",
                    (member?.status === 'Active' || member?.status === 'Approved') ? "bg-emerald-600" : "bg-amber-600"
                  )}>
                    {(member?.status === 'Active' || member?.status === 'Approved') ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.phone_number || 'Not Provided'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Age Range</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.age_range || 'Not Set'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.gender || 'Not Set'}</p>
                </div>
                {member?.region && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Region</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.region}</p>
                  </div>
                )}
                {member?.chapter && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Assigned Chapter</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.chapter}</p>
                  </div>
                )}
                {member?.profession && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-accent uppercase tracking-widest mb-1">Profession</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.profession}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobilization Impact Progress */}
        <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 sm:p-8 col-span-1 lg:col-span-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 m-0 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Mobilization Impact
              </h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Total points earned through direct action.</p>
            </div>
            <span className="text-2xl font-black italic tracking-tighter text-primary">{totalPoints.toLocaleString()}</span>
          </div>
          
          <div className="space-y-4">
            <div className="h-4 bg-stone-100 rounded-none overflow-hidden relative border border-stone-200">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min((totalPoints / 1000) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Next Milestone: Chapter Leader</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">
                {1000 - totalPoints > 0 ? `${1000 - totalPoints} points remaining` : 'Elite Achievement Unlocked'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Referral/Invite (Sidebar Column) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-primary-container p-6 md:p-8 border-none relative overflow-hidden group rounded-sm shadow-sm">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            </div>
            <h3 className="text-white mb-2 relative z-10">Invite Others to Join The Base</h3>
            <p className="text-slate-300 mb-6 relative z-10">Our strength is in our numbers. Share your unique registration link with fellow Ghanaians and watch our collective voice grow.</p>
            <div className="relative mb-6">
              <input 
                className="w-full bg-primary/20 border border-primary-fixed/30 text-white font-body-sm py-3 pl-4 pr-12 rounded-sm focus:ring-0 focus:outline-none truncate" 
                readOnly 
                type="text" 
                value={`https://thebase.gh/join/${member?.full_name.toLowerCase().replace(/\s+/g, '') || 'member'}`} 
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://thebase.gh/join/${member?.full_name.toLowerCase().replace(/\s+/g, '') || 'member'}`)
                  // Optional: add toast notification here
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-primary-fixed hover:text-white transition-colors bg-primary/40 rounded-sm"
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>content_copy</span>
              </button>
            </div>
            <button 
              onClick={handleShare}
              className="w-full bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-fixed font-bold py-4 rounded-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>share</span>
              Invite & Share
            </button>
          </div>

          {/* Informational Slice */}
          <div className="p-6 border border-accent/20 flex items-center gap-4 bg-surface-container-low rounded-sm">
            <span className="material-symbols-outlined text-accent text-3xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>verified_user</span>
            <div>
              <p className="font-bold text-on-surface text-sm">Verified Civic Member</p>
              <p className="text-xs text-muted-gray">Your profile is authenticated for official voting and policy polls.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Section 4: Achievements & Regional Leaderboard */}
      <section className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Gallery */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-100 p-6 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2 m-0">
                <Trophy className="w-4 h-4 text-accent" />
                Movement Achievements
              </h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{achievements.length} Badges Earned</span>
            </div>
            <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Earned Badges */}
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-accent/50 bg-[radial-gradient(circle_at_center,_rgba(184,134,11,0.1)_0%,transparent_100%)] shadow-sm group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-stone-900 m-0">{achievement.name}</p>
                  <p className="text-[8px] text-stone-400 font-bold uppercase mt-1 leading-tight">{achievement.description}</p>
                </div>
              ))}

              {/* Next Milestones (Locked) */}
              {allAvailableAchievements
                .filter(a => !achievements.some(ea => ea.id === a.id))
                .slice(0, 3)
                .map((locked) => (
                <div key={locked.id} className="flex flex-col items-center text-center opacity-40 group">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-3 border-2 border-stone-100 grayscale">
                    <Medal className="w-6 h-6 text-stone-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tight text-stone-400 m-0">{locked.name}</p>
                  <p className="text-[8px] text-stone-300 font-bold uppercase mt-1 leading-tight">Locked ({locked.points_awarded || 0} Points)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Leaderboard */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-stone-50 border-b border-stone-100 p-6 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2 m-0">
                <TrendingUp className="w-4 h-4 text-primary" />
                {member?.region || 'National'} Leaderboard
              </h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Top 5 Mobilizers</span>
            </div>
            <div className="divide-y divide-stone-50">
              {leaderboard.map((entry) => (
                <div key={entry.name} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-black ${
                      entry.rank === 1 ? 'bg-accent text-white' : 
                      entry.rank === 2 ? 'bg-stone-300 text-stone-600' : 
                      entry.rank === 3 ? 'bg-amber-600/30 text-amber-900' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {entry.rank}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tight text-stone-900 m-0">{entry.name}</p>
                      <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest">{entry.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary m-0">{entry.points.toLocaleString()}</p>
                    <p className="text-[8px] text-stone-300 font-black uppercase tracking-widest">Points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Quick Actions (Functional Grid) */}
      <section className="mt-12">
        <h3 className="text-on-surface mb-6 flex items-center gap-2">
          <div className="h-1 w-8 bg-primary" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <Link className="bg-white border-t-[3px] border-t-accent p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/settings">
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">badge</span>
            <p className="font-meta text-[10px] font-black uppercase tracking-widest text-on-surface">Member Card</p>
          </Link>
          <Link className="bg-white border-t-[3px] border-t-accent p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/store">
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">storefront</span>
            <p className="font-meta text-[10px] font-black uppercase tracking-widest text-on-surface">Official Store</p>
          </Link>
          <Link className="bg-white border-t-[3px] border-t-accent p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/polls">
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">how_to_vote</span>
            <p className="font-meta text-[10px] font-black uppercase tracking-widest text-on-surface">Opinion Polls</p>
          </Link>
          <Link className="bg-white border-t-[3px] border-t-destructive p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/feedback">
            <span className="material-symbols-outlined text-destructive mb-3 text-3xl group-hover:scale-110 transition-transform">record_voice_over</span>
            <p className="font-meta text-[10px] font-black uppercase tracking-widest text-on-surface">Feedback Hub</p>
          </Link>
          <Link className="bg-white border-t-[3px] border-t-primary p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/canvass">
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">content_paste_go</span>
            <p className="font-meta text-[10px] font-black uppercase tracking-widest text-on-surface">Canvass</p>
          </Link>
        </div>
      </section>

      {/* Section 6: Interactive Movement Roadmap */}
      <section className="mt-20">
        <MovementRoadmap />
      </section>

      {/* Movement Visual Anchor */}
      <section className={cn(
        "mt-16 overflow-hidden rounded-xl h-[300px] relative",
        lowBandwidthMode && "bg-primary"
      )}>
        {!lowBandwidthMode && (
          <img alt="The Base Banner" className="w-full h-full object-cover" src="/the-base-banner-1.png"  decoding="async" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/40 to-transparent flex flex-col justify-end items-end p-12 text-right">
          <h2 className="text-white mb-2">Together, we build the Ghana we deserve.</h2>
          <p className="text-white max-w-2xl mb-0">Ghana First is more than a slogan—it's a commitment to our shared prosperity and civic responsibility.</p>
        </div>
      </section>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={shareData.title}
        url={shareData.url}
      />
    </div>
  )
}
