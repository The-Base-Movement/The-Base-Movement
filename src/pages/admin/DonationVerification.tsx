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
import { BrandLine } from '@/components/ui/BrandLine'
import { 
  Card, 
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <DollarSign className="w-8 h-8 text-on-surface" />
            Financial audit
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Reviewing contributions, transactions, and campaign funding.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-sm text-[10px] font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            onClick={handleExport}
            disabled={filteredDonations.length === 0}
          >
            <Download className="w-4 h-4 mr-2" /> Export Ledger
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-sm text-[10px] font-bold tracking-tight px-10 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            onClick={() => fetchData()} 
          >
            <Loader2 className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Synchronize Data
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight">Total Contributions</p>
            <h3 className="text-xl md:text-2xl font-bold text-on-surface">{stats.totalContributions.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-muted-foreground/60 mt-1">All-time recorded volume</span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight">Pending Review</p>
            <h3 className="text-xl md:text-2xl font-bold text-accent">{stats.pendingCount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-accent/70 mt-1">Awaiting administrative clearance</span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight">Approved Amount</p>
            <h3 className="text-2xl font-bold text-primary">GH₵ {stats.approvedAmount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-primary/70 mt-1">Total cleared funds</span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight">Flagged Transactions</p>
            <h3 className="text-2xl font-bold text-destructive">{stats.flaggedCount.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-destructive/70 mt-1">Rejected or disputed records</span>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full flex-1 space-y-6">
          {/* Intelligence & Filtering */}
          <div className="bg-white border border-border/60 p-2 rounded-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {['Pending', 'Verified', 'Rejected', 'All'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "primary" : "ghost"}
                  onClick={() => setStatusFilter(status as 'All' | 'Pending' | 'Verified' | 'Rejected')}
                  className={cn(
                    "h-11 px-8 text-[10px] font-bold tracking-tight rounded-sm transition-all active:scale-95",
                    statusFilter === status 
                      ? "shadow-lg shadow-brand-green/20" 
                      : "text-muted-foreground/60 hover:text-on-surface hover:bg-stone-50 border border-transparent hover:border-stone-100"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input 
                type="text" 
                placeholder="Search by donor, campaign, or ref..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-transparent border-none text-[10px] font-bold normal-case placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted/5 rounded-sm animate-pulse border border-border/40" />
              ))
            ) : filteredDonations.length === 0 ? (
              <Card className="rounded-sm border-border/60 p-20 text-center bg-muted/30 shadow-none">
                <ShieldCheck className="w-12 h-12 text-border/60 mx-auto mb-4" />
                <p className="text-muted-foreground/80 text-sm font-bold">
                  {statusFilter === 'Pending' 
                    ? 'No pending contributions found. All current transactions have been reviewed.' 
                    : `No ${statusFilter.toLowerCase()} transactions found matching your criteria.`}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDonations.map((donation) => (
                  <Card key={donation.id} className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row items-stretch">
                        
                        {/* Transaction Detail */}
                        <div className="p-6 lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border/40 flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 shrink-0 flex items-center justify-center rounded-lg shadow-sm",
                            donation.status === 'Pending' ? "bg-accent/10 text-accent" :
                            donation.status === 'Verified' ? "bg-primary/10 text-primary" :
                            "bg-destructive/10 text-destructive"
                          )}>
                            {donation.status === 'Pending' ? <Clock className="w-5 h-5" /> :
                             donation.status === 'Verified' ? <CheckCircle2 className="w-5 h-5" /> :
                             <XCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-on-surface">{donation.fullName}</p>
                              <span className="text-[9px] font-bold text-muted-foreground/60 bg-border/40 px-2 py-0.5 rounded-full">
                                {donation.reference.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 font-medium line-clamp-1">{donation.campaignTitle || 'General fund'}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/80">
                                <Calendar className="w-3 h-3" /> {new Date(donation.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/80">
                                <CreditCard className="w-3 h-3" /> {donation.method}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Receipt */}
                        <div className="p-6 lg:w-1/4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border/40 bg-muted/5">
                          <p className="text-[10px] font-bold text-muted-foreground/60 mb-1">Transaction value</p>
                          <span className="text-2xl font-bold font-meta text-on-surface tracking-tighter">GH₵ {parseFloat(donation.amount).toLocaleString()}</span>
                          
                          <div className="mt-4">
                            {donation.receiptUrl ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedReceipt(donation.receiptUrl || null)}
                                className="h-11 px-8 text-[10px] font-bold tracking-tight text-on-surface/80 hover:text-accent hover:bg-stone-50 rounded-sm border-border/40 transition-all shadow-sm w-fit active:scale-95"
                              >
                                <Eye className="w-4 h-4 mr-2" /> Inspect Evidence
                              </Button>
                            ) : (
                              <span className="text-[9px] font-bold text-muted-foreground/60 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> No receipt attached
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Audit Actions */}
                        <div className="p-6 lg:w-1/3 flex flex-col justify-center bg-white">
                          {donation.status === 'Pending' ? (
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-muted-foreground/60">Audit action required</p>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleVerify(donation.id, donation.fullName, 'Rejected')}
                                  disabled={isVerifying === donation.id}
                                  className="flex-1 h-12 text-[10px] font-bold tracking-tight text-brand-red border-brand-red/20 hover:bg-brand-red/10 transition-all shadow-sm rounded-sm active:scale-95"
                                >
                                  Flag for Audit
                                </Button>
                                <Button 
                                  variant="primary"
                                  onClick={() => handleVerify(donation.id, donation.fullName, 'Verified')}
                                  disabled={isVerifying === donation.id}
                                  className="flex-1 h-12 text-[10px] font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                  Approve Record
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground/60 mb-1">Audit status</p>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-[10px] font-bold border",
                                  donation.status === 'Verified' ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                )}>
                                  {donation.status}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-border/60" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white relative overflow-hidden rounded-sm shadow-2xl">
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
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Transaction receipt</h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">Financial audit vault</p>
              </div>
              <ImageIcon className="w-6 h-6 text-border/60" />
            </div>
            <div className="p-8 bg-muted/5 flex items-center justify-center min-h-[400px]">
              <img src={selectedReceipt} 
                alt="Transaction Receipt" 
                className="max-h-[60vh] object-contain shadow-md rounded-sm border border-border/60"
               decoding="async" loading="lazy" />
            </div>
            <div className="p-6 flex justify-end bg-white border-t border-border/40">
              <Button 
                variant="primary"
                onClick={() => setSelectedReceipt(null)}
                className="h-14 px-12 text-[10px] font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
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
