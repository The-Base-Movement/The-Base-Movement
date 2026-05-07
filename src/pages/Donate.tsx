import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Phone, Globe, Check, ArrowDownToLine, Activity, X } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Button } from '@/components/ui/neon-button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { DonationRecord, DonationCampaign } from '@/types/admin'
import { toast } from 'sonner'

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
        const [activeData, pastData, countriesData] = await Promise.all([
          adminService.getDonationCampaigns('Active'),
          adminService.getDonationCampaigns('Closed'),
          adminService.getCountries()
        ])
        setCampaigns(activeData)
        setPastCampaigns(pastData)
        setCountries(countriesData)
        
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
      {/* Header */}
      <div className="bg-on-surface text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--brand-green)_0%,_transparent_70%)]"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--brand-green-full)]"></span>
            <span className="text-[10px] font-bold text-white/60 tracking-tight">Financial Mobilization Unit</span>
          </div>
          <h1 className="mb-4 tracking-tight font-meta">
            Support the <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.3)]">Movement</span>
          </h1>
          <BrandLine className="mx-auto" />
          <p className="text-slate-300 max-w-2xl mx-auto mb-0">
            Your contributions for the growth and sustainability of the movement.
          </p>
        </div>
      </div>

      {!submitted && (
        <div className={cn(
          "sticky top-[72px] z-50 bg-white/95 backdrop-blur-md transition-all duration-300 border-b border-border/40 py-4 shadow-sm",
          hasScrolled ? "translate-y-0" : "translate-y-0"
        )}>
          <div className="max-w-[1280px] mx-auto px-8">
            <div className="flex items-center justify-center">
              <div className="flex-1 max-w-2xl relative">
                <div className="absolute top-[14px] left-0 right-0 h-[1px] bg-border/40 z-0"></div>
                <div className="grid grid-cols-4 gap-2 relative z-10">
                    {[
                      { step: 1, label: 'Details', id: 'payment-section', color: 'bg-destructive', text: 'text-white' },
                      { step: 2, label: 'Donor', id: 'donor-section', color: 'bg-accent', text: 'text-white' },
                      { step: 3, label: 'Link', id: 'link-section', color: 'bg-on-surface', text: 'text-white' },
                      { step: 4, label: 'Proof', id: 'receipt-section', color: 'bg-primary', text: 'text-white' }
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center group cursor-pointer" onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                        <div className={cn(
                          "w-7 h-7 flex items-center justify-center text-[10px] font-bold transition-all border",
                          activeStep === s.step 
                            ? `${s.color} border-transparent ${s.text} shadow-lg shadow-black/10 scale-110` 
                            : "bg-white border-border/60 text-muted-foreground/40 group-hover:border-on-surface group-hover:text-on-surface"
                        )}>
                          {s.step}
                        </div>
                        <span className={cn(
                          "text-[8px] font-bold tracking-tight mt-2 transition-colors",
                          activeStep === s.step ? "text-on-surface" : "text-muted-foreground/40"
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

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {submitted ? (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-none shadow-sm p-12 text-center mt-12">
            <div className="w-20 h-20 bg-surface-warm flex items-center justify-center mx-auto mb-6 rounded-none">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal-dark mb-3 font-meta tracking-tight">Thank You!</h2>
            <p className="text-slate-600 mb-8 font-body-md leading-relaxed">
              Your donation has been recorded and will be verified shortly. Your support is what makes this movement possible.
            </p>
            <Button asChild variant="primary" size="lg">
              <Link to="/">
                Back to Home
              </Link>
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Active Campaigns Section */}
            <section className="mt-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight font-meta">Strategic Priorities</h2>
                  <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight mt-2">Deploy your capital to critical movement cells.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[400px] bg-muted/30 animate-pulse rounded-sm border border-border/40" />
                  ))
                ) : campaigns.map(c => (
                  <Card key={c.id} className="rounded-sm border-border/60 shadow-sm flex flex-col group hover:shadow-md transition-all duration-500 overflow-hidden bg-white">
                    <div className="aspect-[16/10] bg-muted/50 overflow-hidden relative">
                      {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"  decoding="async" loading="lazy" />}
                      <div className="absolute top-4 right-4">
                        <span className="bg-primary text-white text-[9px] font-bold tracking-tight px-3 py-1 shadow-xl">In mobilization</span>
                      </div>
                    </div>
                    <CardContent className="p-8 flex flex-col flex-1">
                      <h3 className="font-bold text-on-surface font-meta text-base mb-3 group-hover:text-primary transition-colors tracking-tight">{c.title}</h3>
                      <p className="text-[11px] font-bold text-muted-foreground/60 mb-8 line-clamp-2 leading-relaxed normal-case">{c.description}</p>
                      
                      <div className="mt-auto space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[9px] font-bold text-muted-foreground/40 tracking-tight">Strength at {Math.round((c.raisedAmount / c.targetAmount) * 100)}%</span>
                            <span className="text-xs font-bold font-meta text-on-surface">GHS {c.raisedAmount.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/10 overflow-hidden rounded-full border border-border/5">
                            <div 
                              className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" 
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
                          className="w-full h-12 rounded-sm text-[10px] font-bold tracking-tight border-border/60 hover:bg-on-surface hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          Direct Capital <ArrowDownToLine className="w-4 h-4 ml-2 rotate-[-90deg]" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-12">
              
              <div id="payment-section" className="bg-on-surface text-white p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col scroll-mt-[180px] rounded-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                  <Phone className="w-32 h-32 text-primary" />
                </div>
                
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-7 h-7 bg-destructive text-white flex items-center justify-center font-meta font-bold text-[10px]">01</span>
                  <h3 className="font-bold text-white font-meta tracking-tight text-lg">Capital Transfer</h3>
                </div>
                
                <div className="space-y-8 flex-1">
                  <div>
                    <p className="text-[10px] font-bold tracking-tight text-white/40 font-meta mb-2">Account Holder</p>
                    <p className="font-bold text-primary text-xl tracking-tight leading-none">Paul Kofi Agyekum</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-tight text-white/40 font-meta mb-2">MoMo Identifier</p>
                    <p className="font-bold font-meta tracking-tight text-white text-xl">+233 538 873 569</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/10">
                    <div>
                      <p className="text-[10px] font-bold tracking-tight text-white/40 font-meta mb-2">Network Hub</p>
                      <p className="text-white/60 font-bold font-meta text-[11px]">MTN Mobile Money</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-tight text-white/40 font-meta mb-2">Deployment Reference</p>
                      <p className="text-accent font-bold font-meta text-[11px] italic border-b border-accent/30 pb-1">"THE BASE"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-5 bg-white/5 border border-white/10 flex items-start gap-4 rounded-sm">
                  <div className="text-primary mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-bold tracking-tight">
                    Complete transfer protocol first, then capture receipt for verification.
                  </p>
                </div>
              </div>

              {/* Column 2: Donation Form */}
              <div id="donor-section" className="bg-white border border-border/60 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px] rounded-sm">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-7 h-7 bg-accent text-white flex items-center justify-center font-meta font-bold text-[10px]">02</span>
                  <h3 className="font-bold text-on-surface font-meta tracking-tight text-lg">Contributor profile</h3>
                </div>

                <form onSubmit={handleSubmit} id="donationForm" className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-[10px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                      Identification <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="fullName" 
                      placeholder="Legal full name" 
                      required 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-4 text-on-surface text-sm bg-muted/20 border-b border-border/60 focus:border-on-surface outline-none transition-all font-bold" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-[10px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                      Contact line <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="phone" 
                      placeholder="+233 XX XXX XXXX" 
                      required 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-4 text-on-surface text-sm bg-muted/20 border-b border-border/60 focus:border-on-surface outline-none transition-all font-bold" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-[10px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                        Amount (GHS) <span className="text-destructive">*</span>
                      </label>
                      <input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        required 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        onFocus={() => setActiveStep(2)} 
                        className="w-full h-12 px-4 text-on-surface text-sm bg-muted/20 border-b border-border/60 focus:border-on-surface outline-none transition-all font-bold font-meta" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-[10px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                        Jurisdiction <span className="text-destructive">*</span>
                      </label>
                      <select 
                        id="country" 
                        required 
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        onFocus={() => setActiveStep(2)} 
                        disabled={countriesLoading}
                        className="w-full h-12 px-4 text-on-surface text-sm bg-muted/20 border-b border-border/60 focus:border-on-surface outline-none transition-all font-bold appearance-none disabled:opacity-50"
                      >
                        {countriesLoading ? (
                          <option>Synchronizing...</option>
                        ) : countries.length > 0 ? (
                          countries.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="GH">Ghana</option>
                            <option value="NG">Nigeria</option>
                            <option value="UK">United Kingdom</option>
                            <option value="US">United States</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="campaign" className="text-[10px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                      Target cell <span className="text-destructive">*</span>
                    </label>
                    <select 
                      id="campaign" 
                      required 
                      value={formData.campaignId}
                      onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full h-12 px-4 text-on-surface text-sm bg-muted/20 border-b border-border/60 focus:border-on-surface outline-none transition-all font-bold appearance-none"
                    >
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-muted/10 border border-border/40 p-6 rounded-sm space-y-4">
                    <p className="text-[9px] font-bold font-meta tracking-tight text-muted-foreground/40">Patriot tracking</p>
                    <input id="membership" placeholder="ID Number (Optional)" className="w-full bg-white border border-border/40 p-4 text-sm font-bold placeholder-muted-foreground/20 focus:outline-none focus:border-on-surface transition-all rounded-sm" />
                  </div>
                </form>
              </div>

              {/* Column 3: Link Membership */}
              <div id="link-section" className="bg-white border border-border/60 shadow-sm p-8 md:p-10 flex flex-col rounded-sm scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-7 h-7 bg-on-surface text-white flex items-center justify-center font-meta font-bold text-[10px]">03</span>
                  <h3 className="font-bold text-on-surface font-meta tracking-tight text-lg">
                    {isLoggedIn ? 'Patriot profile' : 'Link patriot'}
                  </h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="bg-muted/10 border border-border/40 p-6 rounded-sm space-y-6">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-on-surface font-meta tracking-tight text-[11px]">
                          {isLoggedIn ? 'Active session' : 'Movement ID'} <span className="text-muted-foreground/40 font-bold tracking-normal">(optional)</span>
                        </h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 font-bold leading-relaxed tracking-tight">
                        {isLoggedIn 
                          ? 'Automatic recognition active. This deployment will be linked to your patriot profile.'
                          : 'Enter your movement identification number to synchronize this capital with your profile.'
                        }
                      </p>
                      <div className="space-y-2">
                        <label htmlFor="membershipNumber" className="text-[9px] font-bold text-muted-foreground/40 font-meta tracking-tight">
                          Movement ID
                        </label>
                        <input 
                          id="membershipNumber" 
                          placeholder="e.g. GH-2028-XXXXXX" 
                          value={formData.membershipNumber}
                          onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                          onFocus={() => setActiveStep(3)}
                          className="w-full bg-white p-4 text-on-surface text-sm border border-border/40 focus:border-on-surface outline-none transition-all font-bold rounded-sm shadow-inner" 
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData.showOnDashboard}
                            onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
                            onFocus={() => setActiveStep(3)}
                            className="peer h-4 w-4 cursor-pointer appearance-none border border-border/60 rounded-sm checked:bg-primary transition-all" 
                          />
                          <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-[10px] text-muted-foreground/80 font-bold tracking-tight group-hover:text-on-surface transition-colors">Publish to personal dossier</span>
                      </label>
                    </div>
                </div>
              </div>

              {/* Column 4: Upload Receipt */}
              <div id="receipt-section" className="bg-white border border-border/60 shadow-sm p-8 md:p-10 flex flex-col rounded-sm scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-7 h-7 bg-primary text-white flex items-center justify-center font-meta font-bold text-[10px]">04</span>
                  <h3 className="font-bold text-on-surface font-meta tracking-tight text-lg">Audit trail</h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="border border-dashed border-border/60 bg-muted/5 rounded-sm p-12 text-center hover:bg-muted/10 hover:border-on-surface transition-all group cursor-pointer relative flex-1 flex flex-col justify-center">
                      <input 
                        type="file" 
                        form="donationForm" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        onFocus={() => setActiveStep(4)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        id="receipt" 
                        required 
                      />
                      <div className="w-14 h-14 bg-white shadow-sm border border-border/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 rounded-sm">
                        <ArrowDownToLine className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-[10px] text-on-surface font-bold tracking-tight mb-1 font-meta">Synchronize receipt</p>
                      <p className="text-[9px] text-muted-foreground/40 font-bold tracking-tight">JPG, PNG, or PDF</p>
                    </div>

                    <div className="bg-muted/10 p-5 border border-border/40 rounded-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-on-surface font-meta tracking-tight text-[10px]">Global diaspora portal</h4>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-bold tracking-tight">
                        Use deployment code <span className="text-primary font-bold">THEBASEM</span> on TapTap for resource scaling bonus.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      form="donationForm"
                      variant="primary"
                      className="w-full py-8 flex items-center justify-center gap-3 rounded-sm shadow-lg shadow-brand-green/20"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-[10px] font-bold tracking-tight">Authorize Contribution</span>
                    </Button>
                </div>
              </div>

            </div>

            {/* Movement Victories Section */}
            {pastCampaigns.length > 0 && (
              <section className="mt-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface tracking-tight font-meta flex items-center gap-3">
                      <Check className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.4)]" />
                      Strategic victories
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight mt-2">Historical proof of patriot mobilization success.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {pastCampaigns.map(c => (
                    <Card key={c.id} className="bg-white border border-border/60 p-5 flex flex-col relative grayscale hover:grayscale-0 transition-all duration-700 opacity-75 hover:opacity-100 rounded-sm">
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-on-surface text-white text-[8px] font-bold tracking-tight px-3 py-1 shadow-xl flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary" /> 100% Secured
                        </span>
                      </div>
                      <div className="aspect-square bg-muted/30 mb-5 overflow-hidden rounded-sm border border-border/5">
                        {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover"  decoding="async" loading="lazy" />}
                      </div>
                      <h4 className="font-bold text-on-surface font-meta text-xs mb-2 tracking-tight">{c.title}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground/40 mb-6 line-clamp-2 leading-relaxed">{c.description}</p>
                      <div className="mt-auto pt-4 border-t border-border/40 flex justify-between items-center">
                        <div>
                          <p className="text-[8px] font-bold text-muted-foreground/40 tracking-tight">Total impact</p>
                          <p className="text-xs font-bold text-primary">GHS {c.raisedAmount.toLocaleString()}</p>
                        </div>
                        <span className="text-[8px] font-bold text-on-surface/20 tracking-tight italic">Decommissioned</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Contribution History Section */}
            <section className="mt-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight font-meta flex items-center gap-3">
                    <Activity className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" />
                    Capital deployment history
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight mt-2">Immutable record of your personal impact.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-5 py-3 bg-white border border-border/60 text-center rounded-sm shadow-sm">
                    <p className="text-[8px] font-bold text-muted-foreground/40 tracking-tight">Aggregate support</p>
                    <p className="text-sm font-bold text-on-surface tracking-tight font-meta mt-1">GHS 1,250</p>
                  </div>
                  <div className="px-5 py-3 bg-primary/10 border border-primary/20 text-center rounded-sm shadow-sm">
                    <p className="text-[8px] font-bold text-primary tracking-tight">Mobilization XP</p>
                    <p className="text-sm font-bold text-primary tracking-tight font-meta mt-1">125 Units</p>
                  </div>
                </div>
              </div>

              <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/40">
                        <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Deployment details</th>
                        <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Capital</th>
                        <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Channel</th>
                        <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Verification</th>
                        <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-muted-foreground/40 text-[10px] font-bold tracking-tight italic">
                            Synchronizing deployment ledger...
                          </td>
                        </tr>
                      ) : contributions.length > 0 ? (
                        contributions.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors group">
                          <td className="p-6">
                            <p className="text-xs font-bold text-on-surface tracking-tight">{item.date}</p>
                            <p className="text-[10px] text-primary font-bold tracking-tight mt-1">{item.campaignTitle || 'Strategic Fund'}</p>
                            <p className="text-[9px] text-muted-foreground/40 font-bold tracking-tight mt-1">TX-{item.id.toLowerCase()}</p>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-on-surface font-meta">{item.amount}</p>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-muted/40 rounded-full"></span>
                              <p className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">{item.method}</p>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "inline-flex items-center gap-2 px-3 py-1 text-[9px] font-bold tracking-tight rounded-sm shadow-sm",
                              item.status === 'Verified' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'Verified' ? "bg-primary" : "bg-accent")}></div>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <Button variant="ghost" size="sm" className="text-muted-foreground/40 hover:text-primary transition-all rounded-sm active:scale-95">
                              <ArrowDownToLine className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-16 text-center">
                            <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight">No deployment history detected.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-border/40">
                  {contributions.map((item, idx) => (
                    <div key={idx} className="p-8 bg-white space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-on-surface tracking-tight">{item.date}</p>
                          <p className="text-[10px] text-muted-foreground/40 font-bold tracking-tight mt-1">TX-{item.id.toLowerCase()}</p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 text-[9px] font-bold tracking-tight rounded-sm",
                          item.status === 'Verified' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground/40 tracking-tight mb-1">Capital deployment</p>
                          <p className="text-xl font-bold text-on-surface font-meta">{item.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-muted-foreground/40 tracking-tight mb-1">Channel</p>
                          <p className="text-[10px] font-bold text-on-surface tracking-tight">{item.method}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full h-12 border-border/60 text-muted-foreground/40 text-[10px] font-bold tracking-tight rounded-sm hover:bg-on-surface hover:text-white transition-all shadow-sm">
                        <ArrowDownToLine className="w-4 h-4 mr-2" /> Synchronize proof
                      </Button>
                    </div>
                  ))}
                </div>

                 <div className="p-6 bg-muted/30 border-t border-border/40 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 tracking-tight">Live mobilization ledger</p>
                    <button 
                       onClick={() => setIsHistoryModalOpen(true)}
                       className="text-[10px] font-bold text-primary tracking-tight hover:text-on-surface transition-all border-b border-primary/30 pb-1"
                     >
                       Full operational audit
                     </button>
                  </div>
              </Card>
            </section>

             {/* History Modal */}
             {isHistoryModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-on-surface/60 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)}></div>
                 <div className="relative w-full max-w-4xl bg-white border border-border/60 shadow-2xl overflow-hidden rounded-sm flex flex-col max-h-[85vh]">
                   <div className="p-8 border-b border-border/40 flex items-center justify-between bg-white sticky top-0 z-10">
                     <div className="flex items-center gap-4">
                       <Activity className="w-6 h-6 text-primary shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" />
                       <h3 className="font-bold text-on-surface font-meta tracking-tight text-xl leading-none">Capital deployment ledger</h3>
                     </div>
                     <Button 
                       variant="ghost"
                       size="icon"
                       onClick={() => setIsHistoryModalOpen(false)}
                       className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all"
                     >
                       <X className="w-6 h-6" />
                     </Button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-0">
                     {contributions.length > 0 ? (
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-muted/30 border-b border-border/40">
                             <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Deployment details</th>
                             <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Capital</th>
                             <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Channel</th>
                             <th className="p-6 text-[9px] font-bold text-muted-foreground/40 tracking-tight">Verification</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-border/40">
                           {contributions.map((item, idx) => (
                             <tr key={idx} className="hover:bg-muted/10 transition-colors group">
                               <td className="p-6">
                                 <p className="text-xs font-bold text-on-surface tracking-tight">{item.date}</p>
                                 <p className="text-[10px] text-muted-foreground/40 font-bold tracking-tight mt-1">TX-{item.id.toLowerCase()}</p>
                               </td>
                               <td className="p-6">
                                 <p className="text-sm font-bold text-on-surface font-meta">{item.amount}</p>
                               </td>
                               <td className="p-6">
                                 <p className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">{item.method}</p>
                               </td>
                               <td className="p-6">
                                 <span className={cn(
                                   "inline-flex items-center gap-2 px-3 py-1 text-[9px] font-bold tracking-tight rounded-sm",
                                   item.status === 'Verified' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                                 )}>
                                   {item.status}
                                 </span>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     ) : (
                       <div className="py-32 px-8 text-center bg-muted/5">
                         <div className="w-20 h-20 bg-white shadow-sm border border-border/10 flex items-center justify-center mx-auto mb-8 rounded-sm">
                           <Activity className="w-8 h-8 text-muted-foreground/20" />
                         </div>
                         <h4 className="text-xl font-bold text-on-surface mb-3 font-meta tracking-tight">Deployment records inactive</h4>
                         <p className="text-[11px] text-muted-foreground/60 max-w-sm mx-auto mb-8 font-bold tracking-tight leading-relaxed">
                           No capital deployment detected for this session. Support the movement cells to build a technically robust Ghana.
                         </p>
                       </div>
                     )}
                   </div>

                   <div className="p-8 border-t border-border/40 flex items-center justify-between bg-muted/10 sticky bottom-0 z-10">
                     <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40 tracking-tight">
                       <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--brand-green-full)]"></span>
                       {contributions.length} deployment records secured
                     </div>
                     <div className="flex gap-4">
                       <Button 
                         variant="outline"
                         onClick={() => setIsHistoryModalOpen(false)}
                         className="px-6 h-12 border-border/60 text-muted-foreground/40 font-bold text-[10px] tracking-tight rounded-sm hover:bg-white transition-all flex items-center gap-2"
                       >
                         <ArrowDownToLine className="w-4 h-4" /> Download audit
                       </Button>
                       <Button 
                         onClick={() => {
                           setIsHistoryModalOpen(false)
                           document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                         }}
                         className="px-8 h-12 bg-on-surface text-white font-bold text-[10px] tracking-tight rounded-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
                       >
                         <Heart className="w-4 h-4 text-primary" /> Contribute
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
