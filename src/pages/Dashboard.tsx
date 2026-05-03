import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { WelcomeModal } from '@/components/WelcomeModal'
import { ShareModal } from '@/components/ShareModal'
import { adminService } from '@/services/adminService'



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
}

export default function Dashboard() {
  const [stats, setStats] = useState<GrowthStats | null>(null)
  const [member, setMember] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareData, setShareData] = useState({ title: '', url: '' })

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
      // Simulate network delay for "Synchronizing Live Data" feel
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 1. Fetch Live Growth Stats
      const liveStats = await adminService.getGrowthStats()
      setStats(liveStats)

      // 2. Fetch Active Member Profile
      const regNo = localStorage.getItem('userRegNo')
      if (regNo) {
        const liveMember = await adminService.getMemberProfile(regNo)
        if (liveMember) {
          setMember({
            full_name: liveMember.name,
            registration_number: liveMember.id,
            platform: liveMember.type === 'Premium' ? 'DIASPORA' : 'GHANA',
            phone_number: liveMember.phone,
            age_range: 'Not Specified', // Default as it's not in the base Member interface
            gender: liveMember.gender || 'Not Set',
            region: liveMember.region,
            constituency: liveMember.constituency,
            chapter: liveMember.chapter || 'Central Chapter',
            profession: 'Member'
          })
        }
      }
      
      // Check if first time
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        setIsWelcomeModalOpen(true)
        localStorage.setItem('hasSeenWelcome', 'true')
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-off-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--brand-green)] border-t-transparent rounded-full animate-spin"></div>
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
          <span className="material-symbols-outlined mr-2 text-[var(--brand-green)]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>trending_up</span>
          Movement Growth
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>bolt</span>
            <p className="text-warm-gold text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 1 hour</p>
            <h1 className="text-[var(--brand-green)] leading-none mb-0">
              {stats?.joined_last_hour?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Active citizens joining the cause</p>
          </div>
          <div className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>history</span>
            <p className="text-warm-gold text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 24 hours</p>
            <h1 className="text-[var(--brand-green)] leading-none mb-0">
              {stats?.joined_last_24h?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Spanning all 16 regions of Ghana</p>
          </div>
          <div className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 sm:p-8 flex flex-col items-start rounded-sm shadow-sm transition-all hover:shadow-md">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-4" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>calendar_month</span>
            <p className="text-warm-gold text-xs sm:text-base mb-1 font-bold uppercase tracking-widest">Joined in last 7 days</p>
            <h1 className="text-[var(--brand-green)] leading-none mb-0">
              {stats?.joined_last_7d?.toLocaleString() || '0'}
            </h1>
            <p className="text-muted-gray mt-2 mb-0">Growing collective impact nationwide</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
        {/* Section 2: Member Details (Asymmetric Column) */}
        <section className="lg:col-span-7">
          <div className="bg-surface-warm border-t-[3px] border-t-warm-gold overflow-hidden rounded-sm shadow-sm">
            <div className="p-6 sm:p-8">
              <h3 className="mb-6 sm:mb-8 border-b border-divider-gold pb-4 text-on-surface">Member Identity Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-12">
                <div className="min-w-0">
                  <p className="text-[10px] text-warm-gold uppercase tracking-widest mb-1 font-bold">Full Name</p>
                  <p className="text-lg font-bold text-on-surface truncate mb-0">{member?.full_name || 'Not Available'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-warm-gold uppercase tracking-widest mb-1 font-bold">Registration Number</p>
                  <p className="text-lg font-bold text-on-surface break-all sm:break-normal mb-0">{member?.registration_number || 'N/A'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Platform</p>
                  <span className="inline-block px-3 py-1 bg-[var(--brand-green)] text-white text-[10px] font-bold tracking-tighter rounded-full">
                    {member?.platform || 'GHANA'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.phone_number || 'Not Provided'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Age Range</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.age_range || 'Not Set'}</p>
                </div>
                <div className="min-w-0">
                  <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-base sm:text-lg font-bold text-on-surface">{member?.gender || 'Not Set'}</p>
                </div>
                {member?.region && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Region</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.region}</p>
                  </div>
                )}
                {member?.chapter && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Assigned Chapter</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.chapter}</p>
                  </div>
                )}
                {member?.profession && (
                  <div className="min-w-0">
                    <p className="font-meta text-[10px] sm:text-xs text-warm-gold uppercase tracking-widest mb-1">Profession</p>
                    <p className="text-base sm:text-lg font-bold text-on-surface truncate">{member.profession}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

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
          <div className="p-6 border border-divider-gold flex items-center gap-4 bg-surface-container-low rounded-sm">
            <span className="material-symbols-outlined text-warm-gold text-3xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>verified_user</span>
            <div>
              <p className="font-bold text-on-surface text-sm">Verified Civic Member</p>
              <p className="text-xs text-muted-gray">Your profile is authenticated for official voting and policy polls.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Section 4: Quick Actions (Functional Grid) */}
      <section className="mt-12">
        <h3 className="text-on-surface mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 flex flex-col items-center text-center hover:bg-stone-200 transition-colors group rounded-sm shadow-sm" to="/settings">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-3 text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>badge</span>
            <p className="font-meta text-[11px] text-on-surface">Membership Card</p>
          </Link>
          <Link className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 flex flex-col items-center text-center hover:bg-stone-200 transition-colors group rounded-sm shadow-sm" to="/dashboard/store">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-3 text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>storefront</span>
            <p className="font-meta text-[11px] text-on-surface">Official Store</p>
          </Link>
          <Link className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 flex flex-col items-center text-center hover:bg-stone-200 transition-colors group rounded-sm shadow-sm" to="/dashboard/polls">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-3 text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>how_to_vote</span>
            <p className="font-meta text-[11px] text-on-surface">Opinion Polls</p>
          </Link>
          <Link className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 flex flex-col items-center text-center hover:bg-stone-200 transition-colors group rounded-sm shadow-sm" to="/dashboard/donate">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-3 text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>volunteer_activism</span>
            <p className="font-meta text-[11px] text-on-surface">Donate / Support</p>
          </Link>
          <Link className="bg-surface-warm border-t-[3px] border-t-warm-gold p-6 flex flex-col items-center text-center hover:bg-stone-200 transition-colors group rounded-sm shadow-sm" to="/settings">
            <span className="material-symbols-outlined text-[var(--brand-green)] mb-3 text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>manage_accounts</span>
            <p className="font-meta text-[11px] text-on-surface">Edit Profile</p>
          </Link>
        </div>
      </section>

      {/* Movement Visual Anchor */}
      <section className="mt-16 overflow-hidden rounded-xl h-[300px] relative">
        <img alt="The Base Banner" className="w-full h-full object-cover" src="/the-base-banner-1.png" />
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
