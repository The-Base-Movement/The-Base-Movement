import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Phone, Globe, Check, ArrowDownToLine, Activity, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { DonationRecord, DonationCampaign } from '@/types/admin'
import { toast } from 'sonner'

// Mock data removed in favor of live Supabase fetching

export default function Donate() {
  const [submitted, setSubmitted] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [contributions, setContributions] = useState<DonationRecord[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [pastCampaigns, setPastCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)

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
    async function fetchCampaigns() {
      const [activeData, pastData] = await Promise.all([
        adminService.getDonationCampaigns('Active'),
        adminService.getDonationCampaigns('Closed')
      ])
      setCampaigns(activeData)
      setPastCampaigns(pastData)
      
      // Auto-select first active campaign if none selected
      if (activeData.length > 0) {
        setFormData(prev => {
          if (!prev.campaignId) {
            return { ...prev, campaignId: activeData[0].id }
          }
          return prev
        })
      }
    }
    fetchCampaigns()
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
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      {/* Header */}
      <div className="bg-charcoal-dark text-white pt-24 pb-0 mb-0 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-hero-gradient"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 text-center pb-0 mb-0">
          <h1 className="text-4xl md:text-h1 font-bold mb-4 tracking-tighter font-meta">Support the Movement</h1>
          <div className="flex h-1 w-24 mx-auto mb-6">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-body-md">
            Your contribution helps grow and sustain The Base movement across Ghana and the diaspora. Together, we are building a nation that works for everyone.
          </p>
        </div>
      </div>

      {!submitted && (
        <div className={`sticky top-[72px] z-50 bg-off-white/95 backdrop-blur-md border-t-4 transition-all duration-300 border-b border-stone-200 py-6 shadow-sm mt-0 ${hasScrolled ? 'border-t-[var(--brand-green)]' : 'border-t-transparent'}`}>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
              <div className="hidden md:flex items-center gap-3 shrink-0 border-r border-stone-200 pr-6">
                <img src="/logo.png" alt="The Base" className="w-10 h-10 object-contain" />
                <div className="text-left text-stone-900">
                  <p className="font-meta font-bold text-sm uppercase tracking-tighter leading-none">Support the</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-green)]">Movement</p>
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <div className="absolute top-[16px] left-0 right-0 h-[1px] bg-stone-200 z-0"></div>
                <div className="grid grid-cols-4 gap-4 relative z-10">
                    {[
                      { step: 1, label: 'Details', id: 'payment-section', color: 'bg-[var(--brand-red)]', text: 'text-white' },
                      { step: 2, label: 'Donor', id: 'donor-section', color: 'bg-[var(--brand-gold)]', text: 'text-black' },
                      { step: 3, label: 'Link', id: 'link-section', color: 'bg-black', text: 'text-white' },
                      { step: 4, label: 'Proof', id: 'receipt-section', color: 'bg-[var(--brand-green)]', text: 'text-white' }
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center">
                        <div 
                          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          className={`w-8 h-8 rounded-none flex items-center justify-center font-meta font-bold text-xs border-2 transition-all cursor-pointer ${activeStep === s.step ? `${s.color} border-transparent ${s.text} scale-110 shadow-lg` : 'bg-white border-stone-200 text-stone-400'}`}
                        >
                          {s.step}
                        </div>
                        <span className={`text-[10px] font-meta font-semibold uppercase tracking-widest mt-2 text-center transition-colors ${activeStep === s.step ? 'text-[var(--brand-green)] font-bold' : 'text-stone-400'}`}>
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
              <Check className="w-10 h-10 text-[var(--brand-green)]" />
            </div>
            <h2 className="text-2xl font-bold text-charcoal-dark mb-3 font-meta tracking-tight">Thank You!</h2>
            <p className="text-slate-600 mb-8 font-body-md leading-relaxed">
              Your donation has been recorded and will be verified shortly. Your support is what makes this movement possible.
            </p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-4 bg-[var(--brand-green)] hover:opacity-90 transition-opacity text-white font-meta font-semibold tracking-wider rounded-none">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Active Campaigns Section */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal-dark tracking-tight font-meta">Active Campaigns</h2>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Direct your support to specific movement priorities</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-none border border-slate-200" />
                  ))
                ) : campaigns.map(c => (
                  <div key={c.id} className="bg-white border border-slate-200 p-6 flex flex-col group hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video bg-slate-100 mb-4 overflow-hidden relative">
                      {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                      <div className="absolute top-3 right-3">
                        <span className="bg-[var(--brand-green)] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-none shadow-lg">Active</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-charcoal-dark font-meta text-lg mb-2 group-hover:text-[var(--brand-green)] transition-colors">{c.title}</h3>
                    <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed">{c.description}</p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        <span>Progress</span>
                        <span className="text-[var(--brand-green)]">{Math.round((c.raisedAmount / c.targetAmount) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 mb-4">
                        <div 
                          className="h-full bg-[var(--brand-green)] transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (c.raisedAmount / c.targetAmount) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Raised</p>
                          <p className="text-sm font-bold text-charcoal-dark font-meta tracking-tight">GHS {c.raisedAmount.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, campaignId: c.id }))
                            document.getElementById('donor-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }}
                          className="text-[10px] font-bold text-[var(--brand-green)] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Support <ArrowDownToLine className="w-3 h-3 rotate-[-90deg]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-12">
              
              <div id="payment-section" className="bg-charcoal-dark text-white p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col scroll-mt-[180px]">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                  <Phone className="w-32 h-32 text-[var(--brand-green)]" />
                </div>
                
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-[var(--brand-red)] text-white flex items-center justify-center font-meta font-bold text-xs rounded-none">01</span>
                  <h3 className="font-bold text-white font-meta tracking-tighter text-xl">Payment Details</h3>
                </div>
                
                <div className="space-y-8 flex-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 font-meta mb-2">Account Holder</p>
                    <p className="font-bold text-[var(--brand-green)] text-2xl tracking-tight leading-none">Paul Kofi Agyekum</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 font-meta mb-2">MoMo Number</p>
                    <p className="font-bold font-meta tracking-wider text-white text-2xl">+233 538 873 569</p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/10">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 font-meta mb-2">Network</p>
                      <p className="text-slate-300 font-semibold font-meta uppercase text-sm">MTN Mobile Money</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 font-meta mb-2">Reference</p>
                      <p className="text-warm-gold font-bold font-meta uppercase text-sm italic border-b border-warm-gold/30 pb-1">"THE BASE"</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white/5 border border-white/10 flex items-start gap-4 rounded-none">
                  <div className="text-[var(--brand-green)] mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium tracking-wider">
                    Please complete the transfer first, then capture your receipt.
                  </p>
                </div>
              </div>

              {/* Column 2: Donation Form */}
              <div id="donor-section" className="bg-white border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-[var(--brand-gold)] text-black flex items-center justify-center font-meta font-bold text-xs rounded-none">02</span>
                  <h3 className="font-bold text-charcoal-dark font-meta tracking-tighter text-xl">Donor Information</h3>
                </div>

                <form onSubmit={handleSubmit} id="donationForm" className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                      Full name <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input 
                      id="fullName" 
                      placeholder="Your name" 
                      required 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50 rounded-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                      Phone number <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input 
                      id="phone" 
                      placeholder="+233 XX XXX XXXX" 
                      required 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50 rounded-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                        Amount (GHS) <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        required 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        onFocus={() => setActiveStep(2)} 
                        className="w-full form-understate p-4 text-charcoal-dark text-sm font-meta bg-slate-50/50 rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="country" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                        Country <span className="text-[var(--brand-red)]">*</span>
                      </label>
                      <select id="country" required onFocus={() => setActiveStep(2)} className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none bg-slate-50/50" style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}>
                        <option value="GH">Ghana</option>
                        <option value="NG">Nigeria</option>
                        <option value="UK">United Kingdom</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="campaign" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                      Select Campaign <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <select 
                      id="campaign" 
                      required 
                      value={formData.campaignId}
                      onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                      onFocus={() => setActiveStep(2)} 
                      className="w-full form-understate p-4 text-charcoal-dark text-sm appearance-none bg-slate-50/50"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                    >
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-none space-y-4">
                    <p className="text-[10px] font-bold font-meta uppercase tracking-widest text-slate-500">Member Tracking</p>
                    <input id="membership" placeholder="ID Number (Optional)" className="w-full bg-white border border-slate-200 p-4 text-sm font-meta placeholder-slate-300 focus:outline-none focus:border-[var(--brand-green)] transition-all" />
                  </div>
                </form>
              </div>

              {/* Column 3: Link Membership */}
              <div id="link-section" className="bg-white border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col rounded-none scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-black text-white flex items-center justify-center font-meta font-bold text-xs rounded-none">03</span>
                  <h3 className="font-bold text-charcoal-dark font-meta tracking-tighter text-xl">
                    {isLoggedIn ? 'Member Recognized' : 'Link Membership'}
                  </h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-none space-y-4">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-[var(--brand-green)]" />
                        <h4 className="font-bold text-charcoal-dark font-meta tracking-tight text-sm">
                          {isLoggedIn ? 'Automatic Integration' : 'Member Integration'} <span className="text-stone-400 font-normal">(optional)</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-body-md leading-relaxed">
                        {isLoggedIn 
                          ? 'We have identified your membership. This donation will be automatically linked to your movement profile.'
                          : 'If you are a registered member, enter your membership number to link this donation to your profile.'
                        }
                      </p>
                      <div className="space-y-2">
                        <label htmlFor="membershipNumber" className="text-[10px] font-semibold text-charcoal-dark font-meta tracking-widest uppercase">
                          Membership Number
                        </label>
                        <input 
                          id="membershipNumber" 
                          placeholder="e.g. GH-2028-345501 or DI-2028-345501" 
                          value={formData.membershipNumber}
                          onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                          onFocus={() => setActiveStep(3)}
                          className="w-full bg-white p-4 text-charcoal-dark text-sm border border-slate-200 focus:border-[var(--brand-green)] outline-none transition-all" 
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData.showOnDashboard}
                            onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
                            onFocus={() => setActiveStep(3)}
                            className="peer h-5 w-5 cursor-pointer appearance-none border-2 border-warm-gold rounded-none checked:bg-warm-gold transition-all" 
                          />
                          <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                        </div>
                        <span className="text-xs text-slate-600 font-meta font-semibold group-hover:text-[var(--brand-green)] transition-colors">Show my donation on my dashboard once verified</span>
                      </label>
                    </div>
                </div>
              </div>

              {/* Column 4: Upload Receipt */}
              <div id="receipt-section" className="bg-white border border-slate-200 shadow-sm p-8 md:p-10 flex flex-col rounded-none scroll-mt-[180px]">
                <div className="flex items-center gap-4 mb-10">
                  <span className="w-8 h-8 bg-[var(--brand-green)] text-white flex items-center justify-center font-meta font-bold text-xs rounded-none">04</span>
                  <h3 className="font-bold text-charcoal-dark font-meta tracking-tighter text-xl">Proof of Payment</h3>
                </div>

                <div className="space-y-8 flex-1 flex flex-col">
                    <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-none p-12 text-center hover:bg-slate-100 hover:border-[var(--brand-green)] transition-all group cursor-pointer relative flex-1 flex flex-col justify-center">
                      <input 
                        type="file" 
                        form="donationForm" 
                        accept=".jpg,.jpeg,.png,.pdf" 
                        onFocus={() => setActiveStep(4)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        id="receipt" 
                        required 
                      />
                      <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 rounded-none">
                        <ArrowDownToLine className="w-8 h-8 text-slate-400 group-hover:text-[var(--brand-green)] transition-colors" />
                      </div>
                      <p className="text-sm text-slate-700 font-semibold mb-1 tracking-tight font-meta">Click or drag receipt</p>
                      <p className="text-[10px] text-slate-400 font-meta uppercase tracking-widest">JPG, PNG, or PDF</p>
                    </div>

                    <div className="bg-surface-warm p-6 border border-slate-100 rounded-none">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="w-5 h-5 text-[var(--brand-green)]" />
                        <h4 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-xs">International option</h4>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-body-md">
                        Use code <span className="text-[var(--brand-green)] font-bold">THEBASEM</span> on TapTap Send for a bonus.
                      </p>
                    </div>

                    <button
                      type="submit"
                      form="donationForm"
                      className="w-full bg-[var(--brand-green)] hover:opacity-95 text-white font-meta font-semibold tracking-widest py-6 transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-xl shadow-brand-green/10 rounded-none"
                    >
                      <Heart className="w-6 h-6" /> Confirm Donation
                    </button>
                </div>
              </div>

            </div>

            {/* Movement Victories Section */}
            {pastCampaigns.length > 0 && (
              <section className="mt-24">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-charcoal-dark tracking-tight font-meta flex items-center gap-3">
                      <Check className="w-6 h-6 text-[var(--brand-green)]" />
                      Movement Victories
                    </h2>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Proof of what we can achieve when patriots unite</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-75">
                  {pastCampaigns.map(c => (
                    <div key={c.id} className="bg-white border border-slate-200 p-5 flex flex-col relative grayscale hover:grayscale-0 transition-all duration-500">
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-black text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-none shadow-xl flex items-center gap-1">
                          <Check className="w-2 h-2" /> 100% Funded
                        </span>
                      </div>
                      <div className="aspect-square bg-slate-50 mb-4 overflow-hidden opacity-50">
                        {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />}
                      </div>
                      <h4 className="font-bold text-charcoal-dark font-meta text-sm mb-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 mb-4 line-clamp-2">{c.description}</p>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Impact</p>
                          <p className="text-xs font-bold text-[var(--brand-green)]">GHS {c.raisedAmount.toLocaleString()}</p>
                        </div>
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">Campaign Completed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contribution History Section */}
            <section className="mt-20">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal-dark tracking-tight font-meta flex items-center gap-3">
                    <Activity className="w-6 h-6 text-[var(--brand-green)]" />
                    Contribution History
                  </h2>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Track your personal impact on the movement</p>
                </div>
                <div className="hidden sm:flex gap-4">
                  <div className="px-4 py-2 bg-white border border-slate-200 text-center rounded-none">
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total donated</p>
                    <p className="text-sm font-bold text-charcoal-dark uppercase tracking-tight">GHS 1,250</p>
                  </div>
                  <div className="px-4 py-2 bg-[var(--brand-green)]/5 border border-[var(--brand-green)]/20 text-center rounded-none">
                    <p className="text-[9px] font-semibold text-[var(--brand-green)] uppercase tracking-widest">Points earned</p>
                    <p className="text-sm font-bold text-[var(--brand-green)] uppercase tracking-tight">125 XP</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-none">
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-5 text-sm font-semibold text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="p-5 text-sm font-semibold text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="p-5 text-sm font-semibold text-slate-500 uppercase tracking-widest">Method</th>
                        <th className="p-5 text-sm font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="p-5 text-sm font-semibold text-slate-500 uppercase tracking-widest text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-400 italic font-meta text-xs uppercase tracking-widest">
                            Fetching contribution history...
                          </td>
                        </tr>
                      ) : contributions.length > 0 ? (
                        contributions.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-5">
                            <p className="text-sm font-semibold text-charcoal-dark">{item.date}</p>
                            <p className="text-[9px] text-[var(--brand-green)] font-bold uppercase tracking-wider mt-0.5">{item.campaignTitle || 'General Fund'}</p>
                            <p className="text-[10px] text-slate-400 font-meta font-semibold uppercase tracking-widest">{item.id}</p>
                          </td>
                          <td className="p-5">
                            <p className="text-sm font-bold text-charcoal-dark">{item.amount}</p>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-none"></span>
                              <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">{item.method}</p>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-xs font-semibold uppercase tracking-widest rounded-none">
                              <div className="w-1 h-1 bg-[var(--brand-green)] rounded-none"></div>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <button className="p-2 text-slate-400 hover:text-[var(--brand-green)] hover:bg-white border border-transparent hover:border-slate-200 rounded-none transition-all">
                              <ArrowDownToLine className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-12 text-center">
                            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-meta text-xs uppercase tracking-widest">No contributions recorded yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {contributions.map((item, idx) => (
                    <div key={idx} className="p-6 bg-white space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-charcoal-dark">{item.date}</p>
                          <p className="text-xs text-slate-400 font-meta uppercase tracking-widest">{item.id}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-xs font-semibold uppercase tracking-widest">
                          {item.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                          <p className="text-lg font-bold text-charcoal-dark">{item.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Method</p>
                          <p className="text-sm font-semibold text-slate-600">{item.method}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full h-10 border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-none">
                        <ArrowDownToLine className="w-4 h-4 mr-2" /> View Receipt
                      </Button>
                    </div>
                  ))}
                </div>

                 <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Contributions</p>
                    <button 
                       onClick={() => setIsHistoryModalOpen(true)}
                       className="text-sm font-bold text-[var(--brand-green)] uppercase tracking-widest hover:underline transition-all"
                     >
                       Full History
                     </button>
                 </div>
              </div>
            </section>

             {/* History Modal */}
             {isHistoryModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-charcoal-dark/60 backdrop-blur-md" onClick={() => setIsHistoryModalOpen(false)}></div>
                 <div className="relative w-full max-w-4xl bg-white border border-slate-200 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-[85vh]">
                   <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                     <div className="flex items-center gap-3">
                       <Activity className="w-5 h-5 text-[var(--brand-green)]" />
                       <h3 className="font-bold text-charcoal-dark font-meta uppercase tracking-tight text-lg">Full Contribution History</h3>
                     </div>
                     <button 
                       onClick={() => setIsHistoryModalOpen(false)}
                       className="p-2 text-slate-400 hover:text-[var(--brand-green)] hover:bg-slate-50 transition-all rounded-none"
                     >
                       <X className="w-6 h-6" />
                     </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-0">
                     {contributions.length > 0 ? (
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-slate-50 border-b border-slate-100">
                             <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Date / ID</th>
                             <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                             <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Method</th>
                             <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {contributions.map((item, idx) => (
                             <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                               <td className="p-5">
                                 <p className="text-sm font-semibold text-charcoal-dark">{item.date}</p>
                                 <p className="text-[10px] text-slate-400 font-meta font-bold tracking-widest">{item.id}</p>
                               </td>
                               <td className="p-5">
                                 <p className="text-sm font-bold text-charcoal-dark">{item.amount}</p>
                               </td>
                               <td className="p-5">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.method}</p>
                               </td>
                               <td className="p-5">
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--brand-green)]/10 text-[var(--brand-green)] text-[10px] font-bold uppercase tracking-[0.2em] rounded-none">
                                   {item.status}
                                 </span>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     ) : (
                       <div className="py-20 px-8 text-center">
                         <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto mb-6 rounded-none">
                           <Activity className="w-8 h-8 text-slate-300" />
                         </div>
                         <h4 className="text-xl font-bold text-charcoal-dark mb-2 font-meta">No contributions made</h4>
                         <p className="text-slate-500 max-w-sm mx-auto mb-8 text-sm">
                           You haven't made any contributions yet. Support the movement to build a better Ghana for everyone.
                         </p>
                       </div>
                     )}
                   </div>

                   <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 sticky bottom-0 z-10">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {contributions.length} Records Found
                     </div>
                     <div className="flex gap-4">
                       <button 
                         onClick={() => setIsHistoryModalOpen(false)}
                         className="px-6 py-3 border border-slate-200 text-slate-500 font-meta font-bold text-xs uppercase tracking-widest hover:bg-white transition-all rounded-none flex items-center gap-2"
                       >
                         <ArrowDownToLine className="w-4 h-4" /> Download History
                       </button>
                       <button 
                         onClick={() => {
                           setIsHistoryModalOpen(false)
                           document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                         }}
                         className="px-8 py-3 bg-[var(--brand-green)] text-white font-meta font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all rounded-none flex items-center gap-2 shadow-lg shadow-brand-green/20"
                       >
                         <Heart className="w-4 h-4" /> Contribute Now
                       </button>
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
