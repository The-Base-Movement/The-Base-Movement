import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { WelcomeModal } from '@/components/WelcomeModal'
import { ShareModal } from '@/components/ShareModal'
import { adminService } from '@/services/adminService'
import type { Notification, Achievement, LeaderboardEntry, FieldAction } from '@/types/admin'
import { Trophy, Medal, TrendingUp, Award, MapPin, Navigation, ShieldCheck, Users, Flag } from 'lucide-react'
import { MovementRoadmap } from '@/components/MovementRoadmap'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/neon-button'
import { usePerformance } from '@/context/PerformanceContext'
import { useBranding } from '@/hooks/useBranding'

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
  const { settings } = useBranding()
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
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-on-surface/40 tracking-[0.2em] text-[10px] animate-pulse">Synchronizing live data...</p>
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
      
      {/* Section 1: Metrics Overview */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">New Members</span>
              <Users className="w-4 h-4 text-primary opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter m-0">{stats?.joined_last_24h || 0}</h3>
              <span className="text-[10px] font-bold text-on-surface/20 uppercase">Past 24h</span>
            </div>
            <p className="text-[9px] text-on-surface/30 mt-4 font-medium italic">Movement data updated and stabilized.</p>
          </div>
          <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Active Outreach</span>
              <Navigation className="w-4 h-4 text-primary opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter m-0">{fieldActions.length}</h3>
              <span className="text-[10px] font-bold text-on-surface/20 uppercase">In Area</span>
            </div>
            <p className="text-[9px] text-on-surface/30 mt-4 font-medium italic">No community actions detected yet.</p>
          </div>
          <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Mobilization Points</span>
              <Trophy className="w-4 h-4 text-[var(--brand-gold)] opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter m-0">{totalPoints}</h3>
              <span className="text-[10px] font-bold text-on-surface/20 uppercase">Earned</span>
            </div>
            <p className="text-[9px] text-on-surface/30 mt-4 font-medium italic">Participate to earn your first points.</p>
          </div>
          <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Achievements</span>
              <Flag className="w-4 h-4 text-[var(--brand-red)] opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tighter m-0">{achievements.length}</h3>
              <span className="text-[10px] font-bold text-on-surface/20 uppercase">Unlocked</span>
            </div>
            <p className="text-[9px] text-on-surface/30 mt-4 font-medium italic">Complete actions to earn badges.</p>
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
            <div className="lg:col-span-2 bg-on-surface/5 border-2 border-dashed border-on-surface/10 p-16 text-center rounded-none relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-on-surface/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-on-surface/10">
                  <Navigation className="w-8 h-8 text-on-surface/20" />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-on-surface/60 mb-2">Community Events</h3>
                <p className="text-xs font-medium text-on-surface/40 max-w-sm mx-auto">
                  No upcoming events in your area yet. We'll notify you as soon as new community outreach or rallies are scheduled.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <div className="h-1 w-12 bg-[var(--brand-green)] opacity-20" />
                  <div className="h-1 w-12 bg-[var(--brand-gold)] opacity-20" />
                  <div className="h-1 w-12 bg-[var(--brand-red)] opacity-20" />
                </div>
              </div>
            </div>
          ) : (
            fieldActions.map((action) => (
              <div key={action.id} className="bg-white border border-border/40 shadow-sm rounded-sm overflow-hidden flex flex-col md:flex-row group hover:border-primary/40 transition-all">
                <div className="w-full md:w-32 bg-on-surface flex flex-col items-center justify-center p-6 text-white border-b md:border-b-0 md:border-r border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{format(new Date(action.start_time), 'MMM')}</span>
                  <span className="text-3xl font-black italic tracking-tighter">{format(new Date(action.start_time), 'dd')}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-destructive mt-2">{format(new Date(action.start_time), 'HH:mm')}</span>
                </div>
                <div className="flex-1 p-6 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                      action.status === 'Live' ? "bg-destructive/10 text-destructive" : "bg-muted text-on-surface/40"
                    )}>
                      {action.status}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-on-surface/40">{action.type}</span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-on-surface mb-2 leading-tight">{action.title}</h3>
                  <div className="flex items-center gap-4 text-on-surface/40 mb-6">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[9px] font-black tracking-widest truncate max-w-[120px]">{action.location_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span className="text-[9px] font-black tracking-widest">{action.target_attendance} Target</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/10">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-on-surface/10" />
                      <span className="text-[9px] font-black text-on-surface/20 tracking-widest">{action.geofence_radius_meters}m radius</span>
                    </div>
                    <Button 
                      variant="solid"
                      onClick={() => handleCheckIn(action)}
                      className="h-9 px-6 text-[9px] font-black uppercase tracking-widest shadow-xl"
                      disabled={checkingIn === action.id}
                    >
                      {checkingIn === action.id ? 'Signaling...' : 'Field check-in'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Section 2.5: Community Progress (Action Queue) */}
      <section className="mb-12">
        <h2 className="text-on-surface mb-6 flex items-center">
          <span className="material-symbols-outlined mr-2 text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>assignment_turned_in</span>
          Upcoming Actions
        </h2>
        <div className="bg-white border border-border/40 p-12 text-center rounded-none shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-gold)]" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-[var(--brand-gold)]/10 rounded-none flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-[var(--brand-gold)]" />
            </div>
            <p className="text-sm font-bold text-on-surface/60 tracking-tight">All Tasks Completed</p>
            <p className="text-xs text-on-surface/40 font-medium mt-2 italic">Awaiting new updates from your Regional Coordinator.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Section 2: Movement Directives (New Feed) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 2: Movement Directives */}
          <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
            <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>campaign</span>
                Movement Directives
              </h3>
              <span className="text-[9px] font-bold text-on-surface/30 tracking-widest uppercase">{notifications.length} active updates</span>
            </div>
            <div className="divide-y divide-border/10 max-h-[400px] overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <span className="material-symbols-outlined text-on-surface/10 text-5xl mb-6" style={{ fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 48" }}>history</span>
                  <p className="text-sm font-bold text-on-surface/40 tracking-tight">All Caught Up</p>
                  <p className="text-xs text-on-surface/20 font-medium mt-2 italic">Standing by for new updates and national broadcasts.</p>
                </div>
              ) : (
                notifications.map((note) => (
                  <div key={note.id} className={`p-6 transition-all border-l-4 ${note.is_read ? 'border-transparent' : 'border-primary bg-primary/5'}`}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {note.type === 'Alert' && (
                          <span className="px-2 py-0.5 bg-destructive text-white text-[8px] font-black uppercase tracking-widest rounded-none">Urgent</span>
                        )}
                        <h4 className={`text-sm font-black tracking-tight m-0 ${note.is_read ? 'text-on-surface/40' : 'text-on-surface'}`}>
                          {note.title}
                        </h4>
                      </div>
                      <span className="text-[9px] text-on-surface/20 font-black tracking-widest shrink-0">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/60 leading-relaxed mb-4">{note.message}</p>
                      <Button 
                        variant="link"
                        onClick={async () => {
                          const success = await adminService.markNotificationRead(note.id)
                          if (success) {
                            setNotifications(prev => prev.map(n => n.id === note.id ? { ...n, is_read: true } : n))
                          }
                        }}
                        className="h-auto p-0 text-[9px] font-black uppercase tracking-widest text-primary hover:underline justify-start"
                      >
                        Acknowledge directive
                      </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Member Identity Details */}
          <div className="bg-surface-warm border-t-[4px] border-t-transparent relative overflow-hidden rounded-sm shadow-sm flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <div className="p-6 sm:p-8 flex-1">
              <h3 className="mb-6 sm:mb-8 border-b border-accent/20 pb-4 text-on-surface uppercase tracking-widest font-black text-sm">Identity Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 sm:gap-y-10 gap-x-12">
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Full Name</p>
                  <p className="text-lg font-bold text-on-surface truncate mb-0">{member?.full_name || 'Not Available'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Registration Number</p>
                  <p className="text-lg font-bold text-on-surface break-all sm:break-normal mb-0">{member?.registration_number || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Platform</p>
                  <span className="inline-block px-4 py-1.5 bg-primary text-white text-[10px] font-black tracking-widest rounded-none shadow-lg shadow-primary/20">
                    {member?.platform || 'GHANA'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Verification Status</p>
                  <span className={cn(
                    "inline-block px-4 py-1.5 text-white text-[10px] font-bold tracking-widest rounded-none shadow-lg",
                    (member?.status === 'Active' || member?.status === 'Approved') ? "bg-emerald-600 shadow-emerald-600/20" : "bg-amber-600 shadow-amber-600/20"
                  )}>
                    {(member?.status === 'Active' || member?.status === 'Approved') ? 'Verified Patriot' : 'Pending Review'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Phone Number</p>
                  <p className="text-lg font-bold text-on-surface">{member?.phone_number || 'Not Provided'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Age Range</p>
                  <p className="text-lg font-bold text-on-surface">{member?.age_range || 'Not Set'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Gender</p>
                  <p className="text-lg font-bold text-on-surface">{member?.gender || 'Not Set'}</p>
                </div>
                {member?.region && (
                  <div className="min-w-0">
                    <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Region</p>
                    <p className="text-lg font-bold text-on-surface truncate">{member.region}</p>
                  </div>
                )}
                {member?.chapter && (
                  <div className="min-w-0">
                    <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Assigned Chapter</p>
                    <p className="text-lg font-bold text-on-surface truncate">{member.chapter}</p>
                  </div>
                )}
                {member?.profession && (
                  <div className="min-w-0">
                    <p className="text-[10px] text-accent uppercase tracking-[0.2em] mb-2 font-black">Profession</p>
                    <p className="text-lg font-bold text-on-surface truncate">{member.profession}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verified Civic Member Integration */}
            <div className="p-6 border-t border-accent/10 flex items-center gap-4 bg-accent/5 mt-auto">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-accent text-2xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>verified_user</span>
              </div>
              <div>
                <p className="font-black tracking-tighter text-on-surface text-sm mb-0.5 leading-none">Verified civic member</p>
                <p className="text-[9px] font-bold text-on-surface/30 mb-0 leading-none">Authenticated for official voting and policy contribution.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobilization Impact Progress */}
        <div className="bg-white border border-border/40 rounded-sm shadow-sm p-6 sm:p-8 col-span-1 lg:col-span-12 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface m-0 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Mobilization Impact
              </h3>
              <p className="text-[9px] font-black text-on-surface/20 tracking-widest mt-1">Total points earned through direct action.</p>
            </div>
            <span className="text-2xl font-black italic tracking-tighter text-primary">{totalPoints.toLocaleString()}</span>
          </div>
          
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded-none overflow-hidden relative border border-border/10">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min((totalPoints / 1000) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-on-surface/20 tracking-widest">Next milestone: Chapter Leader</span>
              <span className="text-[9px] font-black text-on-surface/40 tracking-widest">
                {1000 - totalPoints > 0 ? `${1000 - totalPoints} points remaining` : 'Elite Achievement Unlocked'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Referral/Invite (Full Width Banner) */}
        <section className="lg:col-span-12">
          <div className="bg-primary-container p-8 md:p-12 border-none relative overflow-hidden group rounded-sm shadow-xl flex flex-col lg:flex-row lg:items-center gap-10">
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            </div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
            
            <div className="flex-1 relative z-10">
              <h2 className="text-white mb-4 text-2xl font-black italic tracking-tighter">Invite others to join The Base</h2>
              <p className="text-white/70 text-sm font-medium leading-relaxed max-w-2xl mb-0">
                Our collective strength is architected through shared participation. Share your unique registration link with fellow Ghanaians and help build a more resilient and representative civic voice for the nation.
              </p>
            </div>

            <div className="w-full lg:w-1/2 min-w-[320px] relative z-10 bg-white/5 p-4 border border-white/10 backdrop-blur-sm rounded-sm">
              <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.2em] mb-3">Your Strategic Referral Link</p>
              <div className="relative mb-4">
                <input 
                  className="w-full bg-white/5 border border-white/20 text-white font-medium py-2 pl-3 pr-10 rounded-none focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-white/20 text-xs tracking-tight" 
                  readOnly 
                  type="text" 
                  value={`${window.location.origin}/join?ref=${member?.registration_number || 'PATRIOT'}`} 
                />
                <button 
                  onClick={() => {
                    const refLink = `${window.location.origin}/join?ref=${member?.registration_number || 'PATRIOT'}`
                    navigator.clipboard.writeText(refLink)
                    toast.success('Registration link copied to tactical clipboard.')
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-accent hover:text-white transition-colors bg-white/10 rounded-none border border-white/10"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>content_copy</span>
                </button>
              </div>
              <Button 
                variant="accent"
                onClick={handleShare}
                className="w-full py-4 uppercase tracking-[0.3em] text-[9px] flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-black/20"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>share</span>
                Invite & Share
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Section 4: Achievements & Regional Leaderboard */}
      <section className="mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Gallery */}
          <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-on-surface/5 border-b border-border/10 p-6 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface flex items-center gap-2 m-0">
                <Trophy className="w-4 h-4 text-accent" />
                Movement Achievements
              </h3>
              <span className="text-[9px] font-black text-on-surface/20 tracking-widest">{achievements.length} badges earned</span>
            </div>
            <div className="p-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Earned Badges */}
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex flex-col items-center text-center group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 border-2 border-accent/50 bg-[radial-gradient(circle_at_center,_rgba(184,134,11,0.1)_0%,transparent_100%)] shadow-sm group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-[10px] font-black tracking-tight text-on-surface m-0">{achievement.name}</p>
                  <p className="text-[8px] text-on-surface/40 font-black mt-1 leading-tight">{achievement.description}</p>
                </div>
              ))}

              {/* Next Milestones (Locked) */}
              {allAvailableAchievements
                .filter(a => !achievements.some(ea => ea.id === a.id))
                .slice(0, 3)
                .map((locked) => (
                <div key={locked.id} className="flex flex-col items-center text-center opacity-40 group">
                  <div className="w-16 h-16 bg-on-surface/5 rounded-full flex items-center justify-center mb-3 border-2 border-border/10 grayscale">
                    <Medal className="w-6 h-6 text-on-surface/10" />
                  </div>
                  <p className="text-[10px] font-black tracking-tight text-on-surface/20 m-0">{locked.name}</p>
                  <p className="text-[8px] text-on-surface/10 font-black mt-1 leading-tight">Locked ({locked.points_awarded || 0} pts)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Leaderboard */}
          <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden">
            <div className="bg-on-surface/5 border-b border-border/10 p-6 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface flex items-center gap-2 m-0">
                <TrendingUp className="w-4 h-4 text-primary" />
                {member?.region || 'National'} Leaderboard
              </h3>
              <span className="text-[9px] font-bold text-on-surface/30 tracking-widest uppercase">Top Community Members</span>
            </div>
            <div className="divide-y divide-border/10">
              {leaderboard.map((entry) => (
                <div key={entry.name} className="p-4 flex items-center justify-between hover:bg-on-surface/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-black ${
                      entry.rank === 1 ? 'bg-accent text-on-surface' : 
                      entry.rank === 2 ? 'bg-on-surface/20 text-on-surface/60' : 
                      entry.rank === 3 ? 'bg-accent/30 text-accent' : 'bg-on-surface/5 text-on-surface/20'
                    }`}>
                      {entry.rank}
                    </span>
                    <div>
                      <p className="text-[10px] font-black tracking-tight text-on-surface m-0">{entry.name}</p>
                      <p className="text-[8px] text-on-surface/20 font-black tracking-widest">{entry.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary m-0">{entry.points.toLocaleString()}</p>
                    <p className="text-[8px] text-on-surface/10 font-black tracking-widest">Points</p>
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
          <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/settings">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">badge</span>
            <p className="font-meta text-[10px] font-bold uppercase tracking-widest text-on-surface">Member ID</p>
          </Link>
          <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/store">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">storefront</span>
            <p className="font-meta text-[10px] font-bold uppercase tracking-widest text-on-surface">Official Store</p>
          </Link>
          <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/polls">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">how_to_vote</span>
            <p className="font-meta text-[10px] font-bold uppercase tracking-widest text-on-surface">Opinion Polls</p>
          </Link>
          <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/feedback">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <span className="material-symbols-outlined text-destructive mb-3 text-3xl group-hover:scale-110 transition-transform">record_voice_over</span>
            <p className="font-meta text-[10px] font-bold uppercase tracking-widest text-on-surface">Feedback Hub</p>
          </Link>
          <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/canvass">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
            <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">diversity_3</span>
            <p className="font-meta text-[10px] font-bold uppercase tracking-widest text-on-surface">Outreach</p>
          </Link>
        </div>
      </section>

      {/* Section 6: Interactive Movement Roadmap */}
      <section className="mt-20">
        <MovementRoadmap />
      </section>

      {/* Movement Visual Anchor */}
      <section className={cn(
        "mt-16 overflow-hidden rounded-sm h-[300px] relative",
        lowBandwidthMode && "bg-primary"
      )}>
        {!lowBandwidthMode && (
          <img alt="The Base Banner" className="w-full h-full object-cover" src={settings.banner_image_url || "/the-base-banner-1.png"}  decoding="async" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/40 to-transparent flex flex-col justify-end items-end p-12 text-right">
          <h2 className="text-white mb-2">Together, we build the Ghana we deserve.</h2>
          <p className="text-white max-w-2xl mb-0">Ghana First is more than a slogan - it's a commitment to our shared prosperity and civic responsibility.</p>
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
