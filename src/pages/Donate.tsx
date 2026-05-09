import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Phone, Globe, Check, ArrowDownToLine, Activity, X, ArrowRight, Download, Search } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { LiveContributionFeed } from '@/components/LiveContributionFeed'
import { Button } from '@/components/ui/neon-button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { DonationRecord, DonationDetail, DonationCampaign } from '@/types/admin'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function Donate() {
  const [submitted, setSubmitted] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [contributions, setContributions] = useState<DonationRecord[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [pastCampaigns, setPastCampaigns] = useState<DonationCampaign[]>([])
  const [countries, setCountries] = useState<{ id: string | number; name: string; dialing_code: string; is_diaspora: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({ totalMembers: 0, totalRaised: 0 })
  const [publicHistory, setPublicHistory] = useState<DonationDetail[]>([])
  const [personalHistory, setPersonalHistory] = useState<DonationDetail[]>([])
  const [spendingHistory, setSpendingHistory] = useState<{ id: string, chapter: string, type: string, amount: string, description: string, category: string, date: string }[]>([])
  const [historyTab, setHistoryTab] = useState<'contributions' | 'spending'>('contributions')
  const [contributionFilter, setContributionFilter] = useState<'all' | 'me'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleDownload = () => {
    const dataToExport = contributionFilter === 'all' ? publicHistory : personalHistory
    const filteredData = dataToExport.filter(item => 
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.amount.includes(searchQuery)
    )

    if (filteredData.length === 0) {
      toast.error('No verified data found for export.')
      return
    }

    const headers = ['Date', 'Contributor', 'Campaign', 'Amount', 'Method', 'Reference', 'Status']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.date,
        `"${item.fullName}"`,
        `"${item.campaignTitle || 'Strategic Fund'}"`,
        `"${item.amount}"`,
        item.method,
        item.reference,
        item.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `TheBase_Contributions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Strategic ledger exported successfully.')
  }

  // Auth & Pre-fill states (Initialized directly to avoid cascading renders)
  const [isLoggedIn] = useState(() => !!localStorage.getItem('userName'))
  const [formData, setFormData] = useState(() => {
    const storedName = localStorage.getItem('userName') || ''
    const storedPhone = localStorage.getItem('userPhone') || ''
    const storedMemberId = localStorage.getItem('userMemberId') || ''
    
    return {
      fullName: storedName,
      phone: storedPhone,
      amount: '',
      country: 'GH',
      membershipNumber: storedMemberId,
      showOnDashboard: !!storedName,
      campaignId: ''
    }
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setCountriesLoading(true)
      try {
        const [activeData, pastData, countriesData, publicHistoryData, statsData, ledgerData] = await Promise.all([
          adminService.getDonationCampaigns('Active'),
          adminService.getDonationCampaigns('Closed'),
          adminService.getCountries(),
          adminService.getPublicDonationFeed(20),
          adminService.getDonationStats(),
          adminService.getMobilizationLedger(20)
        ])
        setCampaigns(activeData)
        setPastCampaigns(pastData)
        setCountries(countriesData)
        setPublicHistory(publicHistoryData.map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: `GHS ${Number(d.amount).toLocaleString()}`
        })))
        setSpendingHistory(ledgerData)
        setGlobalStats({ 
          totalMembers: statsData.totalContributions, 
          totalRaised: statsData.approvedAmount 
        })

        // Fetch personal history if logged in
        const savedPhone = localStorage.getItem('userPhone')
        if (savedPhone) {
          const personalData = await adminService.getMemberDonations(savedPhone)
          setPersonalHistory(personalData.map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: `GHS ${Number(d.amount).toLocaleString()}`
          })))
        }
        
        // Auto-select first active campaign if none selected
        if (activeData.length > 0) {
          setFormData(prev => {
            if (!prev.campaignId) {
              return { ...prev, campaignId: activeData[0].id }
            }
            return prev
          })
        }

        // Update default country if Ghana exists
        const ghana = countriesData.find(c => c.name.toLowerCase() === 'ghana')
        if (ghana) {
          setFormData(prev => ({ ...prev, country: ghana.name }))
        }
      } catch (err) {
        console.error('[DONATE] Data fetch failed:', err)
        toast.error('Tactical data synchronization failed.')
      } finally {
        setLoading(false)
        setCountriesLoading(false)
      }
    }
    fetchData()

    // Real-time subscription for global feed synchronization
    const subscription: RealtimeChannel = adminService.subscribeToPublicDonations((newDonation) => {
      setPublicHistory(prev => {
        // Prevent duplicates
        if (prev.some(d => d.id === newDonation.id)) return prev;
        
        const formatted = {
          ...newDonation,
          date: new Date(newDonation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: `GHS ${Number(newDonation.amount).toLocaleString()}`
        };
        return [formatted, ...prev].slice(0, 50); // Keep last 50 for performance
      });
      
      setGlobalStats(prev => ({
        totalMembers: prev.totalMembers + 1,
        totalRaised: prev.totalRaised + Number(newDonation.amount)
      }));
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    async function fetchHistory() {
      if (!formData.phone) {
        setContributions([])
        setLoading(false)
        return
      }
      
      setLoading(true)
      const historyData = await adminService.getMemberDonations(formData.phone)
      setContributions(historyData)
      setLoading(false)
    }
    
    // Debounce history fetching to avoid excessive calls while typing
    const timer = setTimeout(fetchHistory, 500)
    return () => clearTimeout(timer)
  }, [formData.phone])

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['payment-section', 'donor-section', 'link-section', 'receipt-section']
      const scrollPos = window.scrollY + 200 // Offset for sticky bar

      sections.forEach((id, index) => {
        const element = document.getElementById(id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveStep(index + 1)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const checkScroll = () => {
      setHasScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', checkScroll)
    return () => window.removeEventListener('scroll', checkScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await adminService.submitDonation({
      ...formData,
      paymentMethod: 'MTN MoMo', // Default for now
      memberId: localStorage.getItem('userId') // If available
    })

    if (success) {
      setSubmitted(true)
      toast.success('Donation submitted for verification!')
    } else {
      toast.error('Failed to submit donation. Please check your details.')
    }
  }

  return (
    <main className="bg-background font-body-md min-h-screen pb-24">
      <SEO 
        title="Support the Movement"
        description="Your contributions for the growth and sustainability of The Base Movement. Join citizens in Ghana and across the diaspora working for a more productive future."
        canonical="/donate"
      />
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <Heart className="w-10 h-10 text-brand-red" />
              Support the Movement
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Your contributions fuel the growth and sustainability of the movement. Join citizens across Ghana and the diaspora in building a more productive and transparent future.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats / Progress */}
      <div className="bg-on-surface text-white relative overflow-hidden py-12">
        <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--brand-green)_0%,_transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--brand-green-full)]"></span>
                <span className="text-micro font-bold text-white/90 tracking-tight">Financial Mobilization Unit</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-meta font-bold tracking-tight mb-4">
                Total Mobilized: <span className="text-primary">GHS {globalStats.totalRaised.toLocaleString()}</span>
              </h2>
              <div className="max-w-md">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 mb-2">
                  <div 
                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.5)] transition-all duration-1000"
                    style={{ width: '68%' }} // This could be a global goal progress
                  />
                </div>
                <p className="text-micro font-bold text-white/40 tracking-tight">68% of quarterly tactical goal achieved</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm">
                <p className="text-micro font-bold text-white/40 tracking-tight mb-2">Active Patriots</p>
                <h3 className="text-2xl font-bold text-white mb-0">{globalStats.totalMembers.toLocaleString()}</h3>
              </div>
              <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm">
                <p className="text-micro font-bold text-white/40 tracking-tight mb-2">Regions Covered</p>
                <h3 className="text-2xl font-bold text-white mb-0">16/16</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!submitted && (
        <div className={cn(
          "sticky top-[72px] z-50 bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-border/40 py-6 shadow-sm",
          hasScrolled ? "translate-y-0" : "translate-y-0"
        )}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-center">
              <div className="flex-1 max-w-3xl relative">
                <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-stone-100 z-0"></div>
                <div className="grid grid-cols-4 gap-4 relative z-10">
                      {[
                        { step: 1, label: 'Capital Transfer', id: 'payment-section', color: 'bg-brand-red', text: 'text-destructive-foreground' },
                        { step: 2, label: 'Profile Details', id: 'donor-section', color: 'bg-brand-gold', text: 'text-accent-foreground' },
                        { step: 3, label: 'Patriot Link', id: 'link-section', color: 'bg-brand-green', text: 'text-primary-foreground' },
                        { step: 4, label: 'Verification', id: 'receipt-section', color: 'bg-brand-green', text: 'text-primary-foreground' }
                      ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center group cursor-pointer" onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center text-micro font-bold transition-all border-2",
                          activeStep === s.step 
                            ? `${s.color} border-transparent ${s.text} shadow-lg scale-110` 
                            : "bg-white border-stone-200 text-stone-400 group-hover:border-stone-400 group-hover:text-stone-600"
                        )}>
                          {s.step}
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold tracking-tight mt-3 transition-colors uppercase",
                          activeStep === s.step ? "text-stone-900" : "text-stone-400"
                        )}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {submitted ? (
          <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-none shadow-sm p-16 text-center mt-20">
            <div className="w-24 h-24 bg-brand-green/10 flex items-center justify-center mx-auto mb-8 rounded-full">
              <Check className="w-12 h-12 text-brand-green" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 font-meta tracking-tight">Deployment Authorized</h2>
            <p className="text-stone-500 mb-10 font-medium leading-relaxed max-w-md mx-auto">
              Your contribution has been recorded in the mobilization ledger and is awaiting final audit verification.
            </p>
            <Button asChild variant="primary" size="lg" className="h-14 px-12">
              <Link to="/">
                Return to Command Center
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Active Campaigns Section */}
            <section className="mt-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta">Strategic Priorities</h2>
                  <p className="text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase">Deploy capital to critical movement units.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-stone-100 animate-pulse rounded-none border border-stone-200" />
                  ))
                ) : campaigns.map(c => (
                  <Card key={c.id} className="rounded-none border-stone-200 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 overflow-hidden bg-white">
                    <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" decoding="async" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-50">
                           <Activity className="w-12 h-12 text-stone-200 group-hover:text-brand-green/30 transition-colors duration-500" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <span className="bg-brand-green text-white text-[10px] font-bold tracking-tight px-3 py-1.5 shadow-xl uppercase">Live Mobilization</span>
                      </div>
                    </div>
                    <CardContent className="p-8 flex flex-col flex-1">
                      <h3 className="font-bold text-stone-900 font-meta text-xl mb-3 group-hover:text-brand-green transition-colors tracking-tight">{c.title}</h3>
                      <p className="text-sm text-stone-500 mb-8 line-clamp-3 leading-relaxed font-medium">{c.description}</p>
                      
                      <div className="mt-auto space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-3">
                             <span className="text-micro font-bold text-stone-400 tracking-tight uppercase">Strength at {Math.round((c.raisedAmount / c.targetAmount) * 100)}%</span>
                            <span className="text-sm font-bold font-meta text-stone-900">GHS {c.raisedAmount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-stone-100 overflow-hidden rounded-full border border-stone-50">
                            <div 
                              className="h-full bg-brand-green transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" 
                              style={{ width: `${Math.min(100, (c.raisedAmount / c.targetAmount) * 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, campaignId: c.id }))
                            document.getElementById('donor-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }}
                          className="w-full h-12 rounded-none text-tiny font-bold tracking-tight border-stone-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          Direct Capital <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-20">
              
              <div id="payment-section" className="bg-stone-900 text-white p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col scroll-mt-[180px] rounded-none">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                  <Phone className="w-32 h-32 text-brand-green" />
                </div>
                
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-brand-red text-white flex items-center justify-center font-meta font-bold text-xs">01</span>
                  <h3 className="font-bold text-white font-meta tracking-tight text-xl">Capital Transfer</h3>
                </div>
                
                <div className="space-y-10 flex-1">
                  <div>
                    <p className="text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase">Account Holder</p>
                    <p className="font-bold text-brand-green text-2xl tracking-tight leading-none font-meta">Paul Kofi Agyekum</p>
                  </div>
                  <div>
                    <p className="text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase">MoMo Identifier</p>
                    <p className="font-bold font-meta tracking-tight text-white text-2xl">+233 538 873 569</p>
                  </div>
                  <div className="grid grid-cols-1 gap-8 pt-10 border-t border-white/10">
                    <div>
                      <p className="text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase">Network Hub</p>
                      <p className="text-white/90 font-bold font-meta text-base">MTN Mobile Money</p>
                    </div>
                    <div>
                      <p className="text-micro font-bold tracking-tight text-white/30 font-meta mb-2 uppercase">Deployment Reference</p>
                      <p className="text-brand-gold font-bold font-meta text-base italic border-b border-brand-gold/30 pb-1">"THE BASE"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white/5 border border-white/10 flex items-start gap-4">
                  <div className="text-brand-green mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed font-bold tracking-tight">
                    Complete transfer protocol first, then capture receipt for verification.
                  </p>
                </div>
              </div>

              {/* Column 2: Donation Form */}
              <div id="donor-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-brand-gold text-[#92400e] flex items-center justify-center font-meta font-bold text-xs">02</span>
                  <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">Contributor Profile</h3>
                </div>

                <form onSubmit={handleSubmit} id="donationForm" className="space-y-8 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                      Identification <span className="text-brand-red">*</span>
                    </label>
                    <input 
                      id="fullName" 
                      placeholder="Legal full name" 
                      required 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-200" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                      Contact Line <span className="text-brand-red">*</span>
                    </label>
                    <input 
                      id="phone" 
                      placeholder="+233 XX XXX XXXX" 
                      required 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-200" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                        Amount (GHS) <span className="text-brand-red">*</span>
                      </label>
                      <input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        required 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        onFocus={() => setActiveStep(2)} 
                        className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold font-meta placeholder:text-stone-200" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                        Jurisdiction <span className="text-brand-red">*</span>
                      </label>
                      <select 
                        id="country" 
                        required 
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        onFocus={() => setActiveStep(2)} 
                        disabled={countriesLoading}
                        className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold appearance-none disabled:opacity-50"
                      >
                        {countriesLoading ? (
                          <option>Synchronizing...</option>
                        ) : countries.length > 0 ? (
                          countries.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        ) : (
                          <option value="Ghana">Ghana</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="campaign" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                      Target Cell <span className="text-brand-red">*</span>
                    </label>
                    <select 
                      id="campaign" 
                      required 
                      value={formData.campaignId}
                      onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-bold appearance-none"
                    >
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>

              {/* Column 3: Link Membership */}
              <div id="link-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-stone-900 text-white flex items-center justify-center font-meta font-bold text-xs">03</span>
                  <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">
                    {isLoggedIn ? 'Patriot Profile' : 'Link Patriot'}
                  </h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="bg-stone-50 border border-stone-100 p-8 rounded-none space-y-8">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-brand-green" />
                        <h4 className="font-bold text-stone-900 font-meta tracking-tight text-sm uppercase">
                          {isLoggedIn ? 'Active Session' : 'Movement ID'}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 font-medium leading-relaxed tracking-tight">
                        {isLoggedIn 
                          ? 'Automatic recognition active. This deployment will be linked to your patriot profile.'
                          : 'Enter your movement identification number to synchronize this capital with your profile.'
                        }
                      </p>
                      <div className="space-y-2">
                        <label htmlFor="membershipNumber" className="text-micro font-bold text-stone-400 font-meta tracking-tight uppercase">
                          Movement ID
                        </label>
                        <input 
                          id="membershipNumber" 
                          placeholder="GH-2028-XXXXXX" 
                          value={formData.membershipNumber}
                          onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                          onFocus={() => setActiveStep(3)}
                          className="w-full bg-white px-4 h-12 text-stone-900 text-sm border border-stone-200 focus:border-stone-900 outline-none transition-all font-bold shadow-sm" 
                        />
                      </div>
                      <label className="flex items-center gap-4 cursor-pointer group pt-2">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData.showOnDashboard}
                            onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
                            onFocus={() => setActiveStep(3)}
                            className="peer h-5 w-5 cursor-pointer appearance-none border border-stone-300 rounded-none checked:bg-brand-green checked:border-brand-green transition-all" 
                          />
                          <Check className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-xs text-stone-600 font-bold tracking-tight group-hover:text-stone-900 transition-colors">Publish to personal dossier</span>
                      </label>
                    </div>
                </div>
              </div>

              {/* Column 4: Upload Receipt */}
              <div id="receipt-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-brand-green text-white flex items-center justify-center font-meta font-bold text-xs">04</span>
                  <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">Audit Trail</h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="border-2 border-dashed border-stone-200 bg-stone-50 p-12 text-center hover:bg-stone-100 hover:border-stone-400 transition-all group cursor-pointer relative flex-1 flex flex-col justify-center">
                      <input 
                        type="file" 
                        form="donationForm" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        onFocus={() => setActiveStep(4)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        id="receipt" 
                        required 
                      />
                      <div className="w-16 h-16 bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                        <ArrowDownToLine className="w-6 h-6 text-stone-300 group-hover:text-brand-green transition-colors" />
                      </div>
                      <p className="text-tiny text-stone-900 font-bold tracking-tight mb-1 uppercase font-meta">Synchronize Receipt</p>
                      <p className="text-micro text-stone-400 font-bold tracking-tight uppercase">JPG, PNG, or PDF</p>
                    </div>

                    <div className="bg-stone-50 p-6 border border-stone-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="w-5 h-5 text-brand-green" />
                        <h4 className="font-bold text-stone-900 font-meta tracking-tight text-micro uppercase">Global Diaspora Hub</h4>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed font-medium tracking-tight">
                        Use deployment code <span className="text-brand-green font-bold">THEBASEM</span> on TapTap for resource scaling bonus.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      form="donationForm"
                      variant="primary"
                      className="w-full py-10 flex items-center justify-center gap-3 rounded-none shadow-xl shadow-brand-green/10 text-base"
                    >
                      <Heart className="w-5 h-5" />
                      Authorize Contribution
                    </Button>
                </div>
              </div>

            </div>

            {/* Movement Victories Section */}
            {pastCampaigns.length > 0 && (
              <section className="mt-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4">
                      <Check className="w-8 h-8 text-brand-green" />
                      Strategic Victories
                    </h2>
                    <p className="text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase">Historical proof of patriot mobilization success.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {pastCampaigns.map(c => (
                    <Card key={c.id} className="bg-white border border-stone-200 p-6 flex flex-col relative grayscale hover:grayscale-0 transition-all duration-700 opacity-75 hover:opacity-100 rounded-none">
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-stone-900 text-white text-[9px] font-bold tracking-tight px-3 py-1 shadow-xl flex items-center gap-1 uppercase">
                          <Check className="w-3 h-3 text-brand-green" /> 100% Secured
                        </span>
                      </div>
                      <div className="aspect-square bg-stone-50 mb-6 overflow-hidden rounded-none border border-stone-100">
                        {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover"  decoding="async" loading="lazy" />}
                      </div>
                      <h4 className="font-bold text-stone-900 font-meta text-sm mb-2 tracking-tight uppercase">{c.title}</h4>
                      <p className="text-xs font-medium text-stone-500 mb-8 line-clamp-2 leading-relaxed">{c.description}</p>
                      <div className="mt-auto pt-6 border-t border-stone-100 flex justify-between items-center">
                        <div>
                          <p className="text-micro font-bold text-stone-400 tracking-tight uppercase">Total Impact</p>
                          <p className="text-sm font-bold text-brand-green font-meta">GHS {c.raisedAmount.toLocaleString()}</p>
                        </div>
                        <span className="text-[9px] font-bold text-stone-300 tracking-tight italic uppercase">Decommissioned</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Contribution History Section */}
            <section className="mt-32">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4">
                    <Activity className="w-8 h-8 text-brand-green" />
                    Capital Deployment History
                  </h2>
                  <p className="text-sm font-bold text-stone-400 tracking-tight mt-2 uppercase">Live immutable record of member mobilization.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-8 py-4 bg-white border border-stone-200 text-center rounded-none shadow-sm min-w-[160px]">
                    <p className="text-micro font-bold text-stone-400 tracking-tight uppercase mb-1">Movement Reserves</p>
                    <p className="text-xl font-bold text-stone-900 tracking-tight font-meta">GHS {globalStats.totalRaised.toLocaleString()}</p>
                  </div>
                  <div className="px-8 py-4 bg-brand-green/10 border border-brand-green/20 text-center rounded-none shadow-sm min-w-[160px]">
                    <p className="text-micro font-bold text-brand-green tracking-tight uppercase mb-1">Active Patriots</p>
                    <p className="text-xl font-bold text-brand-green tracking-tight font-meta">{globalStats.totalMembers}</p>
                  </div>
                </div>
              </div>

              {/* Advanced Controls & Filters */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-3 bg-stone-50 border border-stone-200 mb-8">
                <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 shadow-inner">
                  <Button 
                    variant={historyTab === 'contributions' ? 'primary' : 'ghost'}
                    onClick={() => setHistoryTab('contributions')}
                    className={cn(
                      "px-10 h-12 text-tiny font-bold tracking-tight rounded-none transition-all",
                      historyTab === 'contributions' ? "" : "text-stone-500 hover:text-stone-900"
                    )}
                  >
                    Mobilization History
                  </Button>
                  <Button 
                    variant={historyTab === 'spending' ? 'primary' : 'ghost'}
                    onClick={() => setHistoryTab('spending')}
                    className={cn(
                      "px-10 h-12 text-tiny font-bold tracking-tight rounded-none transition-all",
                      historyTab === 'spending' ? "" : "text-stone-500 hover:text-stone-900"
                    )}
                  >
                    Spending & Allocation
                  </Button>
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
                        <Button 
                          variant={contributionFilter === 'all' ? 'primary' : 'outline'}
                          onClick={() => setContributionFilter('all')}
                          className="px-6 h-12 text-[10px] font-bold tracking-tight rounded-none transition-all uppercase"
                        >
                          All Records
                        </Button>
                        <Button 
                          variant={contributionFilter === 'me' ? 'primary' : 'outline'}
                          onClick={() => setContributionFilter('me')}
                          className="px-6 h-12 text-[10px] font-bold tracking-tight rounded-none transition-all uppercase"
                        >
                          My Records
                        </Button>
                      </div>
                    )}
                  </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1">
                  <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white h-full">
                    <div className="p-8">
                      <LiveContributionFeed />
                    </div>
                  </Card>
                </div>
                
                <div className="lg:col-span-3">
                  <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white h-full">
                    <div className="flex items-center justify-between p-8 border-b border-stone-100">
                      <h3 className="font-bold text-stone-900 font-meta tracking-tight text-lg">Tactical Deployment Ledger</h3>
                      <Button variant="ghost" size="sm" onClick={handleDownload} className="text-tiny font-bold uppercase tracking-tight text-stone-500 hover:text-stone-900">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                      </Button>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200">
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Deployment details</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Capital</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Channel</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Verification</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase text-right">Audit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="p-16 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase">
                                Synchronizing tactical ledger...
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
                                    <p className="text-micro font-bold text-brand-green tracking-tight uppercase">{item.campaignTitle || 'Strategic Strategic Fund'}</p>
                                    <p className="text-[10px] text-stone-400 font-medium mt-1 uppercase">{item.date}</p>
                                  </div>
                                </td>
                                <td className="p-6">
                                  <span className="text-sm font-bold text-stone-900 font-meta">{item.amount}</span>
                                </td>
                                <td className="p-6">
                                  <span className="text-xs font-bold text-stone-500 uppercase">{item.method}</span>
                                </td>
                                <td className="p-6">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full",
                                      item.status === 'Verified' ? "bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]" : "bg-brand-gold shadow-[0_0_8px_var(--brand-gold-full)]"
                                    )} />
                                    <span className="text-tiny font-bold text-stone-700 uppercase">{item.status}</span>
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
                                    No records found matching search.
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
                                      <p className="text-micro font-bold text-brand-red tracking-tight uppercase">{item.chapter} Hub • {item.category}</p>
                                      <p className="text-[10px] text-stone-400 font-medium mt-1 uppercase">{item.date}</p>
                                    </div>
                                  </td>
                                  <td className="p-6">
                                    <span className="text-sm font-bold text-stone-900 font-meta">{item.amount}</span>
                                  </td>
                                  <td className="p-6">
                                    <span className={cn(
                                      "text-micro font-bold px-2 py-1 rounded-sm uppercase",
                                      item.type === 'Expenditure' ? "bg-brand-red/10 text-brand-red" : "bg-brand-green/10 text-brand-green"
                                    )}>
                                      {item.type}
                                    </span>
                                  </td>
                                  <td className="p-6">
                                    <div className="flex items-center gap-2">
                                      <Check className="w-4 h-4 text-brand-green" />
                                      <span className="text-tiny font-bold text-stone-700 uppercase">Audited</span>
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
                                  No allocation records found.
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
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
                                  <p className="text-sm font-bold text-stone-900 tracking-tight normal-case">{item.fullName}</p>
                                  <p className="text-micro text-stone-400 font-bold tracking-tight mt-1">{item.date}</p>
                                </div>
                                <span className="px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green">
                                  Verified
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">Capital deployment</p>
                                  <p className="text-xl font-bold text-stone-900 font-meta">{item.amount}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-micro font-bold text-stone-400 tracking-tight mb-1">Channel</p>
                                  <p className="text-micro font-bold text-stone-900 tracking-tight">{item.method}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center text-stone-400 text-tiny font-bold tracking-tight italic uppercase">
                            No records matching search.
                          </div>
                        )
                      })()}
                    </div>

                    <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                      <p className="text-micro font-bold text-stone-400 tracking-tight">Live mobilization ledger</p>
                      <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="text-micro font-bold text-brand-green tracking-tight hover:text-stone-900 transition-all border-b border-brand-green/30 pb-1"
                      >
                        Full operational audit
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            </section>

            {/* History Modal */}
            {isHistoryModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)}></div>
                <div className="relative w-full max-w-4xl bg-white border border-stone-200 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-[85vh]">
                  <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <Activity className="w-6 h-6 text-brand-green shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" />
                      <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl leading-none">Capital Deployment Ledger</h3>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="text-stone-300 hover:text-brand-red hover:bg-brand-red/5 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-0">
                    {publicHistory.length > 0 ? (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200">
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Contributor</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Capital</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase">Cell</th>
                            <th className="p-6 text-micro font-bold text-stone-400 tracking-tight uppercase text-right">Verification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {publicHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-stone-50 transition-colors group">
                              <td className="p-6">
                                <p className="text-sm font-bold text-stone-900 tracking-tight">{item.fullName}</p>
                                <p className="text-micro text-stone-400 font-bold tracking-tight mt-1 uppercase">{item.date}</p>
                              </td>
                              <td className="p-6">
                                <p className="text-sm font-bold text-stone-900 font-meta">{item.amount}</p>
                              </td>
                              <td className="p-6">
                                <p className="text-micro font-bold text-stone-500 tracking-tight uppercase">{item.campaignTitle || 'Strategic Fund'}</p>
                              </td>
                              <td className="p-6 text-right">
                                <span className="inline-flex items-center gap-2 px-3 py-1 text-micro font-bold tracking-tight rounded-none bg-brand-green/10 text-brand-green">
                                  Verified
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-32 px-8 text-center bg-stone-50/50">
                        <div className="w-20 h-20 bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-8 rounded-none">
                          <Activity className="w-8 h-8 text-stone-200" />
                        </div>
                        <h4 className="text-xl font-bold text-stone-900 mb-3 font-meta tracking-tight uppercase">Deployment records inactive</h4>
                        <p className="text-tiny text-stone-400 max-w-sm mx-auto mb-8 font-bold tracking-tight leading-relaxed uppercase">
                          No capital deployment detected for this session. Support the movement cells to build a technically robust Ghana.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 border-t border-stone-100 flex items-center justify-between bg-stone-50 sticky bottom-0 z-10">
                    <div className="flex items-center gap-3 text-micro font-bold text-stone-400 tracking-tight uppercase">
                      <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]"></span>
                      {contributions.length} deployment records secured
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => setIsHistoryModalOpen(false)}
                        className="px-6 h-12 border-stone-200 text-stone-400 font-bold text-micro tracking-tight rounded-none hover:bg-white transition-all flex items-center gap-2 uppercase"
                      >
                        <ArrowDownToLine className="w-4 h-4" /> Download Audit
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsHistoryModalOpen(false)
                          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                        className="px-8 h-12 bg-stone-900 text-white font-bold text-micro tracking-tight rounded-none hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/10 uppercase"
                      >
                        <Heart className="w-4 h-4 text-brand-green" /> Contribute
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
