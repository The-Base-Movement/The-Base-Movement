import { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  Search, 
  XCircle, 
  Eye,
  Calendar,
  CreditCard,
  ShieldCheck,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download
} from 'lucide-react'
import { 
  Card, 
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { DonationDetail } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function FinancialAudit() {
  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [stats, setStats] = useState({ totalContributions: 0, pendingCount: 0, approvedAmount: 0, flaggedCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('Pending')
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    const [data, statistics] = await Promise.all([
      adminService.getDonations(statusFilter),
      adminService.getDonationStats()
    ])
    setDonations(data)
    setStats(statistics)
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => {
      if (!ignore) {
        void fetchData()
      }
    }, 0)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [fetchData])

  const handleVerify = async (donationId: string, name: string, status: 'Verified' | 'Rejected') => {
    setIsVerifying(donationId)
    const success = await adminService.verifyDonation(donationId, status, `Verified by Admin via Command Center`)
    
    if (success) {
      toast({
        title: status === 'Verified' ? "Contribution verified" : "Contribution flagged",
        description: `The transaction from ${name} has been processed.`,
        variant: status === 'Verified' ? "default" : "destructive"
      })
      fetchData()
    } else {
      toast({
        title: "Verification failed",
        description: "An error occurred while updating the record.",
        variant: "destructive"
      })
    }
    setIsVerifying(null)
  }

  const filteredDonations = donations.filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reference.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = () => {
    try {
      const headers = ['Reference', 'Date', 'Donor Name', 'Country', 'Phone', 'Campaign', 'Method', 'Amount (GH₵)', 'Status']
      const csvData = filteredDonations.map(d => [
        d.reference.toUpperCase(),
        new Date(d.date).toLocaleDateString(),
        `"${d.fullName}"`,
        d.country,
        d.phone,
        `"${d.campaignTitle || 'General fund'}"`,
        d.method,
        d.amount,
        d.status
      ])

      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export complete",
        description: `Successfully downloaded ${filteredDonations.length} transaction records.`
      })
    } catch {
      toast({
        title: "Export failed",
        description: "There was an error compiling the ledger data.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-stone-900" />
            Financial audit
          </h1>
          <p className="text-stone-500 text-sm mt-1">Reviewing contributions, transactions, and campaign funding.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-10 px-6 text-[10px] font-bold normal-case border-stone-200 bg-white text-stone-600 shadow-sm rounded-xl hover:bg-stone-50"
            onClick={handleExport}
            disabled={filteredDonations.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export ledger
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fetchData()} 
            className="h-10 px-6 text-[10px] font-bold normal-case border-stone-200 bg-white text-stone-700 shadow-sm rounded-xl hover:bg-stone-50"
          >
            <Loader2 className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin")} />
            Sync ledger
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-stone-500 tracking-tight">Total Contributions</p>
            <h3 className="text-2xl font-bold text-stone-900">{stats.totalContributions.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-stone-400 mt-1">All-time recorded volume</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-stone-500 tracking-tight">Pending Review</p>
            <h3 className="text-2xl font-bold text-amber-600">{stats.pendingCount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-amber-600/70 mt-1">Awaiting administrative clearance</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-stone-500 tracking-tight">Approved Amount</p>
            <h3 className="text-2xl font-bold text-emerald-600">GH₵ {stats.approvedAmount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-emerald-600/70 mt-1">Total cleared funds</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-stone-500 tracking-tight">Flagged Transactions</p>
            <h3 className="text-2xl font-bold text-rose-600">{stats.flaggedCount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-rose-600/70 mt-1">Rejected or disputed records</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full flex-1 space-y-6">
          {/* Intelligence & Filtering */}
          <div className="bg-white border border-stone-200 p-2 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {['Pending', 'Verified', 'Rejected', 'All'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as 'All' | 'Pending' | 'Verified' | 'Rejected')}
                  className={cn(
                    "px-4 py-2 text-[10px] font-bold rounded-lg transition-all",
                    statusFilter === status ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search by donor, campaign, or ref..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-transparent border-none text-[10px] font-bold normal-case placeholder:text-stone-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-stone-50 rounded-xl animate-pulse border border-stone-100" />
              ))
            ) : filteredDonations.length === 0 ? (
              <Card className="rounded-xl border-stone-200 p-20 text-center bg-stone-50/50 shadow-none">
                <ShieldCheck className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-500 text-sm font-bold">
                  {statusFilter === 'Pending' 
                    ? 'No pending contributions found. All current transactions have been reviewed.' 
                    : `No ${statusFilter.toLowerCase()} transactions found matching your criteria.`}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDonations.map((donation) => (
                  <Card key={donation.id} className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row items-stretch">
                        
                        {/* Transaction Detail */}
                        <div className="p-6 lg:w-2/5 border-b lg:border-b-0 lg:border-r border-stone-100 flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-lg shadow-sm",
                            donation.status === 'Pending' ? "bg-amber-100 text-amber-600" :
                            donation.status === 'Verified' ? "bg-emerald-100 text-emerald-600" :
                            "bg-rose-100 text-rose-600"
                          )}>
                            {donation.status === 'Pending' ? <Clock className="w-5 h-5" /> :
                             donation.status === 'Verified' ? <CheckCircle2 className="w-5 h-5" /> :
                             <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-stone-900">{donation.fullName}</p>
                              <span className="text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                {donation.reference.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-500 font-medium line-clamp-1">{donation.campaignTitle || 'General fund'}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-stone-500">
                                <Calendar className="w-3 h-3" /> {new Date(donation.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-stone-500">
                                <CreditCard className="w-3 h-3" /> {donation.method}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Receipt */}
                        <div className="p-6 lg:w-1/4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-stone-100 bg-stone-50/30">
                          <p className="text-[10px] font-bold text-stone-400 mb-1">Transaction value</p>
                          <span className="text-2xl font-black font-meta text-stone-900 tracking-tighter">GH₵ {parseFloat(donation.amount).toLocaleString()}</span>
                          
                          <div className="mt-4">
                            {donation.receiptUrl ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedReceipt(donation.receiptUrl || null)}
                                className="h-7 px-3 text-[9px] font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 w-fit"
                              >
                                <Eye className="w-3 h-3 mr-1.5" /> View receipt
                              </Button>
                            ) : (
                              <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> No receipt attached
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Audit Actions */}
                        <div className="p-6 lg:w-1/3 flex flex-col justify-center bg-white">
                          {donation.status === 'Pending' ? (
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-stone-400">Audit action required</p>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleVerify(donation.id, donation.fullName, 'Rejected')}
                                  disabled={isVerifying === donation.id}
                                  className="flex-1 h-9 text-[10px] font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl"
                                >
                                  Flag
                                </Button>
                                <Button 
                                  onClick={() => handleVerify(donation.id, donation.fullName, 'Verified')}
                                  disabled={isVerifying === donation.id}
                                  className="flex-1 h-9 text-[10px] font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-xl"
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-stone-400 mb-1">Audit status</p>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-[10px] font-bold border",
                                  donation.status === 'Verified' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                                )}>
                                  {donation.status}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-stone-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
       {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedReceipt(null)}
                className="bg-black/50 text-white hover:bg-black rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">Transaction receipt</h3>
                <p className="text-[10px] font-bold text-stone-400 mt-1">Financial audit vault</p>
              </div>
              <ImageIcon className="w-6 h-6 text-stone-200" />
            </div>
            <div className="p-8 bg-stone-50 flex items-center justify-center min-h-[400px]">
              <img 
                src={selectedReceipt} 
                alt="Transaction Receipt" 
                className="max-h-[60vh] object-contain shadow-md rounded-xl border border-stone-200"
              />
            </div>
            <div className="p-6 flex justify-end bg-white border-t border-stone-100">
              <Button 
                onClick={() => setSelectedReceipt(null)}
                className="h-10 px-8 text-[10px] font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-xl"
              >
                Close viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
