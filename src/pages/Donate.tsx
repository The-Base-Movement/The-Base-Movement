import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Check } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { DonationDetail, DonationCampaign } from '@/types/admin'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useIsClient } from '@/hooks/useIsClient'

// refactored components
import { HeroStats } from './donate/components/HeroStats'
import { StrategicPriorities } from './donate/components/StrategicPriorities'
import { MobilizationProtocol } from './donate/components/MobilizationProtocol'
import { VictoriesSection } from './donate/components/VictoriesSection'
import { OperationalTransparency } from './donate/components/OperationalTransparency'
import { AuditModal } from './donate/components/AuditModal'

export default function Donate() {
  const [submitted, setSubmitted] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
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
      toast.error('no verified data found for export.')
      return
    }

    const headers = ['date', 'contributor', 'campaign', 'amount', 'method', 'reference', 'status']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.date,
        `"${item.fullName}"`,
        `"${item.campaignTitle || 'strategic fund'}"`,
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
    link.setAttribute('download', `thebase_contributions_${new Date().toISOString().split('T')[0]}.csv`)
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
    const storedMemberId = typeof window !== 'undefined' ? localStorage.getItem('userMemberId') || '' : ''
    
    return {
      fullName: storedName,
      phone: storedPhone,
      amount: '',
      country: 'ghana',
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
          amount: `ghs ${Number(d.amount).toLocaleString()}`
        })))
        setSpendingHistory(ledgerData)
        setGlobalStats({ 
          totalMembers: statsData.totalContributions, 
          totalRaised: statsData.approvedAmount 
        })

        const savedPhone = localStorage.getItem('userPhone')
        if (savedPhone) {
          const personalData = await adminService.getMemberDonations(savedPhone)
          setPersonalHistory(personalData.map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: `ghs ${Number(d.amount).toLocaleString()}`
          })))
        }
        
        if (activeData.length > 0) {
          setFormData(prev => {
            if (!prev.campaignId) {
              return { ...prev, campaignId: activeData[0].id }
            }
            return prev
          })
        }

        const ghana = countriesData.find(c => c.name.toLowerCase() === 'ghana')
        if (ghana) {
          setFormData(prev => ({ ...prev, country: ghana.name }))
        }
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
      setPublicHistory(prev => {
        if (prev.some(d => d.id === newDonation.id)) return prev;
        
        const formatted = {
          ...newDonation,
          date: new Date(newDonation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: `ghs ${Number(newDonation.amount).toLocaleString()}`
        };
        return [formatted, ...prev].slice(0, 50);
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
      memberId: localStorage.getItem('userId')
    })

    if (success) {
      setSubmitted(true)
      toast.success('donation submitted for verification!')
    } else {
      toast.error('failed to submit donation. please check your details.')
    }
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      <SEO 
        title="support the movement"
        description="your contributions for the growth and sustainability of the base movement. join citizens in ghana and across the diaspora working for a more productive future."
        canonical="/donate"
      />
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <Heart className="w-10 h-10 text-brand-red" />
              Support the movement
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Your contributions fuel the growth and sustainability of the movement. Join citizens across Ghana and the diaspora in building a more productive and transparent future.
            </p>
          </div>
        </div>
      </header>

      <HeroStats 
        totalRaised={globalStats.totalRaised} 
        totalMembers={globalStats.totalMembers} 
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {submitted ? (
          <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-none shadow-sm p-16 text-center mt-20">
            <div className="w-24 h-24 bg-brand-green/10 flex items-center justify-center mx-auto mb-8 rounded-full">
              <Check className="w-12 h-12 text-brand-green" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4 font-meta">contribution secured</h2>
            <p className="text-stone-500 leading-relaxed mb-10 font-medium">
              your capital has been recorded in the mobilization queue. verification is in progress. thank you for your commitment to the movement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="solid" 
                onClick={() => setSubmitted(false)}
                className="px-8 h-12 lowercase"
              >
                new contribution
              </Button>
              <Link to="/dashboard">
                <Button 
                  variant="outline" 
                  className="px-8 h-12 w-full lowercase"
                >
                  view dossier
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            <StrategicPriorities 
              loading={loading}
              campaigns={campaigns}
              onSelectCampaign={(id) => {
                setFormData(prev => ({ ...prev, campaignId: id }))
                document.getElementById('donor-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
          </div>
        )}
      </div>

      <AuditModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        publicHistory={publicHistory}
        contributionsCount={globalStats.totalMembers}
        onDownload={handleDownload}
        onContribute={() => {
          setIsHistoryModalOpen(false)
          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
      />
    </main>
  )
}
