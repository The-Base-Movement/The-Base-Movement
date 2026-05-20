import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import type { DonationDetail } from '@/types/admin'

interface Stats {
  totalDonations: string
  activeChapters: string
  totalMembers: string
  countriesReached: string
  raised: number
  goal: number
  avgDonation: string
  totalContributors: number
}

interface Region {
  name: string
  engagement: number
}

interface Props {
  stats: Stats
  isLoading: boolean
  regions: Region[]
  activeFilter: 'day' | 'week' | 'month' | 'year' | 'custom'
  filteredActivity: DonationDetail[]
  allActivity: DonationDetail[]
  showFullActivity: boolean
  onFilterChange: (f: 'day' | 'week' | 'month' | 'year') => void
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
}: Props) {
  return (
    <main className="bg-stone-50/50 min-h-screen font-meta">
      <SEO
        title="Our Impact"
        description="Live analytics reflecting our collective momentum across the nation."
        canonical="/impact"
      />

      {showFullActivity && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm"
          onClick={onCloseFullLog}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-charcoal-dark mb-0">Full Activity Log</h2>
                <p className="text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight">
                  Verified movement contributions
                </p>
              </div>
              <button
                onClick={onCloseFullLog}
                className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-green transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {allActivity.length > 0 ? (
                allActivity.slice(0, 50).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs">
                        {item.fullName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal-dark mb-0">{item.fullName}</p>
                        <p className="text-tiny font-bold text-slate-400 mb-0 tracking-tight">
                          {item.country} • {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-green">₵{item.amount}</p>
                      <p className="text-micro font-semibold text-slate-300">Verified</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <span
                    className="material-symbols-outlined text-slate-100 block mx-auto mb-4"
                    style={{ fontSize: 48 }}
                  >
                    monitoring
                  </span>
                  <p className="text-sm font-bold text-slate-400 tracking-tight">
                    No activity recorded yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 40 }}>
                monitoring
              </span>
              Our Collective Impact
            </h1>
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Live analytics reflecting our collective momentum across the nation.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
          {[
            {
              label: 'Donations received',
              value: stats.totalDonations,
              icon: 'volunteer_activism',
              trend: '+12%',
              color: '#006B3F',
              status: 'No new donations yet today',
            },
            {
              label: 'Chapters active',
              value: stats.activeChapters,
              icon: 'track_changes',
              trend: '+2',
              color: '#DAA520',
              status: 'Verified',
            },
            {
              label: 'Registered members',
              value: stats.totalMembers,
              icon: 'groups',
              trend: '+15%',
              color: '#22C55E',
              status: 'National scale',
            },
            {
              label: 'Countries reached',
              value: stats.countriesReached,
              icon: 'public',
              trend: 'Global',
              color: '#3B82F6',
              status: 'Global',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="group hover:shadow-2xl transition-all duration-500 bg-white border border-stone-200 p-8 hover:-translate-y-1"
            >
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="w-12 h-12 bg-slate-100" />
                  <div className="h-8 bg-slate-100 w-3/4" />
                  <div className="h-4 bg-slate-100 w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-micro font-bold text-slate-400 tracking-tight mb-0">
                      {stat.status}
                    </p>
                    <span
                      className="material-symbols-outlined text-stone-300 group-hover:text-brand-green transition-colors"
                      style={{ fontSize: 14 }}
                    >
                      open_in_new
                    </span>
                  </div>
                  <div className="flex justify-between items-end mb-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 24, color: stat.color }}
                      >
                        {stat.icon}
                      </span>
                    </div>
                    <span className="text-micro font-bold text-brand-green bg-brand-green/10 px-2 py-1 flex items-center gap-1">
                      {stat.trend}{' '}
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                        open_in_new
                      </span>
                    </span>
                  </div>
                  <h3 className="text-stone-900 font-bold tracking-tighter leading-tight mb-0">
                    {stat.value}
                  </h3>
                  <p className="text-tiny font-bold text-stone-500 mt-1 mb-0 tracking-tight">
                    {stat.label}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-100 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-charcoal-dark flex items-center gap-2 mb-0">
                    <span
                      className="material-symbols-outlined text-brand-green"
                      style={{ fontSize: 20 }}
                    >
                      monitoring
                    </span>{' '}
                    Campaign progress
                  </h2>
                  <p className="text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight">
                    National Organizing Fund
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-charcoal-dark mb-0">
                    ₵{stats.raised.toLocaleString()}{' '}
                    <span className="text-slate-300">/ {stats.goal.toLocaleString()}</span>
                  </p>
                  <p className="text-micro font-bold text-brand-green mt-1 mb-0 tracking-tight">
                    {Math.round((stats.raised / stats.goal) * 100) >= 1
                      ? `${Math.round((stats.raised / stats.goal) * 100)}% achieved`
                      : 'Early momentum'}
                  </p>
                </div>
              </div>
              <div className="h-3 bg-slate-100 overflow-hidden border border-slate-200/50 mb-8">
                <div
                  className="h-full bg-brand-green transition-all duration-1000"
                  style={{ width: `${Math.min(100, (stats.raised / stats.goal) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Average donation', value: stats.avgDonation },
                  { label: 'Total contributors', value: stats.totalContributors.toLocaleString() },
                  { label: 'Last update', value: 'Just now' },
                ].map((s) => (
                  <div key={s.label} className="p-4 bg-slate-50/50 border border-slate-100">
                    <p className="text-micro font-bold text-slate-400 tracking-tight mb-1">
                      {s.label}
                    </p>
                    <p className="text-lg font-bold text-charcoal-dark mb-0">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-100 p-8">
              <h2 className="text-charcoal-dark mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-warm-gold" style={{ fontSize: 20 }}>
                  location_on
                </span>{' '}
                Regional engagement
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {regions.map((region) => (
                  <div key={region.name} className="p-4 border border-slate-100 bg-slate-50/30">
                    <p className="text-micro font-bold text-charcoal-dark tracking-tight">
                      {region.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-brand-green transition-all duration-1000"
                          style={{ width: `${region.engagement}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-tiny font-bold',
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
                <h5 className="text-charcoal-dark font-bold text-sm mb-0">Recent activity</h5>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ring-4 ring-red-500/10" />
              </div>
              <div className="flex gap-2 bg-slate-100/80 p-1.5 border border-slate-200/50 mb-6">
                {(['day', 'week', 'month', 'year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onFilterChange(t)}
                    className={cn(
                      'flex-1 h-8 text-micro font-bold capitalize transition-all',
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
                {filteredActivity.length > 0 ? (
                  filteredActivity.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs">
                          {item.fullName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-charcoal-dark mb-0">
                            {item.fullName}
                          </p>
                          <p className="text-tiny font-bold text-slate-400 mb-0">
                            {item.country} · {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-brand-green">₵{item.amount}</p>
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
                    <p className="text-micro font-bold text-slate-400">
                      No activity in this period
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50">
                <button
                  onClick={onViewFullLog}
                  className="w-full h-10 bg-slate-50 hover:bg-brand-green/5 text-slate-400 hover:text-brand-green text-micro font-bold tracking-tight border border-transparent transition-all flex items-center justify-center cursor-pointer"
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
