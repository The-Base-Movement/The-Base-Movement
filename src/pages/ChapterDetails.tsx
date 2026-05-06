import { useParams, Link } from 'react-router-dom'
import { MapPin, Users, Globe, ShieldCheck, Calendar, Share2, Mail, Phone, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useState } from 'react'
import { ShareModal } from '@/components/ShareModal'
import { useChapters } from '@/context/ChaptersContext'
import { LoadingScreen } from '../components/LoadingScreen'

export default function ChapterDetails() {
  const { id } = useParams<{ id: string }>()
  const { chapters, isLoading } = useChapters()
  const chapter = chapters.find(c => c.id === id)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  if (isLoading) return <LoadingScreen />

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Chapter Not Found</h2>
          <Link to="/dashboard/chapters">
            <Button variant="default" className="rounded-none">Back to Chapters</Button>
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
                <span className={`px-3 py-0.5 rounded-none text-[9px] font-semibold tracking-widest uppercase ${
                  chapter.status === 'Active' || chapter.status === 'Member' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {chapter.status}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Verified Chapter</span>
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
                  {chapter.member_count} Active Members
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="default" 
                className="border-stone-200 text-stone-600 rounded-none h-12 px-6"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button className="bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-semibold tracking-widest text-xs h-12 px-8 rounded-none">
                Join This Chapter
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
                <h2 className="text-xl font-bold text-stone-900 tracking-tight font-meta mb-6 flex items-center gap-3">
                <Globe className="w-5 h-5 text-[var(--brand-green)]" />
                About This Chapter
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
                  <h4 className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Local Focus</h4>
                  <p className="text-sm font-bold text-stone-800">Youth Empowerment & Civic Literacy</p>
                </div>
                <div className="p-6 bg-stone-50 border border-stone-100 rounded-none">
                  <h4 className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Meeting Schedule</h4>
                  <p className="text-sm font-bold text-stone-800">Every First Saturday of the Month</p>
                </div>
              </div>
            </div>
          </section>

            {/* Recent Activities */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[var(--brand-green)]" />
                  Recent Activities
                </h2>
                <button className="text-[10px] font-semibold text-[var(--brand-green)] uppercase tracking-widest hover:underline">View All</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { title: "Regional Policy Townhall", date: "Oct 24, 2024", type: "Event" },
                  { title: "Community Outreach Program", date: "Oct 12, 2024", type: "Action" },
                  { title: "New Member Orientation", date: "Sep 28, 2024", type: "Onboarding" }
                ].map((activity, i) => (
                  <div key={i} className="bg-white border border-stone-200 p-6 rounded-none flex items-center justify-between group hover:border-[var(--brand-green)] transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-stone-50 flex flex-col items-center justify-center text-stone-400 font-meta">
                        <span className="text-[10px] font-bold uppercase">{activity.date.split(' ')[0]}</span>
                        <span className="text-lg font-black leading-none">{activity.date.split(' ')[1].replace(',', '')}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 group-hover:text-[var(--brand-green)] transition-colors">{activity.title}</h4>
                        <p className="text-xs text-stone-400 uppercase tracking-widest mt-1">{activity.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-[var(--brand-green)] transition-all" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Leadership Card */}
            <div className="bg-white border border-stone-200 rounded-none overflow-hidden flex flex-col">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
              <div className="p-8">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-6 border-b border-stone-100 pb-4">Chapter Leadership</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-none flex items-center justify-center text-stone-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">Dr. Samuel Appiah</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Regional Coordinator</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-none flex items-center justify-center text-stone-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">Sarah Mensah</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest">Chapter Secretary</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-stone-100 space-y-4">
                <div className="flex items-center gap-3 text-stone-500 text-sm">
                  <Mail className="w-4 h-4 text-[var(--brand-green)]" />
                  <span>{chapter.city_or_region.toLowerCase()}@thebasemovement.com</span>
                </div>
                <div className="flex items-center gap-3 text-stone-500 text-sm">
                  <Phone className="w-4 h-4 text-[var(--brand-green)]" />
                  <span>+233 (0) 50 123 4567</span>
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
              <h3 className="text-warm-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Official Verification</h3>
              <p className="text-sm leading-relaxed text-stone-300 mb-6">
                This chapter is officially recognized and verified by The Base National Headquarters. All activities are coordinated with the central movement agenda.
              </p>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium border border-green-100 w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            </div>
          </div>

          {/* Quick Support */}
          <div className="bg-stone-100 p-8 rounded-none border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4">Support Local</h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-6">
              Your donations to this specific chapter help fund local townhalls and community outreach programs in {chapter.city_or_region}.
            </p>
            <Link to="/dashboard/donate">
              <Button className="w-full bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white rounded-none">
                Donate to Chapter
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
