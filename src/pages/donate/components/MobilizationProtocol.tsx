import type { FormEvent } from 'react'
import { Phone, Check, Activity, Globe, ArrowDownToLine, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/neon-button'
import type { DonationCampaign } from '@/types/admin'

interface FormData {
  fullName: string
  phone: string
  amount: string
  country: string
  membershipNumber: string
  showOnDashboard: boolean
  campaignId: string
}

interface Country {
  id: string | number
  name: string
  dialing_code: string
  is_diaspora: boolean
}

interface MobilizationProtocolProps {
  activeStep: number
  setActiveStep: (step: number) => void
  formData: FormData
  setFormData: (data: FormData) => void
  isLoggedIn: boolean
  countriesLoading: boolean
  countries: Country[]
  campaigns: DonationCampaign[]
  onSubmit: (e: FormEvent) => void
}

export function MobilizationProtocol({
  activeStep,
  setActiveStep,
  formData,
  setFormData,
  isLoggedIn,
  countriesLoading,
  countries,
  campaigns,
  onSubmit
}: MobilizationProtocolProps) {
  const steps = [
    { step: 1, label: 'capital transfer', id: 'payment-section', color: 'bg-brand-red' },
    { step: 2, label: 'profile details', id: 'donor-section', color: 'bg-brand-gold' },
    { step: 3, label: 'patriot link', id: 'link-section', color: 'bg-brand-green' },
    { step: 4, label: 'verification', id: 'receipt-section', color: 'bg-brand-green' }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-16 items-start pt-20 lowercase">
      {/* sidebar navigation */}
      <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24">
        <div className="bg-white border border-stone-100 p-8 shadow-sm">
          <h4 className="text-[10px] font-bold text-stone-400 mb-8 uppercase tracking-widest">deployment protocol</h4>
          <div className="space-y-8">
            {steps.map((s) => (
              <button 
                key={s.step}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="flex items-center gap-4 group w-full text-left"
              >
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center text-xs font-bold transition-all",
                  activeStep === s.step 
                    ? `${s.color} text-white shadow-lg scale-110` 
                    : "bg-stone-50 text-stone-400 group-hover:bg-stone-100 group-hover:text-stone-600"
                )}>
                  {s.step}
                </div>
                <div>
                  <span className={cn(
                    "text-xs font-bold tracking-tight block transition-colors",
                    activeStep === s.step ? "text-stone-900" : "text-stone-400"
                  )}>
                    {s.label}
                  </span>
                  {activeStep === s.step && (
                    <span className="text-[9px] font-medium text-emerald-600 animate-pulse">in progress</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 space-y-12 w-full">
        {/* step 1: capital transfer */}
        <div id="payment-section" className="bg-stone-900 text-white p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col scroll-mt-[180px] rounded-none">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
            <Phone className="w-32 h-32 text-brand-green" />
          </div>
          
          <div className="flex items-center gap-4 mb-10">
            <span className="w-8 h-8 bg-brand-red text-white flex items-center justify-center font-meta font-bold text-xs">01</span>
            <h3 className="font-bold text-white font-meta tracking-tight text-xl">capital transfer</h3>
          </div>
          
          <div className="space-y-10 flex-1">
            <div>
              <p className="text-micro font-medium tracking-tight text-white/30 font-meta mb-2">account holder</p>
              <p className="font-bold text-brand-green text-2xl tracking-tight leading-none font-meta first-letter:uppercase">paul kofi agyekum</p>
            </div>
            <div>
              <p className="text-micro font-medium tracking-tight text-white/30 font-meta mb-2">momo identifier</p>
              <p className="font-bold font-meta tracking-tight text-white text-2xl">+233 538 873 569</p>
            </div>
            <div className="grid grid-cols-1 gap-8 pt-10 border-t border-white/10">
              <div>
                <p className="text-micro font-medium tracking-tight text-white/30 font-meta mb-2">network hub</p>
                <p className="text-white/90 font-bold font-meta text-base">mtn mobile money</p>
              </div>
              <div>
                <p className="text-micro font-medium tracking-tight text-white/30 font-meta mb-2">deployment reference</p>
                <p className="text-brand-gold font-bold font-meta text-base italic border-b border-brand-gold/30 pb-1">"the base"</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/5 border border-white/10 flex items-start gap-4">
            <div className="text-brand-green mt-1">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-bold tracking-tight">
              complete transfer protocol first, then capture receipt for verification.
            </p>
          </div>
        </div>

        {/* step 2: contributor profile */}
        <div id="donor-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
          <div className="flex items-center gap-4 mb-10">
            <span className="w-8 h-8 bg-brand-gold text-[#92400e] flex items-center justify-center font-meta font-bold text-xs">02</span>
            <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">contributor profile</h3>
          </div>

          <form onSubmit={onSubmit} id="donationForm" className="space-y-8 flex-1">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                identification <span className="text-brand-red">*</span>
              </label>
              <input 
                id="fullName" 
                placeholder="legal full name" 
                required 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={() => setActiveStep(2)} 
                className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-medium placeholder:text-stone-200" 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                contact line <span className="text-brand-red">*</span>
              </label>
              <input 
                id="phone" 
                placeholder="+233 xx xxx xxxx" 
                required 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onFocus={() => setActiveStep(2)} 
                className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-medium placeholder:text-stone-200" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                  amount (ghs) <span className="text-brand-red">*</span>
                </label>
                <input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  required 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onFocus={() => setActiveStep(2)} 
                  className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-medium font-meta placeholder:text-stone-200" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                  jurisdiction <span className="text-brand-red">*</span>
                </label>
                <select 
                  id="country" 
                  required 
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  onFocus={() => setActiveStep(2)} 
                  disabled={countriesLoading}
                  className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-medium appearance-none disabled:opacity-50"
                >
                  {countriesLoading ? (
                    <option>synchronizing...</option>
                  ) : countries.length > 0 ? (
                    countries.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  ) : (
                    <option value="ghana">ghana</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="campaign" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                target cell <span className="text-brand-red">*</span>
              </label>
              <select 
                id="campaign" 
                required 
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                onFocus={() => setActiveStep(2)} 
                className="w-full h-12 px-0 text-stone-900 text-sm bg-transparent border-b border-stone-200 focus:border-stone-900 outline-none transition-all font-medium appearance-none"
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* step 3: link patriot */}
        <div id="link-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
          <div className="flex items-center gap-4 mb-10">
            <span className="w-8 h-8 bg-stone-900 text-white flex items-center justify-center font-meta font-bold text-xs">03</span>
            <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">
              {isLoggedIn ? 'patriot profile' : 'link patriot'}
            </h3>
          </div>

          <div className="space-y-8 flex-1 flex flex-col">
              <div className="bg-stone-50 border border-stone-100 p-8 rounded-none space-y-8">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-brand-green" />
                  <h4 className="font-bold text-stone-900 font-meta tracking-tight text-sm uppercase">
                    {isLoggedIn ? 'active session' : 'movement id'}
                  </h4>
                </div>
                <p className="text-xs text-stone-500 font-medium leading-relaxed tracking-tight">
                  {isLoggedIn 
                    ? 'automatic recognition active. this deployment will be linked to your patriot profile.'
                    : 'enter your movement identification number to synchronize this capital with your profile.'
                  }
                </p>
                <div className="space-y-2">
                  <label htmlFor="membershipNumber" className="text-micro font-medium text-stone-400 font-meta tracking-tight">
                    movement id
                  </label>
                  <input 
                    id="membershipNumber" 
                    placeholder="gh-2028-xxxxxx" 
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    onFocus={() => setActiveStep(3)}
                    className="w-full bg-white px-4 h-12 text-stone-900 text-sm border border-stone-200 focus:border-stone-900 outline-none transition-all font-medium shadow-sm" 
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
                  <span className="text-xs text-stone-600 font-medium tracking-tight group-hover:text-stone-900 transition-colors">publish to personal dossier</span>
                </label>
              </div>
          </div>
        </div>

        {/* step 4: audit trail */}
        <div id="receipt-section" className="bg-white border border-stone-200 shadow-sm p-8 md:p-10 flex flex-col scroll-mt-[180px]">
          <div className="flex items-center gap-4 mb-10">
            <span className="w-8 h-8 bg-brand-green text-white flex items-center justify-center font-meta font-bold text-xs">04</span>
            <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl">audit trail</h3>
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
                <p className="text-tiny text-stone-900 font-bold tracking-tight mb-1 uppercase font-meta">synchronize receipt</p>
                <p className="text-micro text-stone-400 font-bold tracking-tight uppercase">jpg, png, or pdf</p>
              </div>

              <div className="bg-stone-50 p-6 border border-stone-100">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-brand-green" />
                  <h4 className="font-bold text-stone-900 font-meta tracking-tight text-micro uppercase">global diaspora hub</h4>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed font-medium tracking-tight">
                  use deployment code <span className="text-brand-green font-bold">thebasem</span> on taptap for resource scaling bonus.
                </p>
              </div>

              <Button
                type="submit"
                form="donationForm"
                variant="primary"
                className="w-full py-10 flex items-center justify-center gap-3 rounded-none shadow-xl shadow-brand-green/10 text-base lowercase"
              >
                <Heart className="w-5 h-5" />
                authorize contribution
              </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
