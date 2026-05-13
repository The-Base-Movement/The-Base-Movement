import { Activity, Search, Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { ButtonActiveTab } from '@/components/buttons/ButtonActiveTab'
import { ButtonInactiveTab } from '@/components/buttons/ButtonInactiveTab'
import { Card } from '@/components/ui/card'
import { LiveContributionFeed } from '@/components/LiveContributionFeed'
import type { DonationDetail } from '@/types/admin'

interface SpendingRecord {
  id: string
  chapter: string
  type: string
  amount: string
  description: string
  category: string
  date: string
}

interface OperationalTransparencyProps {
  globalStats: { totalRaised: number; totalMembers: number }
  historyTab: 'contributions' | 'spending'
  setHistoryTab: (tab: 'contributions' | 'spending') => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  contributionFilter: 'all' | 'me'
  setContributionFilter: (filter: 'all' | 'me') => void
  loading: boolean
  publicHistory: DonationDetail[]
  personalHistory: DonationDetail[]
  spendingHistory: SpendingRecord[]
  onDownload: () => void
  onOpenAudit: () => void
}

export function OperationalTransparency({
  globalStats,
  historyTab,
  setHistoryTab,
  searchQuery,
  setSearchQuery,
  contributionFilter,
  setContributionFilter,
  loading,
  publicHistory,
  personalHistory,
  spendingHistory,
  onDownload,
  onOpenAudit
}: OperationalTransparencyProps) {
  return (
    <section className="mt-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4">
            <Activity className="w-8 h-8 text-brand-green" />
            Capital deployment history
          </h2>
          <p className="text-sm font-bold text-stone-400 tracking-tight mt-2">Live immutable record of member mobilization.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-8 py-4 bg-white border border-stone-200 text-center rounded-none shadow-sm min-w-[160px]">
            <p className="text-micro font-medium text-stone-400 tracking-tight mb-1">Movement reserves</p>
            <p className="text-xl font-bold text-stone-900 tracking-tight font-meta">₵ {globalStats.totalRaised.toLocaleString()}</p>
          </div>
          <div className="px-8 py-4 bg-brand-green/10 border border-brand-green/20 text-center rounded-none shadow-sm min-w-[160px]">
            <p className="text-micro font-medium text-brand-green tracking-tight mb-1">Active patriots</p>
            <p className="text-xl font-bold text-brand-green tracking-tight font-meta">{globalStats.totalMembers}</p>
          </div>
        </div>
      </div>

      {/* advanced controls & filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-3 bg-stone-50 border border-stone-200 mb-8">
        <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-inner">
          {historyTab === 'contributions' ? (
            <ButtonActiveTab 
              onClick={() => setHistoryTab('contributions')}
              className="px-10 h-12 text-tiny tracking-tight flex items-center justify-between gap-3"
            >
              Mobilization history
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </ButtonActiveTab>
          ) : (
            <ButtonInactiveTab 
              onClick={() => setHistoryTab('contributions')}
              className="px-10 h-12 text-tiny tracking-tight border-stone-200 hover:bg-stone-50 shadow-sm"
            >
              Mobilization history
            </ButtonInactiveTab>
          )}
          {historyTab === 'spending' ? (
            <ButtonActiveTab 
              onClick={() => setHistoryTab('spending')}
              className="px-10 h-12 text-tiny tracking-tight flex items-center justify-between gap-3"
            >
              Spending & allocation
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </ButtonActiveTab>
          ) : (
            <ButtonInactiveTab 
              onClick={() => setHistoryTab('spending')}
              className="px-10 h-12 text-tiny tracking-tight border-stone-200 hover:bg-stone-50 shadow-sm"
            >
              Spending & allocation
            </ButtonInactiveTab>
          )}
        </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1 justify-end">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="text"
                placeholder="Search mobilization ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-stone-200 rounded-none text-sm font-bold tracking-tight focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
              />
            </div>
            {historyTab === 'contributions' && (
              <div className="flex items-center gap-2">
                {contributionFilter === 'all' ? (
                  <ButtonActiveTab 
                    onClick={() => setContributionFilter('all')}
                    className="px-6 h-12 text-tiny tracking-tight transition-all shadow-sm active:scale-95 flex items-center gap-3"
                  >
                    All records
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </ButtonActiveTab>
                ) : (
                  <ButtonInactiveTab 
                    onClick={() => setContributionFilter('all')}
                    className="px-6 h-12 text-tiny tracking-tight transition-all shadow-sm active:scale-95 border-stone-200 hover:bg-stone-50"
                  >
                    All records
                  </ButtonInactiveTab>
                )}
                {contributionFilter === 'me' ? (
                  <ButtonActiveTab 
                    onClick={() => setContributionFilter('me')}
                    className="px-6 h-12 text-tiny tracking-tight transition-all shadow-sm active:scale-95 flex items-center gap-3"
                  >
                    My records
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </ButtonActiveTab>
                ) : (
                  <ButtonInactiveTab 
                    onClick={() => setContributionFilter('me')}
                    className="px-6 h-12 text-tiny tracking-tight transition-all shadow-sm active:scale-95 border-stone-200 hover:bg-stone-50"
                  >
                    My records
                  </ButtonInactiveTab>
                )}
              </div>
            )}
          </div>
      </div>
      
      <div className="flex flex-col gap-12">
        <div className="w-full">
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
            <div className="p-8">
              <LiveContributionFeed />
            </div>
          </Card>
        </div>
        
        <div className="w-full">
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white h-full">
            <div className="flex items-center justify-between p-8 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 font-meta tracking-tight text-lg">Tactical deployment ledger</h3>
              <ButtonPrimary size="sm" onClick={onDownload} className="text-tiny">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </ButtonPrimary>
            </div>

            {/* desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">deployment details</th>
                    <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">capital</th>
                    <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">channel</th>
                    <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">verification</th>
                    <th className="p-6 text-micro font-medium text-stone-400 tracking-tight text-right">audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-medium tracking-tight italic">
                        synchronizing tactical ledger...
                      </td>
                    </tr>
                  ) : historyTab === 'contributions' ? (
                    (() => {
                      const data = contributionFilter === 'all' ? publicHistory : personalHistory
                      const filtered = data.filter(item => 
                        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.amount.includes(searchQuery)
                      )
                      return filtered.length > 0 ? (
                        filtered.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="p-6">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-stone-900 tracking-tight mb-1">{item.fullName}</p>
                            <p className="text-micro font-medium text-brand-green tracking-tight">{item.campaignTitle || 'Strategic Fund'}</p>
                            <p className="text-[10px] text-stone-400 font-medium mt-1">{item.date}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-sm font-bold text-stone-900 font-meta">
                            {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold text-stone-500">{item.method}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              item.status === 'Verified' ? "bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]" : "bg-brand-gold shadow-[0_0_8px_var(--brand-gold-full)]"
                            )} />
                            <span className="text-tiny font-medium text-stone-700">{item.status}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-micro font-bold text-stone-300 font-mono">{item.reference}</span>
                        </td>
                      </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic">
                            no records found matching search.
                          </td>
                        </tr>
                      )
                    })()
                  ) : (
                    spendingHistory.length > 0 ? (
                      spendingHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="p-6">
                            <div className="flex flex-col">
                              <p className="text-sm font-bold text-stone-900 tracking-tight mb-1">{item.description}</p>
                              <p className="text-micro font-bold text-brand-red tracking-tight">{item.chapter} Hub • {item.category}</p>
                              <p className="text-[10px] text-stone-400 font-medium mt-1">{item.date}</p>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-sm font-bold text-stone-900 font-meta">
                              {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "text-micro font-bold px-2 py-1 rounded-sm",
                              item.type === 'Expenditure' ? "bg-brand-red/10 text-brand-red" : "bg-brand-green/10 text-brand-green"
                            )}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-brand-green" />
                              <span className="text-tiny font-bold text-stone-700">Audited</span>
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-micro font-bold text-stone-300 font-mono">{item.id}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic">
                          no allocation records found.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* mobile card view */}
            <div className="sm:hidden divide-y divide-stone-100">
              {(() => {
                const data = contributionFilter === 'all' ? publicHistory : personalHistory
                const filtered = data.filter(item => 
                  item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  item.amount.includes(searchQuery)
                )
                return filtered.length > 0 ? (
                  filtered.map((item, idx) => (
                    <div key={idx} className="p-8 bg-white space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-stone-900 tracking-tight normal-case lowercase">{item.fullName}</p>
                          <p className="text-micro text-stone-400 font-bold tracking-tight mt-1">{item.date}</p>
                        </div>
                        <span className="px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green">
                          Verified
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">capital deployment</p>
                          <p className="text-xl font-bold text-stone-900 font-meta">
                            {item.amount.includes('₵') ? item.amount : `₵${item.amount.replace(/GHS/i, '').trim()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">channel</p>
                          <p className="text-micro font-bold text-stone-900 tracking-tight">{item.method}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-stone-400 text-tiny font-bold tracking-tight italic">
                    no records matching search.
                  </div>
                )
              })()}
            </div>

            <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
              <p className="text-micro font-bold text-stone-400 tracking-tight">live mobilization ledger</p>
              <ButtonPrimary 
                size="sm"
                onClick={onOpenAudit}
                className="text-micro"
              >
                Full operational audit
              </ButtonPrimary>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
