import { useState, useEffect, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { DonationDetail, DonationCampaign } from '@/types/admin'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useIsClient } from '@/hooks/useIsClient'

import { HeroStats } from './donate/components/HeroStats'
import { StrategicPriorities } from './donate/components/StrategicPriorities'
import { MobilizationProtocol } from './donate/components/MobilizationProtocol'
import { VictoriesSection } from './donate/components/VictoriesSection'
import { OperationalTransparency } from './donate/components/OperationalTransparency'
import { AuditModal } from './donate/components/AuditModal'
import { DashboardKPIs } from './donate/components/DashboardKPIs'
import { DashboardDonateForm } from './donate/components/DashboardDonateForm'
import { DashboardCampaignsList } from './donate/components/DashboardCampaignsList'
import { DashboardContributionHistory } from './donate/components/DashboardContributionHistory'
import { DonateSuccessPanel } from './donate/components/DonateSuccessPanel'

export default function Donate() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const [submitted, setSubmitted] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [pastCampaigns, setPastCampaigns] = useState<DonationCampaign[]>([])
  const [countries, setCountries] = useState<
    { id: string | number; name: string; dialing_code: string; is_diaspora: boolean }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [globalStats, setGlobalStats] = useState({ totalMembers: 0, totalRaised: 0 })
  const [publicHistory, setPublicHistory] = useState<DonationDetail[]>([])
  const [personalHistory, setPersonalHistory] = useState<DonationDetail[]>([])
  const [spendingHistory, setSpendingHistory] = useState<
    {
      id: string
      chapter: string
      type: string
      amount: string
      description: string
      category: string
      date: string
    }[]
  >([])
  const [historyTab, setHistoryTab] = useState<'contributions' | 'spending'>('contributions')
  const [contributionFilter, setContributionFilter] = useState<'all' | 'me'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleDownload = () => {
    const dataToExport = contributionFilter === 'all' ? publicHistory : personalHistory
    const filteredData = dataToExport.filter(
      (item) =>
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.amount.includes(searchQuery)
    )

    if (filteredData.length === 0) {
      toast.error('no verified data found for export.')
      return
    }

    const headers = ['date', 'contributor', 'campaign', 'amount', 'method', 'reference', 'status']
    const csvContent = [
      headers.join(','),
      ...filteredData.map((item) =>
        [
          item.date,
          `"${item.fullName}"`,
          `"${item.campaignTitle || 'strategic fund'}"`,
          `"${item.amount}"`,
          item.method,
          item.reference,
          item.status,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `thebase_contributions_${new Date().toISOString().split('T')[0]}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('strategic ledger exported successfully.')
  }

  const isClient = useIsClient()
  const isLoggedIn = isClient && typeof window !== 'undefined' && !!localStorage.getItem('userName')
  const [formData, setFormData] = useState(() => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('userName') || '' : ''
    const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('userPhone') || '' : ''
    const storedMemberId =
      typeof window !== 'undefined' ? localStorage.getItem('userMemberId') || '' : ''
    return {
      fullName: storedName,
      phone: storedPhone,
      amount: '',
      country: 'ghana',
      membershipNumber: storedMemberId,
      showOnDashboard: !!storedName,
      campaignId: '',
    }
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setCountriesLoading(true)
      try {
        const [activeData, pastData, countriesData, publicHistoryData, statsData, ledgerData] =
          await Promise.all([
            adminService.getDonationCampaigns('Active'),
            adminService.getDonationCampaigns('Closed'),
            adminService.getCountries(),
            adminService.getPublicDonationFeed(20),
            adminService.getDonationStats(),
            adminService.getMobilizationLedger(20),
          ])
        setCampaigns(activeData)
        setPastCampaigns(pastData)
        setCountries(countriesData)
        setPublicHistory(
          publicHistoryData.map((d) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: `₵${Number(d.amount).toLocaleString()}`,
          }))
        )
        setSpendingHistory(ledgerData)
        setGlobalStats({
          totalMembers: statsData.totalContributions,
          totalRaised: statsData.approvedAmount,
        })

        const savedPhone = localStorage.getItem('userPhone')
        if (savedPhone) {
          const personalData = await adminService.getMemberDonationsByPhone(savedPhone)
          setPersonalHistory(
            personalData.map((d) => ({
              ...d,
              date: new Date(d.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              amount: `₵${Number(d.amount).toLocaleString()}`,
            }))
          )
        }

        if (activeData.length > 0) {
          setFormData((prev) => {
            if (!prev.campaignId) return { ...prev, campaignId: activeData[0].id }
            return prev
          })
        }

        const ghana = countriesData.find((c) => c.name.toLowerCase() === 'ghana')
        if (ghana) setFormData((prev) => ({ ...prev, country: ghana.name }))
      } catch (err) {
        console.error('[DONATE] Data fetch failed:', err)
        toast.error('tactical data synchronization failed.')
      } finally {
        setLoading(false)
        setCountriesLoading(false)
      }
    }
    fetchData()

    const subscription: RealtimeChannel = adminService.subscribeToPublicDonations((newDonation) => {
      setPublicHistory((prev) => {
        if (prev.some((d) => d.id === newDonation.id)) return prev
        const formatted = {
          ...newDonation,
          date: new Date(newDonation.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          amount: `₵${Number(newDonation.amount).toLocaleString()}`,
        }
        return [formatted, ...prev].slice(0, 50)
      })
      setGlobalStats((prev) => ({
        totalMembers: prev.totalMembers + 1,
        totalRaised: prev.totalRaised + Number(newDonation.amount),
      }))
    })

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['payment-section', 'donor-section', 'link-section', 'receipt-section']
      const scrollPos = window.scrollY + 200
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const success = await adminService.submitDonation({
      ...formData,
      paymentMethod: 'mtn momo',
      memberId: localStorage.getItem('userId'),
    })
    if (success) {
      setSubmitted(true)
      toast.success('donation submitted for verification!')
    } else {
      toast.error('failed to submit donation. please check your details.')
    }
  }

  if (isDashboard) {
    const displayHistory = contributionFilter === 'all' ? publicHistory : personalHistory

    return (
      <div className="main">
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: 'hsl(var(--on-surface))',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            Support the Movement
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 400,
            }}
          >
            Your contributions fuel the growth and sustainability of the movement.
          </p>
        </div>

        <DashboardKPIs
          globalStats={globalStats}
          campaigns={campaigns}
          personalHistory={personalHistory}
          loading={loading}
        />

        {submitted ? (
          <DonateSuccessPanel variant="dashboard" onNewContribution={() => setSubmitted(false)} />
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-[300px_1fr]"
            style={{ gap: 24, marginTop: 24, alignItems: 'start' }}
          >
            <DashboardDonateForm
              formData={formData}
              setFormData={setFormData}
              campaigns={campaigns}
              onSubmit={handleSubmit}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <DashboardCampaignsList
                campaigns={campaigns}
                loading={loading}
                selectedCampaignId={formData.campaignId}
                onSelectCampaign={(id) => setFormData((prev) => ({ ...prev, campaignId: id }))}
              />
              <DashboardContributionHistory
                loading={loading}
                displayHistory={displayHistory}
                contributionFilter={contributionFilter}
                onFilterChange={setContributionFilter}
                onViewFullLedger={() => setIsHistoryModalOpen(true)}
              />
            </div>
          </div>
        )}

        <AuditModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          publicHistory={publicHistory}
          contributionsCount={globalStats.totalMembers}
          onDownload={handleDownload}
          onContribute={() => setIsHistoryModalOpen(false)}
        />
      </div>
    )
  }

  return (
    <main
      style={{
        background: 'linear-gradient(160deg, #f7faf7 0%, #fff 40%)',
        minHeight: '100vh',
        paddingBottom: 96,
      }}
    >
      <SEO
        title="Support the Movement"
        description="Your contributions fuel the growth and sustainability of the movement. Join citizens in Ghana and across the diaspora working for a more productive future."
        canonical="/donate"
      />

      <header style={{ background: '#fff', borderBottom: '1px solid hsl(var(--border))' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(48px, 8vw, 64px) clamp(16px, 4vw, 32px)',
          }}
        >
          <Breadcrumbs />
          <div style={{ marginTop: 24 }}>
            <h1
              style={{
                color: 'hsl(var(--on-surface))',
                fontSize: 'clamp(32px, 8vw, 64px)',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 900,
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
            <div className="bl">
              <div />
              <div />
              <div />
            </div>
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
              spendingHistory={spendingHistory}
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
