import { Activity, Search, Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/neon-button'
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
    <section className="mt-32 lowercase">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4">
            <Activity className="w-8 h-8 text-brand-green" />
            capital deployment history
          </h2>
          <p className="text-sm font-bold text-stone-400 tracking-tight mt-2">live immutable record of member mobilization.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-8 py-4 bg-white border border-stone-200 text-center rounded-none shadow-sm min-w-[160px]">
            <p className="text-micro font-medium text-stone-400 tracking-tight mb-1">movement reserves</p>
            <p className="text-xl font-bold text-stone-900 tracking-tight font-meta">ghs {globalStats.totalRaised.toLocaleString()}</p>
          </div>
          <div className="px-8 py-4 bg-brand-green/10 border border-brand-green/20 text-center rounded-none shadow-sm min-w-[160px]">
            <p className="text-micro font-medium text-brand-green tracking-tight mb-1">active patriots</p>
            <p className="text-xl font-bold text-brand-green tracking-tight font-meta">{globalStats.totalMembers}</p>
          </div>
        </div>
      </div>

      {/* advanced controls & filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-3 bg-stone-50 border border-stone-200 mb-8">
        <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-inner">
          <Button 
            variant={historyTab === 'contributions' ? 'active-tab' : 'ghost'}
            onClick={() => setHistoryTab('contributions')}
            className={cn(
              "px-10 h-12 text-tiny font-bold tracking-tight rounded-none transition-all",
              historyTab === 'contributions' ? "" : "text-stone-500 hover:text-stone-900"
            )}
          >
            mobilization history
          </Button>
          <Button 
            variant={historyTab === 'spending' ? 'active-tab' : 'ghost'}
            onClick={() => setHistoryTab('spending')}
            className={cn(
              "px-10 h-12 text-tiny font-medium tracking-tight rounded-none transition-all",
              historyTab === 'spending' ? "" : "text-stone-500 hover:text-stone-900"
            )}
          >
            spending & allocation
          </Button>
        </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1 justify-end">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="text"
                placeholder="search mobilization ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-stone-200 rounded-none text-sm font-bold tracking-tight focus:border-stone-900 outline-none transition-all placeholder:text-stone-300 lowercase"
              />
            </div>
            {historyTab === 'contributions' && (
              <div className="flex items-center gap-2">
                <Button 
                  variant={contributionFilter === 'all' ? 'active-tab' : 'default'}
                  onClick={() => setContributionFilter('all')}
                  className="px-6 h-12 text-[10px] font-medium tracking-tight rounded-none transition-all shadow-sm active:scale-95 lowercase"
                >
                  all records
                </Button>
                <Button 
                  variant={contributionFilter === 'me' ? 'active-tab' : 'default'}
                  onClick={() => setContributionFilter('me')}
                  className="px-6 h-12 text-[10px] font-medium tracking-tight rounded-none transition-all shadow-sm active:scale-95 lowercase"
                >
                  my records
                </Button>
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
              <h3 className="font-bold text-stone-900 font-meta tracking-tight text-lg">tactical deployment ledger</h3>
              <Button variant="ghost" size="sm" onClick={onDownload} className="text-tiny font-medium tracking-tight text-stone-500 hover:text-stone-900 lowercase">
                <Download className="w-4 h-4 mr-2" /> export csv
              </Button>
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
                            <p className="text-sm font-bold text-stone-900 tracking-tight mb-1 lowercase first-letter:uppercase">{item.fullName}</p>
                            <p className="text-micro font-medium text-brand-green tracking-tight lowercase">{item.campaignTitle || 'strategic fund'}</p>
                            <p className="text-[10px] text-stone-400 font-medium mt-1">{item.date}</p>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="text-sm font-bold text-stone-900 font-meta">{item.amount}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold text-stone-500 lowercase">{item.method}</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              item.status === 'Verified' ? "bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]" : "bg-brand-gold shadow-[0_0_8px_var(--brand-gold-full)]"
                            )} />
                            <span className="text-tiny font-medium text-stone-700 lowercase">{item.status}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-micro font-bold text-stone-300 font-mono">{item.reference}</span>
                        </td>
                      </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase">
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
                              <p className="text-sm font-bold text-stone-900 tracking-tight mb-1 lowercase first-letter:uppercase">{item.description}</p>
                              <p className="text-micro font-bold text-brand-red tracking-tight lowercase">{item.chapter} hub • {item.category}</p>
                              <p className="text-[10px] text-stone-400 font-medium mt-1 uppercase">{item.date}</p>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-sm font-bold text-stone-900 font-meta">{item.amount}</span>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "text-micro font-bold px-2 py-1 rounded-sm lowercase",
                              item.type === 'Expenditure' ? "bg-brand-red/10 text-brand-red" : "bg-brand-green/10 text-brand-green"
                            )}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-brand-green" />
                              <span className="text-tiny font-bold text-stone-700 lowercase">audited</span>
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-micro font-bold text-stone-300 font-mono">{item.id}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase">
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
                        <span className="px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green lowercase">
                          verified
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">capital deployment</p>
                          <p className="text-xl font-bold text-stone-900 font-meta">{item.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">channel</p>
                          <p className="text-micro font-bold text-stone-900 tracking-tight lowercase">{item.method}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase">
                    no records matching search.
                  </div>
                )
              })()}
            </div>

            <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
              <p className="text-micro font-bold text-stone-400 tracking-tight">live mobilization ledger</p>
              <button 
                onClick={onOpenAudit}
                className="text-micro font-bold text-brand-green tracking-tight hover:text-stone-900 transition-all border-b border-brand-green/30 pb-1 lowercase"
              >
                full operational audit
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
