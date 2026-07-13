import { cn } from '@/lib/utils'

interface PublicFilterSectionProps {
  isMobile?: boolean
  searchTerm: string
  setSearchTerm: (v: string) => void
  totalChapters: number
  countryCount: number
  onRequestChapter: () => void
}

export function PublicFilterSection({
  isMobile = false,
  searchTerm,
  setSearchTerm,
  totalChapters,
  countryCount,
  onRequestChapter,
}: PublicFilterSectionProps) {
  return (
    <div className={cn('flex flex-col gap-6', isMobile && 'pb-20')}>
      <div className="bg-white border border-stone-200 p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="input-caa685"
              className="text-micro font-medium text-stone-900 mb-3 block"
            >
              Find your diaspora community
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                style={{ fontSize: 16 }}
              >
                search
              </span>
              <input
                aria-label="Search Base Diaspora communities"
                name="searchTerm"
                id="input-caa685"
                placeholder="Search by country or community"
                className="w-full pl-10 h-11 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-brand-green font-medium text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-stone-100">
            <button
              onClick={onRequestChapter}
              className="w-full font-bold tracking-tight text-xs h-12 px-6 bg-accent text-white border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>{' '}
              Start a Diaspora Community
            </button>
            <p className="text-stone-400 text-[11px] font-medium leading-relaxed mt-3 mb-0">
              Do not see your country or city? Help bring the Base Diaspora community together where
              you live.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#1a1a1a] p-8 text-white">
        <div className="space-y-8">
          <div>
            <p className="text-stone-500 text-[10px] font-bold tracking-tight">Diaspora Network</p>
            <p className="text-5xl font-meta font-bold tracking-tighter mt-2">{totalChapters}</p>
            <p className="text-[10px] font-bold text-stone-500 mt-1">Active Diaspora Communities</p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-brand-gold text-[10px] font-bold tracking-tight">Global Reach</p>
            <p className="text-5xl font-meta font-bold tracking-tighter mt-2">{countryCount}</p>
            <p className="text-[10px] font-bold text-stone-500 mt-1">Countries represented</p>
          </div>
        </div>
      </div>
    </div>
  )
}
