import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ChapterCard } from '@/components/ChapterCard'
import { useChapters } from '@/context/ChaptersContext'

const countryFlags: Record<string, string> = {
  'Germany': '🇩🇪', 'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'United States': '🇺🇸',
  'Austria': '🇦🇹', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Burkina Faso': '🇧🇫',
  'Cameroon': '🇨🇲', 'Canada': '🇨🇦', 'China': '🇨🇳', 'Czech Republic': '🇨🇿',
  'Denmark': '🇩🇰', 'Egypt': '🇪🇬', 'Finland': '🇫🇮', 'France': '🇫🇷',
  'India': '🇮🇳', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹',
  'Ivory Coast': '🇨🇮', 'Japan': '🇯🇵', 'Kenya': '🇰🇪', 'Kuwait': '🇰🇼',
  'Luxembourg': '🇱🇺', 'Malaysia': '🇲🇾', 'Mexico': '🇲🇽', 'Morocco': '🇲🇦',
  'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'Norway': '🇳🇴',
  'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦', 'Senegal': '🇸🇳', 'Singapore': '🇸🇬', 'South Africa': '🇿🇦',
  'South Korea': '🇰🇷', 'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
  'Tanzania': '🇹🇿', 'Thailand': '🇹🇭', 'Togo': '🇹🇬', 'Turkey': '🇹🇷',
  'United Arab Emirates': '🇦🇪'
}

const inputSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))',
  outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700,
  fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}
const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6,
}

export default function Chapters() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { chapters } = useChapters()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'ghana' | 'diaspora'>('ghana')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [regions, setRegions] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [userChapterName, setUserChapterName] = useState<string | null>(null)

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [chapterLocation, setChapterLocation] = useState('')
  const [chapterDescription, setChapterDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  useEffect(() => {
    adminService.getRegions().then(res => setRegions(['All Regions', ...res.map(r => r.name)]))
    const user = authService.getUser()
    if (user) adminService.getUserChapter(user.id).then(setUserChapterName)
  }, [])

  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedRegion, activeTab])

  const ghanaChapters = chapters.filter(c => c.country === 'Ghana')
  const diasporaChapters = chapters.filter(c => c.country !== 'Ghana')
  const activeChapters = (activeTab === 'ghana' ? ghanaChapters : diasporaChapters)
  const filteredChapters = activeChapters.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city_or_region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRegion = activeTab === 'diaspora' || selectedRegion === 'All Regions' || c.region === selectedRegion
    return matchSearch && matchRegion
  })

  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  const paginatedChapters = filteredChapters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const success = await adminService.submitChapterApplication({
        proposed_chapter_name: chapterLocation,
        region: 'National',
        constituency: 'To be assigned',
        vision_statement: chapterDescription,
        experience_summary: 'Submitted via Chapter Request Hub'
      })
      if (success) {
        setSubmissionSuccess(true)
        setTimeout(() => {
          setIsRequestModalOpen(false)
          setSubmissionSuccess(false)
          setChapterLocation('')
          setChapterDescription('')
        }, 500)
      } else {
        toast.error('Failed to submit chapter request. Please try again.')
      }
    } catch {
      toast.error('Strategic communication link failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Dashboard layout ──────────────────────────────────────────────────────
  if (isDashboard) {
    return (
      <div className="main">

        {/* Request chapter modal */}
        {isRequestModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsRequestModalOpen(false)}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', background: '#181d19', borderTop: '3px solid hsl(var(--primary))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>account_balance</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff' }}>Request a chapter</span>
                </div>
                <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Proposals are reviewed by the National Executive Committee for strategic alignment.
                </p>
              </div>

              {submissionSuccess ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--primary))', display: 'block', marginBottom: 12 }}>send</span>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>Request Submitted</div>
                  <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                    Your proposal for <strong>{chapterLocation}</strong> has been logged. Coordinators will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelSt}>Chapter location / country</label>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>location_on</span>
                      <input aria-label="e.g. Kumasi, Ashanti Region or London, UK" name="chapterLocation" id="input-c66f5d" required placeholder="e.g. Kumasi, Ashanti Region or London, UK" value={chapterLocation} onChange={e => setChapterLocation(e.target.value)} style={{ ...inputSt, paddingLeft: 32 }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelSt}>Why start a chapter here?</label>
                    <textarea aria-label="Describe local interest and your vision for organizing this hub…" name="chapterDescription" id="textarea-3c577c" required rows={4} placeholder="Describe local interest and your vision for organizing this hub…" value={chapterDescription} onChange={e => setChapterDescription(e.target.value)} style={{ ...inputSt, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.55 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid hsl(var(--border))' }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting} style={{ minWidth: 120, justifyContent: 'center' }}>
                      {isSubmitting ? 'Submitting…' : 'Submit request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Mobile filter modal */}
        {showMobileFilters && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }} onClick={() => setShowMobileFilters(false)}>
            <div style={{ background: '#fff', width: 300, height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))' }}>Filters</span>
                <button onClick={() => setShowMobileFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>close</span>
                </button>
              </div>
              {/* Same filter controls rendered inline */}
              <DashboardFilterControls
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                activeTab={activeTab} setActiveTab={setActiveTab}
                selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
                regions={regions} chapters={chapters}
                onRequestChapter={() => { setShowMobileFilters(false); setIsRequestModalOpen(true) }}
              />
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="kpis" style={{ marginBottom: 24 }}>
          {[
            { label: 'Ghana chapters', value: ghanaChapters.length, sub: 'Regional hubs', bar: 'hsl(var(--primary))', icon: 'flag' },
            { label: 'Diaspora chapters', value: diasporaChapters.length, sub: 'International hubs', bar: 'hsl(var(--accent))', icon: 'public' },
            { label: 'Total chapters', value: chapters.length, sub: 'Active network', bar: 'hsl(var(--on-surface))', icon: 'account_balance' },
            { label: 'Countries', value: new Set(chapters.map(c => c.country)).size, sub: 'Global presence', bar: 'hsl(var(--destructive))', icon: 'travel_explore' },
          ].map(kpi => (
            <div key={kpi.label} className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>{kpi.icon}</span>
              </div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{kpi.value}</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Mobile filter toggle */}
        <div className="mobile-only" style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowMobileFilters(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
            Filter & Search
          </button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsRequestModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Request chapter
          </button>
        </div>

        <div className="sidebar-main" style={{ alignItems: 'start' }}>

          {/* Sidebar */}
          <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DashboardFilterControls
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              activeTab={activeTab} setActiveTab={setActiveTab}
              selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion}
              regions={regions} chapters={chapters}
              onRequestChapter={() => setIsRequestModalOpen(true)}
            />
          </div>

          {/* Chapter grid */}
          <div>
            {paginatedChapters.length === 0 ? (
              <div className="panel" style={{ padding: 48, textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>account_balance</span>
                <p style={{ margin: '0 0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>No chapters found matching your query.</p>
                <button className="btn btn-outline btn-sm" onClick={() => setSearchTerm('')} style={{ justifyContent: 'center' }}>Clear search</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {paginatedChapters.map(chapter => (
                  <ChapterCard key={chapter.id} chapter={chapter} countryFlags={countryFlags} userChapterName={userChapterName} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, paddingTop: 20, borderTop: '1px solid hsl(var(--border))' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={currentPage === i + 1 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ minWidth: 36, justifyContent: 'center' }}>
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-outline btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // ── Public layout (preserved) ─────────────────────────────────────────────
  const FilterSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex flex-col gap-6", isMobile && "pb-20")}>
      <div className="bg-white border border-stone-200 p-6">
        <div className="space-y-6">
          <div>
            <label className="text-micro font-medium text-stone-900 mb-3 block">Search hubs</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" style={{ fontSize: 16 }}>search</span>
              <input aria-label="Search by city, name" name="searchTerm" id="input-caa685" placeholder="Search by city, name..." className="w-full pl-10 h-11 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-brand-green font-medium text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-stone-900 mb-3 block">Region filter</label>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setActiveTab('ghana'); setSelectedRegion('All Regions') }} className={cn("w-full flex items-center justify-between font-medium tracking-tight text-xs h-11 px-4 border cursor-pointer transition-colors", activeTab === 'ghana' ? "bg-brand-green text-white border-brand-green" : "bg-white text-stone-500 border-stone-200 hover:border-brand-green")}>
                Ghana regions <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
              </button>
              {activeTab === 'ghana' && regions.length > 0 && (
                <select name="selectedRegion" id="select-6d5c40" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className="w-full h-11 bg-stone-100 border border-stone-200 text-stone-900 font-medium text-[10px] px-3 outline-none appearance-none cursor-pointer">
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
              <button onClick={() => { setActiveTab('diaspora'); setSelectedRegion('All Regions') }} className={cn("w-full flex items-center justify-between font-medium tracking-tight text-xs h-11 px-4 border cursor-pointer transition-colors", activeTab === 'diaspora' ? "border-brand-green text-brand-green" : "border-stone-200 text-stone-500 hover:border-brand-green")}>
                Global diaspora <span className="material-symbols-outlined" style={{ fontSize: 16 }}>public</span>
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-stone-100">
            <button onClick={() => setIsRequestModalOpen(true)} className="w-full font-bold tracking-tight text-xs h-12 px-6 bg-accent text-white border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Request a Chapter
            </button>
          </div>
        </div>
      </div>
      <div className="bg-[#1a1a1a] p-8 text-white">
        <div className="space-y-8">
          <div>
            <p className="text-stone-500 text-[10px] font-bold tracking-tight">Global Network</p>
            <p className="text-5xl font-meta font-bold tracking-tighter mt-2">{chapters.length}</p>
            <p className="text-[10px] font-bold text-stone-500 mt-1">Active Chapters</p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-brand-gold text-[10px] font-bold tracking-tight">Global Presence</p>
            <p className="text-5xl font-meta font-bold tracking-tighter mt-2">{new Set(chapters.map(c => c.country)).size}</p>
            <p className="text-[10px] font-bold text-stone-500 mt-1">Active Countries</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <SEO title="Movement Chapters" description="Connect with your local community through our global network of regional hubs." canonical="/chapters" />
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6">Movement Chapters</h1>
            <div className="bl"><div /><div /><div /></div>
            <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Connect with your local community through our global network of {chapters.length}+ regional hubs.
            </p>
          </div>
        </div>
      </header>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] flex items-start justify-start" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowMobileFilters(false)}>
          <div className="bg-white w-[300px] h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <span className="font-meta font-bold tracking-tight text-lg">Filters</span>
              <button onClick={() => setShowMobileFilters(false)} className="bg-none border-none cursor-pointer"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span></button>
            </div>
            <div className="p-6"><FilterSection isMobile /></div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        <div className="lg:hidden mb-8 flex gap-4">
          <button onClick={() => setShowMobileFilters(true)} className="flex-1 h-12 gap-2 font-bold text-xs border border-stone-200 bg-white cursor-pointer hover:bg-stone-50 flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span> Filter & Search
          </button>
          <button onClick={() => setIsRequestModalOpen(true)} className="flex-1 font-bold text-xs h-12 bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Request
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block lg:w-[320px] shrink-0 sticky top-0 self-start"><FilterSection /></aside>
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedChapters.map(chapter => <ChapterCard key={chapter.id} chapter={chapter} countryFlags={countryFlags} userChapterName={userChapterName} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-12 pt-12 border-t border-stone-100 flex items-center justify-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 px-3 border border-stone-200 bg-white text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-brand-green hover:text-brand-green transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={cn("w-9 h-9 border text-xs font-bold cursor-pointer transition-colors", currentPage === i + 1 ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 hover:border-brand-green hover:text-brand-green")}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 px-3 border border-stone-200 bg-white text-xs font-bold cursor-pointer disabled:opacity-30 hover:border-brand-green hover:text-brand-green transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>
            )}
            {filteredChapters.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-stone-200">
                <span className="material-symbols-outlined text-stone-200 block mx-auto mb-4" style={{ fontSize: 48 }}>account_balance</span>
                <p className="text-stone-400 font-bold tracking-tight">No strategic hubs found.</p>
                <button onClick={() => setSearchTerm('')} className="mt-4 text-brand-green font-bold text-xs bg-transparent border-none cursor-pointer hover:underline">Clear search</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setIsRequestModalOpen(false)}>
          <div className="bg-white w-full max-w-[500px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 bg-charcoal-dark text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 20 }}>account_balance</span>
                <h3 className="text-xl font-bold tracking-tight font-meta m-0">Request a chapter</h3>
              </div>
              <p className="text-stone-400 text-xs font-bold tracking-tight m-0">Proposals reviewed by the National Executive Committee.</p>
            </div>
            {submissionSuccess ? (
              <div className="p-12 text-center space-y-4">
                <span className="material-symbols-outlined text-brand-green block mx-auto" style={{ fontSize: 32 }}>send</span>
                <h3 className="text-stone-900">Request Submitted</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">Your proposal for <span className="font-bold text-brand-green">{chapterLocation}</span> has been logged.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-micro font-medium text-stone-400">Chapter location / country</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" style={{ fontSize: 16 }}>location_on</span>
                    <input aria-label="e.g. Kumasi, Ashanti Region or London, UK" name="chapterLocation" id="input-53d016" required placeholder="e.g. Kumasi, Ashanti Region or London, UK" value={chapterLocation} onChange={e => setChapterLocation(e.target.value)} className="w-full pl-10 h-12 bg-stone-50 border border-stone-200 font-medium text-sm outline-none focus:border-brand-green" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-micro font-medium text-stone-400">Why start a chapter here?</label>
                  <textarea aria-label="Describe local interest and your vision…" name="chapterDescription" id="textarea-7ec95d" required placeholder="Describe local interest and your vision…" value={chapterDescription} onChange={e => setChapterDescription(e.target.value)} className="w-full min-h-[120px] bg-stone-50 border border-stone-200 font-medium text-sm p-4 outline-none focus:border-brand-green resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsRequestModalOpen(false)} className="px-4 h-12 text-stone-400 text-xs font-bold border border-stone-200 bg-white cursor-pointer hover:bg-stone-50">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-primary text-white font-bold text-xs border-none cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity min-w-[140px]">
                    {isSubmitting ? 'Processing...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Dashboard filter controls extracted to avoid duplication
function DashboardFilterControls({ searchTerm, setSearchTerm, activeTab, setActiveTab, selectedRegion, setSelectedRegion, regions, chapters, onRequestChapter }: {
  searchTerm: string; setSearchTerm: (v: string) => void
  activeTab: 'ghana' | 'diaspora'; setActiveTab: (v: 'ghana' | 'diaspora') => void
  selectedRegion: string; setSelectedRegion: (v: string) => void
  regions: string[]
  chapters: { country: string }[]
  onRequestChapter: () => void
}) {
  const sectionSt = { paddingTop: 16, marginTop: 16, borderTop: '1px solid hsl(var(--border))' }
  const headSt: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginBottom: 10 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
        <input aria-label="Search chapters…" name="searchTerm" id="input-db9159" type="text" placeholder="Search chapters…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 40, paddingLeft: 32, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }} />
      </div>

      {/* Network */}
      <div style={sectionSt}>
        <div style={headSt}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>public</span>Network</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[{ v: 'ghana' as const, icon: 'flag', label: 'Ghana' }, { v: 'diaspora' as const, icon: 'public', label: 'Diaspora' }].map(t => (
            <button key={t.v} onClick={() => { setActiveTab(t.v); setSelectedRegion('All Regions') }} className={activeTab === t.v ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'} style={{ justifyContent: 'center', flexDirection: 'column', height: 52, gap: 2 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 10 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Region (Ghana only) */}
      {activeTab === 'ghana' && regions.length > 0 && (
        <div style={sectionSt}>
          <div style={headSt}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>Region</div>
          <div style={{ position: 'relative' }}>
            <select name="selectedRegion" id="select-3eb288" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ width: '100%', height: 40, padding: '0 32px 0 12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, borderRadius: 4, color: 'hsl(var(--on-surface))', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>expand_more</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={sectionSt}>
        <div style={{ background: '#181d19', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total chapters</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1 }}>{chapters.length}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Countries</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1 }}>{new Set(chapters.map(c => c.country)).size}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Request button */}
      <div style={sectionSt}>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onRequestChapter}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Request a chapter
        </button>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textAlign: 'center', marginTop: 8, fontStyle: 'italic' }}>
          Don't see your region? Propose a new hub.
        </p>
      </div>
    </div>
  )
}
