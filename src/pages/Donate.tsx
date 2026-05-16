import { useState, useEffect, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
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
          amount: `₵${Number(d.amount).toLocaleString()}`
        })))
        setSpendingHistory(ledgerData)
        setGlobalStats({ 
          totalMembers: statsData.totalContributions, 
          totalRaised: statsData.approvedAmount 
        })

        const savedPhone = localStorage.getItem('userPhone')
        if (savedPhone) {
          const personalData = await adminService.getMemberDonationsByPhone(savedPhone)
          setPersonalHistory(personalData.map(d => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: `₵${Number(d.amount).toLocaleString()}`
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
          amount: `₵${Number(newDonation.amount).toLocaleString()}`
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

  if (isDashboard) {
    const displayHistory = contributionFilter === 'all' ? publicHistory : personalHistory

    return (
      <div className="main">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 26, color: 'hsl(var(--on-surface))', letterSpacing: '-0.02em', marginBottom: 4 }}>Support the Movement</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 600 }}>Your contributions fuel the growth and sustainability of the movement.</p>
        </div>

        {/* KPI tiles */}
        <div className="kpis">
          {[
            { label: 'Movement Reserves', value: `₵ ${globalStats.totalRaised.toLocaleString()}`, icon: 'account_balance_wallet', bar: 'hsl(var(--primary))' },
            { label: 'Total Contributors', value: globalStats.totalMembers.toLocaleString(), icon: 'group', bar: 'hsl(var(--accent))' },
            { label: 'Active Campaigns', value: loading ? '—' : campaigns.length.toString(), icon: 'campaign', bar: 'hsl(var(--on-surface))' },
            { label: 'My Contributions', value: loading ? '—' : personalHistory.length.toString(), icon: 'volunteer_activism', bar: 'hsl(var(--destructive))' },
          ].map(kpi => (
            <div key={kpi.label} className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{kpi.label}</p>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>{kpi.icon}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>
                {loading ? '—' : kpi.value}
              </p>
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="panel" style={{ maxWidth: 520, margin: '24px auto 0', textAlign: 'center', padding: 40 }}>
            <div style={{ width: 64, height: 64, background: 'hsla(var(--primary), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', borderRadius: '50%' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--primary))' }}>check_circle</span>
            </div>
            <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'hsl(var(--on-surface))', marginBottom: 10, letterSpacing: '-0.02em' }}>Contribution Secured</h2>
            <p style={{ color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 24, fontFamily: "'Public Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>
              Your capital has been recorded in the mobilization queue. Verification is in progress.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setSubmitted(false)} className="btn btn-primary">New Contribution</button>
              <Link to="/dashboard" className="btn btn-outline" style={{ textDecoration: 'none' }}>View Dossier</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginTop: 24, alignItems: 'start' }}>
            {/* Left: Donation form */}
            <div className="panel">
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border))' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: 'hsl(var(--on-surface))', margin: 0 }}>Make a Contribution</p>
                  <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0', fontWeight: 600 }}>Support an active campaign</p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>volunteer_activism</span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 18px 20px' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Campaign</label>
                  <select name="name-badabb" id="select-badabb"
                    value={formData.campaignId}
                    onChange={e => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                    style={{ width: '100%', height: 40, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, background: '#fff', color: 'hsl(var(--on-surface))', boxSizing: 'border-box' }}>
                    {campaigns.length === 0 && <option value="">No active campaigns</option>}
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Amount (GHS)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>₵</span>
                    <input name="name-ded56b" id="input-ded56b"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      style={{ width: '100%', height: 40, paddingLeft: 24, paddingRight: 10, border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {['50', '100', '200', '500'].map(amt => (
                      <button key={amt} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, amount: amt }))}
                        style={{ padding: '4px 10px', fontSize: 11, fontWeight: 800, border: '1px solid hsl(var(--border))', borderRadius: 4, cursor: 'pointer', background: formData.amount === amt ? 'hsl(var(--primary))' : '#fff', color: formData.amount === amt ? '#fff' : 'hsl(var(--on-surface-muted))', transition: 'all 0.15s' }}>
                        ₵{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input name="name-46ec53" id="input-46ec53"
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    style={{ width: '100%', height: 40, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>MoMo Number</label>
                  <input name="name-4a990b" id="input-4a990b"
                    type="tel"
                    placeholder="024XXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    style={{ width: '100%', height: 40, padding: '0 10px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 600, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                  <input name="name-cc8da6"
                    type="checkbox"
                    id="showOnDashboard"
                    checked={formData.showOnDashboard}
                    onChange={e => setFormData(prev => ({ ...prev, showOnDashboard: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                  />
                  <label htmlFor="showOnDashboard" style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface))', cursor: 'pointer' }}>Show my name in public ledger</label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>favorite</span>
                  Submit Contribution
                </button>
              </form>
            </div>

            {/* Right: Campaigns + History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Active Campaigns */}
              <div className="panel">
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'hsl(var(--on-surface))', margin: 0 }}>Active Campaigns</p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0', fontWeight: 600 }}>Click a campaign to select it for your contribution</p>
                  </div>
                </div>
                <div style={{ padding: '16px 18px 18px' }}>
                  {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {[1, 2, 3].map(i => <div key={i} style={{ height: 110, background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }} />)}
                    </div>
                  ) : campaigns.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px 0', color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}>No active campaigns at this time.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {campaigns.map(c => {
                        const pct = Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100))
                        const isSelected = formData.campaignId === c.id
                        return (
                          <div
                            key={c.id}
                            onClick={() => setFormData(prev => ({ ...prev, campaignId: c.id }))}
                            style={{ border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))', borderRadius: 4, padding: 14, cursor: 'pointer', background: isSelected ? 'hsla(var(--primary), 0.04)' : '#fff', transition: 'all 0.15s' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{c.title}</p>
                            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontWeight: 600, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                            <div style={{ height: 4, background: 'hsl(var(--container-low))', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'hsl(var(--primary))', transition: 'width 1s ease-out' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>{pct}% funded</span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: 'hsl(var(--primary))' }}>₵ {c.raisedAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution History */}
              <div className="panel">
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border))' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'hsl(var(--on-surface))', margin: 0 }}>Contribution History</p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: '2px 0 0', fontWeight: 600 }}>Movement mobilization ledger</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'me'] as const).map(f => (
                      <button key={f} onClick={() => setContributionFilter(f)}
                        className={`btn btn-sm ${contributionFilter === f ? 'btn-primary' : 'btn-outline'}`}>
                        {f === 'all' ? 'All Records' : 'My Records'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Contributor', 'Campaign', 'Amount', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 18px', fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} style={{ padding: '32px 18px', textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>Loading...</td></tr>
                      ) : displayHistory.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '32px 18px', textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>No records found.</td></tr>
                      ) : displayHistory.slice(0, 10).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                          <td style={{ padding: '10px 18px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', margin: 0 }}>{item.fullName}</p>
                            <p style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', margin: 0, fontWeight: 600 }}>{item.date}</p>
                          </td>
                          <td style={{ padding: '10px 18px' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>{item.campaignTitle || 'Strategic Fund'}</p>
                          </td>
                          <td style={{ padding: '10px 18px' }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>{item.amount}</p>
                          </td>
                          <td style={{ padding: '10px 18px' }}>
                            <span className={`pill ${item.status === 'Verified' ? 'pill-ok' : 'pill-warn'}`}>{item.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {displayHistory.length > 10 && (
                  <div style={{ padding: '12px 18px', borderTop: '1px solid hsl(var(--border))', textAlign: 'right' }}>
                    <button onClick={() => setIsHistoryModalOpen(true)} className="btn btn-outline btn-sm">View full ledger</button>
                  </div>
                )}
              </div>
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
    <main style={{ background: '#fff', minHeight: '100vh', paddingBottom: 96 }}>
      <SEO
        title="Support the Movement"
        description="Your contributions fuel the growth and sustainability of the movement. Join citizens in Ghana and across the diaspora working for a more productive future."
        canonical="/donate"
      />
      
      <header style={{ background: '#fff', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px, 8vw, 64px) clamp(16px, 4vw, 32px)' }}>
          <Breadcrumbs />
          <div style={{ marginTop: 24 }}>
            <h1 style={{ 
              color: 'hsl(var(--on-surface))', 
              fontSize: 'clamp(32px, 8vw, 64px)', 
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 900, 
              letterSpacing: '-0.04em', 
              marginBottom: 24, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 16,
              lineHeight: 1.05
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 'clamp(32px, 8vw, 48px)', color: 'hsl(var(--destructive))' }}>favorite</span>
              Support the Movement
            </h1>
            <div className="bl"><div /><div /><div /></div>
            <p style={{ 
              color: 'hsl(var(--on-surface-muted))', 
              maxWidth: 768, 
              marginTop: 24, 
              lineHeight: 1.6, 
              fontWeight: 700, 
              fontSize: 'clamp(14px, 2vw, 16px)',
              fontFamily: "'Public Sans', sans-serif"
            }}>
              Your contributions fuel the growth and sustainability of the movement. Join citizens across Ghana and the diaspora in building a more productive and transparent future.
            </p>
          </div>
        </div>
      </header>

      <HeroStats 
        totalRaised={globalStats.totalRaised} 
        totalMembers={globalStats.totalMembers} 
      />

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)' }}>
        {submitted ? (
          <section style={{ 
            maxWidth: 640, 
            margin: '80px auto 0', 
            background: '#fff', 
            border: '1px solid hsl(var(--border))', 
            padding: 'clamp(32px, 8vw, 64px)', 
            textAlign: 'center' 
          }}>
            <div style={{ 
              width: 96, 
              height: 96, 
              background: 'rgba(0,107,63,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 32px', 
              borderRadius: '50%' 
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--primary))' }}>check</span>
            </div>
            <h2 style={{ 
              fontSize: 'clamp(24px, 5vw, 32px)', 
              fontWeight: 900, 
              color: 'hsl(var(--on-surface))', 
              marginBottom: 16,
              fontFamily: "'Public Sans', sans-serif",
              letterSpacing: '-0.02em'
            }}>Contribution Secured</h2>
            <p style={{ 
              color: 'hsl(var(--on-surface-muted))', 
              lineHeight: 1.6, 
              marginBottom: 40, 
              fontWeight: 700,
              fontFamily: "'Public Sans', sans-serif"
            }}>
              Your capital has been recorded in the mobilization queue. Verification is in progress. Thank you for your commitment to the movement.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', alignItems: 'center' }} className="md:flex-row">
              <button 
                onClick={() => setSubmitted(false)}
                className="btn btn-primary"
                style={{ minWidth: 200, height: 48, textTransform: 'lowercase' }}
              >
                New Contribution
              </button>
              <Link 
                to="/dashboard"
                className="btn btn-outline"
                style={{ minWidth: 200, height: 48, textTransform: 'lowercase', textDecoration: 'none' }}
              >
                View Dossier
              </Link>
            </div>
          </section>
        ) : (
          <section className="relative">
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
          document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
      />
    </main>
  )
}
