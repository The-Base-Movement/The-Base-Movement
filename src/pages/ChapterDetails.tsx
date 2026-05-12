import { useParams, Link } from 'react-router-dom'
import { MapPin, Users, Globe, ShieldCheck, Calendar, Share2, Mail, Phone, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useState } from 'react'
import { ShareModal } from '@/components/ShareModal'
import type { Chapter, ChapterLeader, ChapterActivity } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { LoadingScreen } from '../components/LoadingScreen'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
import { useToast } from '@/hooks/use-toast'

export default function ChapterDetails() {
  const { id } = useParams<{ id: string }>()
  const { chapters, isLoading } = useChapters()
  const chapter: Chapter | undefined = chapters.find(c => c.id === id)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const user = authService.getUser()

  const handleJoin = async () => {
    if (!user || !chapter) {
      toast({
        title: "Action required",
        description: !user ? "Please register or login to join." : "Chapter hub not found.",
        variant: "destructive"
      })
      return
    }

    const userChapter = user.user_metadata?.chapter

    if (userChapter === chapter.name) {
      toast({
        title: "Already a member",
        description: `You are already part of the ${chapter.name} chapter.`,
      })
      return
    }

    setIsJoining(true)
    try {
      const success = await adminService.joinChapter(chapter.name)
      if (success) {
        toast({
          title: "Mobilization Successful",
          description: `You have successfully joined the ${chapter.name} chapter hub.`,
        })
      } else {
        throw new Error('Join failed')
      }
    } catch {
      toast({
        title: "Mobilization Error",
        description: "Failed to process your chapter join request.",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) return <LoadingScreen />

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Chapter not found</h2>
          <Link to="/dashboard/chapters">
            <Button variant="default" className="rounded-none">Back to chapters</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-8 py-6">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-0.5 rounded-none text-micro font-bold tracking-tight ${
                  chapter.status === 'Active' || chapter.status === 'Member' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {chapter.status}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-micro font-bold text-stone-400 tracking-tight">Verified chapter</span>
              </div>
              <h1 className="text-4xl font-bold text-stone-900 tracking-tighter font-meta">
                {chapter.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-stone-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[var(--brand-green)]" />
                  {chapter.city_or_region}, {chapter.country}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[var(--brand-green)]" />
                  {chapter.member_count} Active members
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="rounded-none h-12 px-6 font-bold tracking-tight text-xs"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button 
                variant="primary"
                className="font-bold tracking-tight text-xs h-12 px-8 rounded-none"
                onClick={handleJoin}
                disabled={isJoining || (user?.user_metadata?.chapter === chapter.name)}
              >
                {isJoining ? 'Processing...' : (user?.user_metadata?.chapter === chapter.name ? 'Already a Member' : 'Join this chapter')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <section className="bg-white border border-stone-200 rounded-none overflow-hidden flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
              <div className="p-10">
                <h2 className="text-sm font-bold text-stone-900 tracking-tight font-meta mb-6 flex items-center gap-3 uppercase">
                <Globe className="w-5 h-5 text-[var(--brand-green)]" />
                About this chapter
              </h2>
              <div className="prose prose-stone max-w-none">
                <p className="text-stone-600 leading-relaxed italic border-l-4 border-warm-gold/30 pl-4 py-1">
                  {chapter.description}
                </p>
                <p className="text-stone-600 leading-relaxed mt-4">
                  Whether you're looking to volunteer, stay informed about local policy discussions, or connect with fellow movement members, the {chapter.name} provides the platform for meaningful civic engagement and collective action within {chapter.city_or_region}.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <div className="p-6 bg-stone-50 border border-stone-100 rounded-none">
                  <h4 className="text-micro font-bold text-stone-400 tracking-tight mb-2 uppercase">Local focus</h4>
                  <p className="text-sm font-bold text-stone-800">{chapter.local_focus || "Grassroots mobilization"}</p>
                </div>
                <div className="p-6 bg-stone-50 border border-stone-100 rounded-none">
                  <h4 className="text-micro font-bold text-stone-400 tracking-tight mb-2 uppercase">Meeting schedule</h4>
                  <p className="text-sm font-bold text-stone-800">{chapter.meeting_schedule || "Contact chapter for schedule"}</p>
                </div>
              </div>
            </div>
          </section>

            {/* Recent Activities */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-bold text-stone-900 tracking-tight font-meta flex items-center gap-3 uppercase">
                  <Calendar className="w-4 h-4 text-[var(--brand-green)]" />
                  Recent activities
                </h2>
                <button className="text-[10px] font-bold text-[var(--brand-green)] tracking-tight hover:underline uppercase">View all</button>
              </div>
              
              <div className="space-y-4">
                {chapter.activities && chapter.activities.length > 0 ? (
                  chapter.activities.map((activity: ChapterActivity, i: number) => {
                    const date = new Date(activity.activityDate);
                    const month = date.toLocaleString('en-US', { month: 'short' });
                    const day = date.getDate();
                    
                    return (
                      <div key={i} className="bg-white border border-stone-200 p-6 rounded-none flex items-center justify-between group hover:border-[var(--brand-green)] transition-colors">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-stone-50 flex flex-col items-center justify-center text-stone-400 font-meta">
                            <span className="text-micro font-bold uppercase">{month}</span>
                            <span className="text-lg font-bold leading-none">{day}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-stone-900 group-hover:text-[var(--brand-green)] transition-colors">{activity.title}</h4>
                            <p className="text-micro text-stone-400 tracking-tight mt-1 uppercase">{activity.type}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-[var(--brand-green)] transition-all" />
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center border border-dashed border-stone-200 bg-stone-50/30">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-[.06em]">No recent activities recorded</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Leadership Card */}
            <div className="bg-white border border-stone-200 rounded-none overflow-hidden flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
              <div className="p-8">
                <h3 className="text-sm font-bold tracking-tight mb-6 border-b border-stone-100 pb-4 text-stone-900">Chapter leadership</h3>
              <div className="space-y-6">
                {chapter.leadership && chapter.leadership.length > 0 ? (
                  chapter.leadership.map((leader: ChapterLeader, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-none overflow-hidden flex items-center justify-center text-stone-400">
                        {leader.imageUrl ? (
                          <img src={leader.imageUrl} alt={leader.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{leader.name}</p>
                        <p className="text-[10px] text-stone-500 font-normal tracking-tight normal-case">
                          {leader.role}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center border border-dashed border-stone-200 bg-stone-50/30">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-[.06em]">Leadership pending</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 pt-8 border-t border-stone-100 space-y-4">
                <div className="flex items-center gap-3 text-stone-50 text-sm">
                  <Mail className="w-4 h-4 text-[var(--brand-green)]" />
                  <span className="text-stone-500">{chapter.email || `${chapter.city_or_region.toLowerCase()}@thebasemovement.com`}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-50 text-sm">
                  <Phone className="w-4 h-4 text-[var(--brand-green)]" />
                  <span className="text-stone-500">{chapter.phone_number || "+233 (0) 50 123 4567"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Card */}
          <div className="bg-charcoal-dark p-8 rounded-none text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24 text-[var(--brand-green)]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-warm-gold text-micro font-bold tracking-tight mb-4">Official verification</h3>
              <p className="text-sm leading-relaxed text-stone-300 mb-6">
                This chapter is officially recognized and verified by The Base National Headquarters. All activities are coordinated with the central movement agenda.
              </p>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold border border-green-100 w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </div>

          {/* Quick Support */}
          <div className="bg-stone-100 p-8 rounded-none border border-stone-200">
            <h3 className="text-xs font-bold tracking-tight mb-4 text-stone-900">Support local</h3>
            <p className="text-[10px] text-stone-500 leading-relaxed mb-6">
              Your donations to this specific chapter help fund local townhalls and community outreach programs in {chapter.city_or_region}.
            </p>
            <Link to="/dashboard/donate">
              <Button 
                variant="gold"
                className="w-full text-xs font-bold tracking-tight h-12 rounded-none"
              >
                Donate to chapter
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </main>

    <ShareModal 
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      title={`Join ${chapter.name}`}
      url={window.location.href}
    />
  </div>
)
}
