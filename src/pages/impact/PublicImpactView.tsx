import { cn } from '@/lib/utils'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import type { DonationDetail } from '@/types/admin'
import { ImpactActivityModal } from './ImpactActivityModal'

interface PublicImpactViewProps {
  stats: {
    totalDonations: string
    activeChapters: string
    totalMembers: string
    countriesReached: string
    raised: number
    goal: number
    avgDonation: string
    totalContributors: number
  }
  isLoading: boolean
  regions: { name: string; engagement: number }[]
  activeFilter: 'day' | 'week' | 'month' | 'year' | 'custom'
  filteredActivity: DonationDetail[]
  allActivity: DonationDetail[]
  showFullActivity: boolean
  onFilterChange: (filter: 'day' | 'week' | 'month' | 'year' | 'custom') => void
  onViewFullLog: () => void
  onCloseFullLog: () => void
}

export function PublicImpactView({
  stats,
  isLoading,
  regions,
  activeFilter,
  filteredActivity,
  allActivity,
  showFullActivity,
  onFilterChange,
  onViewFullLog,
  onCloseFullLog,
}: PublicImpactViewProps) {
  const displayActivity = filteredActivity.slice(0, 10)

  return (
    <main className="bg-slate-50 min-h-screen pb-24">
      {showFullActivity && (
        <ImpactActivityModal allActivity={allActivity} onClose={onCloseFullLog} />
      )}

      <header className="bg-white border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-24 relative z-10">
          <Breadcrumbs />
          <div className="max-w-3xl">
            <h1 className="text-slate-900 text-4xl md:text-6xl font-meta font-medium tracking-tighter mb-6 leading-[1.1]">
              Transparency in Action.
              <br />
              <span className="text-brand-green">Real Impact, Real People.</span>
            </h1>
            <BrandLine />
            <p className="text-slate-500 text-base md:text-xl font-medium leading-relaxed max-w-2xl mt-8">
              Every cedi contributed and every hour volunteered builds a stronger foundation for
              Ghana's future. Track our progress in real-time.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-green/5 skew-x-12 translate-x-24" />
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-brand-green p-8 text-white flex flex-col justify-between">
            <span className="text-micro font-medium uppercase tracking-widest opacity-60">
              Total Contributions
            </span>
            <div>
              <h2 className="text-4xl md:text-5xl font-meta font-medium tracking-tighter mt-4 mb-2">
                {isLoading ? '₵—' : stats.totalDonations}
              </h2>
              <div className="flex items-center gap-2 text-tiny font-medium text-white/60">
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                Updated in real-time
              </div>
            </div>
          </div>
          <div className="bg-charcoal-dark p-8 text-white flex flex-col justify-between">
            <span className="text-micro font-medium uppercase tracking-widest opacity-60">
              Active Patriots
            </span>
            <div>
              <h2 className="text-4xl md:text-5xl font-meta font-medium tracking-tighter mt-4 mb-2">
                {isLoading ? '—' : stats.totalMembers}
              </h2>
              <div className="flex items-center gap-2 text-tiny font-medium text-white/60">
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                Verified members worldwide
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2">
            <section className="bg-white border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-slate-900 font-meta font-medium text-lg mb-1">
                    Regional Engagement
                  </h3>
                  <p className="text-tiny font-medium text-slate-400 uppercase tracking-wider">
                    Mobilization index by region
                  </p>
                </div>
                <div className="bg-slate-50 px-3 py-1 text-micro font-medium text-slate-500 rounded border border-slate-100">
                  Top Performing
                </div>
              </div>

              <div className="space-y-8">
                {isLoading
                  ? Array(6)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="space-y-3 animate-pulse">
                          <div className="h-4 bg-slate-100 w-24 rounded" />
                          <div className="h-2.5 bg-slate-100 w-full rounded-full" />
                        </div>
                      ))
                  : regions.map((region) => (
                      <div key={region.name} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-medium text-slate-700">{region.name}</span>
                          <span className="text-tiny font-medium text-slate-400">
                            {region.engagement > 0 ? `${region.engagement}% scale` : 'Mobilizing'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-green transition-all duration-1000 ease-out"
                              style={{ width: `${region.engagement}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-tiny font-medium',
                              region.engagement > 0 ? 'text-brand-green' : 'text-slate-300'
                            )}
                          >
                            {region.engagement}%
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            </section>
          </div>

          <div>
            <section className="bg-white border border-slate-100 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-charcoal-dark font-medium text-sm mb-0">Recent activity</h5>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ring-4 ring-red-500/10" />
              </div>
              <div className="flex gap-2 bg-slate-100/80 p-1.5 border border-slate-200/50 mb-6 overflow-x-auto">
                {(['day', 'week', 'month', 'year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onFilterChange(t)}
                    className={cn(
                      'flex-1 h-8 px-3 text-micro font-medium capitalize transition-all',
                      activeFilter === t
                        ? 'bg-white text-brand-green shadow-md'
                        : 'text-slate-400 hover:text-slate-600'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="space-y-4 overflow-y-auto h-[360px]">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded" />
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-100 w-20 rounded" />
                            <div className="h-2 bg-slate-100 w-16 rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                ) : displayActivity.length > 0 ? (
                  displayActivity.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 bg-brand-green/10 flex items-center justify-center text-brand-green font-medium text-xs">
                          {(item.fullName || 'A')[0]}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-charcoal-dark mb-0">
                            {item.fullName || 'Anonymous Patriot'}
                          </p>
                          <p className="text-tiny font-medium text-slate-400 mb-0">
                            {item.country || 'Ghana'} · {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-brand-green">₵{item.amount}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200">
                    <span
                      className="material-symbols-outlined text-slate-200 mb-3"
                      style={{ fontSize: 32 }}
                    >
                      monitoring
                    </span>
                    <p className="text-micro font-medium text-slate-400">
                      No activity in this period
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50">
                <button
                  onClick={onViewFullLog}
                  className="w-full h-10 bg-slate-50 hover:bg-brand-green/5 text-slate-400 hover:text-brand-green text-micro font-medium tracking-tight border border-transparent transition-all flex items-center justify-center cursor-pointer"
                >
                  View full activity log{' '}
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, marginLeft: 8 }}
                  >
                    open_in_new
                  </span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
