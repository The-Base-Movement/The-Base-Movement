import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'
import {
  adminService,
  type Country,
  type DonationCampaign,
  type DonationDetail,
  type MobilizationLedger,
} from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { memberService } from '@/services/memberService'
import type { Member } from '@/types/admin'
import { toast } from 'sonner'
import { BrandLine } from '@/components/ui/BrandLine'

// Subcomponents
import { HeroStats } from './donate/components/HeroStats'
import { StrategicPriorities } from './donate/components/StrategicPriorities'
import { MobilizationProtocol } from './donate/components/MobilizationProtocol'
import { VictoriesSection } from './donate/components/VictoriesSection'
import { OperationalTransparency } from './donate/components/OperationalTransparency'
import { DonateSuccessPanel } from './donate/components/DonateSuccessPanel'
import { AuditModal } from './donate/components/AuditModal'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { initiateHubtelCheckout, openHubtelCheckout } from '@/components/payment/hubtelCheckout'
import { getCurrencyForCountry } from '@/lib/currency'

export default function PublicDonate() {
  const [loading, setLoading] = useState(true)
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [pastCampaigns, setPastCampaigns] = useState<DonationCampaign[]>([])
  const [globalStats, setGlobalStats] = useState({ totalRaised: 0, totalMembers: 0 })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [activeDonationId, setActiveDonationId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<
    'idle' | 'starting' | 'checkout' | 'failed' | 'processing'
  >('idle')
  const [historyTab, setHistoryTab] = useState<'contributions' | 'spending'>('contributions')
  const [searchQuery, setSearchQuery] = useState('')
  const [contributionFilter, setContributionFilter] = useState<'all' | 'me'>('all')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Real data
  const [publicHistory, setPublicHistory] = useState<DonationDetail[]>([])
  const [personalHistory, setPersonalHistory] = useState<DonationDetail[]>([])
  const [spendingHistory, setSpendingHistory] = useState<MobilizationLedger[]>([])

  const [activeStep, setActiveStep] = useState(1)
  const [formData, setFormData] = useState({
    amount: '',
    fullName: '',
    phone: '',
    country: 'Ghana',
    campaignId: '',
    membershipNumber: '',
    memberId: '',
    showOnDashboard: true,
  })
  const selectedCurrency = getCurrencyForCountry(formData.country)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let user = null
      try {
        const { data } = await supabase.auth.getUser()
        user = data.user
      } catch (err) {
        console.warn('Failed to retrieve user session on mount:', err)
      }

      setIsLoggedIn(!!user)

      let profile: Member | null = null
      if (user) {
        try {
          profile = await memberService.getMemberProfileByAuthId(user.id)
        } catch (err) {
          console.error('Failed to fetch user profile for pre-filling:', err)
        }

        setFormData((prev) => ({
          ...prev,
          fullName: profile?.name || user.user_metadata?.full_name || '',
          phone: profile?.phone || user.user_metadata?.phone || '',
          country: profile?.country || prev.country,
          membershipNumber: profile?.id || user.user_metadata?.membership_number || '',
          memberId: user.id,
        }))
      }

      try {
        const [countryData, activeCampaigns, victories, stats, allHistory, personal, spending] =
          await Promise.all([
            adminService.getCountries(),
            adminService.getStrategicPriorities(),
            adminService.getVictories(),
            adminService.getGlobalMobilizationStats(),
            adminService.getPublicDonationHistory(),
            user ? adminService.getPersonalDonationHistory(user.id) : Promise.resolve([]),
            adminService.getMovementSpendingHistory(),
          ])

        setCountries(countryData)
        setCampaigns(activeCampaigns)
        setPastCampaigns(victories)
        setGlobalStats(stats)
        setPublicHistory(allHistory)
        setPersonalHistory(personal)
        setSpendingHistory(spending)
      } catch (err) {
        console.error('Failed to initialize donation page:', err)
      } finally {
        setLoading(false)
        setCountriesLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeDonationId || submitted) return

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('status')
        .eq('id', activeDonationId)
        .maybeSingle()

      if (error || !data) return

      if (data.status === 'Verified') {
        setSubmitted(true)
        setPaymentState('idle')
        setCheckoutUrl(null)
        trackEvent('donation_verified', { donationId: activeDonationId })
        toast.success('Payment confirmed. Thank you for supporting the movement.')
      }

      if (data.status === 'Rejected') {
        setPaymentState('failed')
        toast.error('The payment could not be confirmed. Please try again.')
      }
    }

    void checkStatus()
    const timer = window.setInterval(() => void checkStatus(), 3000)
    return () => window.clearInterval(timer)
  }, [activeDonationId, submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid contribution amount.')
      return
    }
    if (!formData.fullName || !formData.phone) {
      toast.error('Identity verification required.')
      return
    }

    setPaymentState('starting')

    let donationIdToCleanUp: string | null = null
    try {
      const amount = parseFloat(formData.amount)
      const { data, error } = await supabase
        .from('donations')
        .insert({
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          amount,
          country: formData.country,
          payment_method: 'Hubtel',
          status: 'Pending',
          show_on_dashboard: formData.showOnDashboard,
          member_id: formData.memberId || null,
          campaign_id: formData.campaignId || null,
        })
        .select('id')
        .single()

      if (error) throw error

      donationIdToCleanUp = data.id
      setActiveDonationId(data.id)
      const url = await initiateHubtelCheckout({
        reference: data.id,
        amount,
        currency: selectedCurrency.code,
        name: formData.fullName,
        phone: formData.phone,
        metadata: {
          donationId: data.id,
          memberId: formData.memberId || undefined,
          membershipNumber: formData.membershipNumber || undefined,
          campaignId: formData.campaignId || undefined,
          jurisdiction: formData.country,
          currency: selectedCurrency.code,
          currencySymbol: selectedCurrency.symbol,
          enteredAmount: amount,
        },
      })

      setCheckoutUrl(url)
      setPaymentState('checkout')
      trackEvent('donation_payment_started', { amount, currency: selectedCurrency.code })
      const popup = openHubtelCheckout(url)
      if (!popup) toast.info('Allow popups or use the checkout button to complete payment.')
    } catch {
      if (donationIdToCleanUp) {
        await supabase
          .from('donations')
          .delete()
          .eq('id', donationIdToCleanUp)
          .eq('status', 'Pending')
      }
      setActiveDonationId(null)
      setPaymentState('failed')
      toast.error('Could not start secure checkout. Please try again.')
    }
  }

  const handleDownload = () => {
    toast.success('Initializing secure download...')
  }

  if (loading && !submitted) {
    return (
      <div
        className="page-root"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <main
      className="page-root"
      style={{ background: 'hsl(var(--surface))', minHeight: '100vh', paddingBottom: 80 }}
    >
      <header
        style={{
          background: 'hsl(var(--background))',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '56px 0 42px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
          <Breadcrumbs />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'hsl(var(--primary))',
              }}
            >
              Movement fund
            </p>
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 42,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                letterSpacing: '0',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                lineHeight: 1.05,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 40, color: 'hsl(var(--destructive))' }}
              >
                favorite
              </span>
              Support the movement
            </h1>
            <BrandLine />
            <p
              style={{
                color: 'hsl(var(--on-surface-muted))',
                maxWidth: 768,
                marginTop: 24,
                lineHeight: 1.6,
                fontWeight: 400,
                fontSize: 15,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Give directly on the platform using mobile money or card. Your contribution is linked
              to a movement priority, confirmed automatically, and shown in the public ledger only
              when you choose.
            </p>
          </div>
        </div>
      </header>

      <HeroStats totalRaised={globalStats.totalRaised} totalMembers={globalStats.totalMembers} />

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
        {submitted ? (
          <DonateSuccessPanel variant="public" onNewContribution={() => setSubmitted(false)} />
        ) : (
          <section className="relative">
            <StrategicPriorities
              loading={loading}
              campaigns={campaigns}
              onSelectCampaign={(id) => {
                setFormData((prev) => ({ ...prev, campaignId: id }))
                document
                  .getElementById('donor-section')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
            />
            <MobilizationProtocol
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              formData={formData}
              setFormData={setFormData}
              paymentState={paymentState}
              checkoutUrl={checkoutUrl}
              isLoggedIn={isLoggedIn}
              countriesLoading={countriesLoading}
              countries={countries}
              currency={selectedCurrency}
              campaigns={campaigns}
              onSubmit={handleSubmit}
              onReopenCheckout={() => checkoutUrl && openHubtelCheckout(checkoutUrl)}
              onOpenAudit={() => setIsHistoryModalOpen(true)}
            />
            <VictoriesSection pastCampaigns={pastCampaigns} />
            <OperationalTransparency
              globalStats={globalStats}
              historyTab={historyTab}
              setHistoryTab={setHistoryTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              contributionFilter={contributionFilter}
              setContributionFilter={setContributionFilter}
              loading={loading}
              publicHistory={publicHistory}
              personalHistory={personalHistory}
              spendingHistory={spendingHistory.map((s) => ({
                id: s.id,
                chapter: s.chapter,
                type: s.transaction_type,
                amount: s.amount.toString(),
                description: s.description,
                category: s.category,
                date: s.timestamp,
              }))}
              onDownload={handleDownload}
              onOpenAudit={() => setIsHistoryModalOpen(true)}
            />
          </section>
        )}
      </section>

      <AuditModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        publicHistory={publicHistory}
        contributionsCount={globalStats.totalMembers}
        onDownload={handleDownload}
        onContribute={() => {
          setIsHistoryModalOpen(false)
          document
            .getElementById('payment-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
      />
    </main>
  )
}
