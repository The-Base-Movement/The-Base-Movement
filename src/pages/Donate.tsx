import { useState, useEffect } from 'react'
import {
  adminService,
  type Country,
  type DonationCampaign,
  type DonationDetail,
  type MobilizationLedger,
} from '@/services/adminService'
import { authService } from '@/services/authService'
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

export default function PublicDonate() {
  const [loading, setLoading] = useState(true)
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [countries, setCountries] = useState<Country[]>([])
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [pastCampaigns, setPastCampaigns] = useState<DonationCampaign[]>([])
  const [globalStats, setGlobalStats] = useState({ totalRaised: 0, totalMembers: 0 })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
    showOnDashboard: true,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const user = authService.getUser()
      setIsLoggedIn(!!user)

      if (user) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          membershipNumber: user.user_metadata?.membership_number || '',
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

    try {
      const success = await adminService.submitDonation({
        ...formData,
        showOnDashboard: formData.showOnDashboard,
      })
      if (success) {
        setSubmitted(true)
        toast.success('Contribution sequence initialized.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      toast.error('Transmission failure. Please try again.')
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
          background: '#fff',
          borderBottom: '1px solid hsl(var(--border))',
          padding: 'clamp(40px, 10vw, 80px) 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(32px, 8vw, 48px)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                letterSpacing: '-0.04em',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                lineHeight: 1.05,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 'clamp(32px, 8vw, 48px)', color: 'hsl(var(--destructive))' }}
              >
                favorite
              </span>
              Support the Movement
            </h1>
            <BrandLine />
            <p
              style={{
                color: 'hsl(var(--on-surface-muted))',
                maxWidth: 768,
                marginTop: 24,
                lineHeight: 1.6,
                fontWeight: 400,
                fontSize: 'clamp(14px, 2vw, 16px)',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Your contributions fuel the growth and sustainability of the movement. Join citizens
              across Ghana and the diaspora in building a more productive and transparent future.
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
              isLoggedIn={isLoggedIn}
              countriesLoading={countriesLoading}
              countries={countries}
              campaigns={campaigns}
              onSubmit={handleSubmit}
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
