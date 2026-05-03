import { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  Search, 
  Filter, 
  XCircle, 
  Eye,
  Calendar,
  CreditCard,
  ShieldCheck,
  Loader2,
  Image as ImageIcon
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

export default function DonationVerification() {
  const [donations, setDonations] = useState<DonationDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDonations = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    const data = await adminService.getPendingDonations()
    setDonations(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchDonations(true) // Silent fetch on mount because isLoading is true by default
  }, [fetchDonations])

  const handleVerify = async (donationId: string, name: string, status: 'Verified' | 'Rejected') => {
    setIsVerifying(donationId)
    const success = await adminService.verifyDonation(donationId, status, `Verified by Admin via Command Center`)
    
    if (success) {
      toast({
        title: status === 'Verified' ? "CONTRIBUTION VERIFIED" : "CONTRIBUTION REJECTED",
        description: `The donation from ${name} has been processed.`,
        variant: status === 'Verified' ? "default" : "destructive"
      })
      fetchDonations()
    } else {
      toast({
        title: "VERIFICATION FAILED",
        description: "An error occurred while updating the record.",
        variant: "destructive"
      })
    }
    setIsVerifying(null)
  }

  const filteredDonations = donations.filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.campaignTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">Financial Audit</h1>
          <p className="text-stone-500 text-sm mt-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Verifying movement contributions and funding initiatives.
          </p>
        </div>
      </div>

      {/* Intelligence & Filtering */}
      <div className="bg-white border border-stone-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search by donor or campaign..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-tight placeholder:text-stone-400 focus:ring-1 focus:ring-[var(--brand-gold)] transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest border-stone-200">
            <Filter className="w-3.5 h-3.5 mr-2" /> All Campaigns
          </Button>
          <Button variant="ghost" onClick={fetchDonations} className="h-10 w-10 p-0 hover:bg-stone-50 border border-stone-100">
            <Loader2 className={cn("w-4 h-4 text-stone-400", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Donations Queue */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-100 animate-pulse border border-stone-200" />
          ))
        ) : filteredDonations.length === 0 ? (
          <Card className="rounded-none border-stone-200 p-20 text-center bg-white">
            <DollarSign className="w-12 h-12 text-stone-100 mx-auto mb-4" />
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">No pending contributions found</p>
          </Card>
        ) : filteredDonations.map((donation) => (
          <Card key={donation.id} className="rounded-none border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Donor Info */}
                <div className="p-6 lg:w-1/4 border-b lg:border-b-0 lg:border-r border-stone-100 bg-stone-50/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[var(--brand-black)] text-white flex items-center justify-center text-[10px] font-black uppercase">
                      {donation.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-stone-900 uppercase tracking-tight">{donation.fullName}</p>
                      <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{donation.country}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-stone-600">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(donation.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-600">
                      <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                      {donation.method}
                    </div>
                  </div>
                </div>

                {/* Campaign & Amount */}
                <div className="p-6 lg:w-2/4 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-stone-100">
                  <div className="mb-4">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Target Initiative</p>
                    <p className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[var(--brand-red)]" />
                      {donation.campaignTitle || 'General Fund'}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-meta text-[var(--brand-black)] tracking-tighter">GH₵ {parseFloat(donation.amount).toLocaleString()}</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pending Verification</span>
                  </div>
                </div>

                {/* Actions & Receipt */}
                <div className="p-6 lg:w-1/4 flex flex-col justify-between bg-stone-50/10">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Verification Status</p>
                    {donation.receiptUrl ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedReceipt(donation.receiptUrl || null)}
                        className="h-7 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-none border border-emerald-100"
                      >
                        <Eye className="w-3 h-3 mr-1" /> View Receipt
                      </Button>
                    ) : (
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> No Receipt
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleVerify(donation.id, donation.fullName, 'Rejected')}
                      disabled={isVerifying === donation.id}
                      className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest border-stone-200 text-stone-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-none transition-all"
                    >
                      {isVerifying === donation.id ? '...' : 'Reject'}
                    </Button>
                    <Button 
                      onClick={() => handleVerify(donation.id, donation.fullName, 'Verified')}
                      disabled={isVerifying === donation.id}
                      className="flex-1 h-10 text-[9px] font-black uppercase tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800 rounded-none transition-all"
                    >
                      {isVerifying === donation.id ? 'Processing...' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--brand-black)]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedReceipt(null)}
                className="bg-black/50 text-white hover:bg-black rounded-none"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black font-meta uppercase tracking-tight">Financial Instrument Analysis</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Movement Verification Vault</p>
              </div>
              <ImageIcon className="w-8 h-8 text-stone-100" />
            </div>
            <div className="p-8 bg-stone-50 flex items-center justify-center min-h-[400px]">
              <img 
                src={selectedReceipt} 
                alt="Donation Receipt" 
                className="max-h-[60vh] object-contain shadow-2xl border-4 border-white"
              />
            </div>
            <div className="p-8 flex justify-end">
              <Button 
                onClick={() => setSelectedReceipt(null)}
                className="h-12 px-8 text-[10px] font-black uppercase tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800 rounded-none"
              >
                Close Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
