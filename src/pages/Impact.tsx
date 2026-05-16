import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import { donationService } from '@/services/donationService'
import { memberService } from '@/services/memberService'
import { chapterService } from '@/services/chapterService'
import type { DonationDetail } from '@/types/admin'

export default function Impact() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')

  const [activeFilter, setActiveFilter] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [showFullActivity, setShowFullActivity] = useState(false)
  const [stats, setStats] = useState({
    totalDonations: '₵0',
    activeChapters: '0',
    totalMembers: '355,482',
    countriesReached: '1',
    raised: 0,
    goal: 500000,
    avgDonation: '₵0',
    totalContributors: 0
  })
  const [contributions, setContributions] = useState<{ [key: string]: DonationDetail[] }>({
    day: [], week: [], month: [], year: [], custom: []
  })
  const [regions, setRegions] = useState<{ name: string; engagement: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [donationStats, allDonations, members, chapters, leaderboard] = await Promise.all([
          donationService.getDonationStats(),
          donationService.getDonations(),
          memberService.getMembers(),
          chapterService.getChapters(),
          chapterService.getRegionalLeaderboard()
        ])

        const uniqueCountries = new Set(members.map(m => m.country || 'Ghana')).size
        setStats({
          totalDonations: donationStats.approvedAmount > 0 ? `₵${donationStats.approvedAmount.toLocaleString()}` : '₵0',
          activeChapters: chapters.filter(c => c.status === 'Active').length.toString(),
          totalMembers: '355,482',
          countriesReached: uniqueCountries.toString(),
          raised: donationStats.approvedAmount,
          goal: 500000,
          avgDonation: donationStats.approvedAmount > 0 ? `₵${(donationStats.approvedAmount / (donationStats.totalContributions || 1)).toFixed(2)}` : '₵0',
          totalContributors: donationStats.totalContributions
        })

        const GHANA_REGIONS = [
          'Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western',
          'Northern', 'Upper East', 'Upper West', 'Volta', 'North East',
          'Savannah', 'Bono', 'Bono East', 'Ahafo', 'Oti', 'Western North'
        ]
        setRegions(GHANA_REGIONS.map(name => {
          const live = leaderboard.find(l => l.region.toLowerCase() === name.toLowerCase())
          return { name, engagement: live ? Math.min(100, Math.max(5, Math.floor((live.total_patriots / (members.length || 1)) * 100))) : 0 }
        }))

        const now = new Date()
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        setContributions({
          day: allDonations.filter(d => new Date(d.date) > dayAgo),
          week: allDonations.filter(d => new Date(d.date) > weekAgo),
          month: allDonations.filter(d => new Date(d.date) > monthAgo),
          year: allDonations.filter(d => new Date(d.date) > yearAgo),
          custom: []
        })
      } catch (err) {
        console.error('[IMPACT] Data sync failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const allActivity = Object.values(contributions).flat()
  const filteredActivity = activeFilter === 'custom' ? [] : contributions[activeFilter] || []

  // ── Full Activity Modal (shared) ──────────────────────────────────────────
  const ActivityModal = showFullActivity ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.45)' }} onClick={() => setShowFullActivity(false)}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--container-low))' }}>
          <div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))' }}>Full Activity Log</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Verified movement contributions</div>
          </div>
          <button onClick={() => setShowFullActivity(false)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 4, cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>close</span>
          </button>
        </div>
        <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allActivity.length > 0 ? allActivity.slice(0, 50).map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 4, background: 'rgba(0,107,63,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--primary))' }}>{item.fullName[0]}</div>
                <div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{item.fullName}</div>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{item.country} · {new Date(item.date).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--primary))' }}>₵{item.amount}</div>
                <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>Verified</div>
              </div>
            </div>
          )) : (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>analytics</span>
              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>No activity recorded yet</p>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', background: 'hsl(var(--container-low))', borderTop: '1px solid hsl(var(--border))', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>Updated in real-time · Showing latest 50 records</span>
        </div>
      </div>
    </div>
  ) : null

  // ── Dashboard layout ──────────────────────────────────────────────────────
  if (isDashboard) {
    const progressPct = Math.min(100, Math.round((stats.raised / stats.goal) * 100))

    return (
      <div className="main">
        {ActivityModal}

        {/* KPI tiles */}
        <div className="kpis" style={{ marginBottom: 24 }}>
          {[
            { label: 'Donations received', value: isLoading ? '—' : stats.totalDonations, sub: 'Total approved', bar: 'hsl(var(--primary))', icon: 'volunteer_activism' },
            { label: 'Active chapters', value: isLoading ? '—' : stats.activeChapters, sub: 'Operational units', bar: 'hsl(var(--accent))', icon: 'account_balance' },
            { label: 'Registered patriots', value: isLoading ? '—' : stats.totalMembers, sub: 'National scale', bar: 'hsl(var(--on-surface))', icon: 'groups' },
            { label: 'Countries reached', value: isLoading ? '—' : stats.countriesReached, sub: 'Global diaspora', bar: 'hsl(var(--destructive))', icon: 'public' },
          ].map(kpi => (
            <div key={kpi.label} className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: kpi.bar }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>{kpi.icon}</span>
              </div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 26, color: 'hsl(var(--on-surface))', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{kpi.value}</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        <div className="main-sidebar" style={{ alignItems: 'start' }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Campaign progress */}
            <div className="panel">
              <div className="ph">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>trending_up</span>
                  Campaign progress
                </span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>National Organizing Fund</span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>₵{stats.raised.toLocaleString()} <span style={{ fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>/ {stats.goal.toLocaleString()}</span></span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))' }}>{progressPct >= 1 ? `${progressPct}% achieved` : 'Early momentum'}</span>
                </div>
                <div style={{ height: 10, background: 'hsl(var(--container-low))', borderRadius: 5, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'hsl(var(--primary))', borderRadius: 5, transition: 'width 1s ease-out' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                  {[
                    { label: 'Avg. donation', value: stats.avgDonation },
                    { label: 'Total contributors', value: stats.totalContributors.toLocaleString() },
                    { label: 'Last updated', value: 'Just now' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '10px 14px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: 'hsl(var(--on-surface))' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regional engagement */}
            <div className="panel">
              <div className="ph">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--accent))' }}>location_on</span>
                  Regional engagement
                </span>
              </div>
              <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {regions.map(region => (
                  <div key={region.name} style={{ padding: '10px 12px', border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--container-low))' }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface))', marginBottom: 6 }}>{region.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${region.engagement}%`, background: 'hsl(var(--primary))', borderRadius: 2, transition: 'width 1s ease-out' }} />
                      </div>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: region.engagement > 0 ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))' }}>{region.engagement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar: activity feed */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ph">
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Recent activity
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'hsl(var(--destructive))', display: 'inline-block', animation: 'pulse 1.4s infinite' }} />
              </span>
            </div>

            {/* Time filter */}
            <div style={{ padding: '0 16px 14px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, background: 'hsl(var(--container-low))', padding: 4, borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                {(['day', 'week', 'month', 'year'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setActiveFilter(t); setShowDatePicker(false) }}
                    style={{ height: 30, borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'capitalize', background: activeFilter === t ? '#fff' : 'none', color: activeFilter === t ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))', boxShadow: activeFilter === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                  >{t}</button>
                ))}
              </div>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{ marginTop: 6, width: '100%', height: 30, borderRadius: 4, border: '1px solid hsl(var(--border))', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: showDatePicker || activeFilter === 'custom' ? 'hsl(var(--primary))' : '#fff', color: showDatePicker || activeFilter === 'custom' ? '#fff' : 'hsl(var(--on-surface-muted))' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
                Custom range
              </button>
              {showDatePicker && (
                <div style={{ marginTop: 8, padding: 12, background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    {[{ label: 'Start', key: 'start' }, { label: 'End', key: 'end' }].map(f => (
                      <div key={f.key}>
                        <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', marginBottom: 4 }}>{f.label}</div>
                        <input name="name-488fce" id="input-488fce" type="date" style={{ width: '100%', height: 32, padding: '0 8px', border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} onChange={e => setDateRange(prev => ({ ...prev, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setActiveFilter('custom'); setShowDatePicker(false) }}>Apply filter</button>
                </div>
              )}
            </div>

            {/* Activity list */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activeFilter === 'custom' ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>calendar_today</span>
                  <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                    {dateRange.start || '…'} to {dateRange.end || '…'}
                  </p>
                </div>
              ) : filteredActivity.length > 0 ? filteredActivity.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < filteredActivity.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 4, background: 'rgba(0,107,63,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--primary))', flexShrink: 0 }}>{item.fullName[0]}</div>
                    <div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{item.fullName}</div>
                      <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{item.country} · {new Date(item.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--primary))' }}>₵{item.amount}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))' }}>Verified</div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--on-surface-muted))', opacity: 0.3, display: 'block', marginBottom: 8 }}>analytics</span>
                  <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No activity in this period</p>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border))' }}>
              <button
                onClick={() => setShowFullActivity(true)}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_full</span>
                View full log
              </button>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── Public layout (preserved) ─────────────────────────────────────────────
  return (
    <main className="bg-stone-50/50 min-h-screen font-meta">
      <SEO
        title="Our Impact"
        description="Live analytics reflecting our collective momentum across the nation."
        canonical="/impact"
      />

      {showFullActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm" onClick={() => setShowFullActivity(false)}>
          <div className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-charcoal-dark mb-0">Full Activity Log</h2>
                <p className="text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight">Verified movement contributions</p>
              </div>
              <button onClick={() => setShowFullActivity(false)} className="w-8 h-8 bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-green transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {allActivity.length > 0 ? allActivity.slice(0, 50).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs">{item.fullName[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-charcoal-dark mb-0">{item.fullName}</p>
                      <p className="text-tiny font-bold text-slate-400 mb-0 tracking-tight">{item.country} • {new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-green">₵{item.amount}</p>
                    <p className="text-micro font-semibold text-slate-300">Verified</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-slate-100 block mx-auto mb-4" style={{ fontSize: 48 }}>monitoring</span>
                  <p className="text-sm font-bold text-slate-400 tracking-tight">No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 40 }}>monitoring</span>
              Our Collective Impact
            </h1>
            <div className="bl"><div /><div /><div /></div>
            <p className="text-stone-500 max-w-3xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Live analytics reflecting our collective momentum across the nation.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
          {[
            { label: 'Donations received', value: stats.totalDonations, icon: 'volunteer_activism', trend: '+12%', color: '#006B3F', status: 'No new donations yet today' },
            { label: 'Chapters active', value: stats.activeChapters, icon: 'track_changes', trend: '+2', color: '#DAA520', status: 'Verified' },
            { label: 'Registered Patriots', value: stats.totalMembers, icon: 'groups', trend: '+15%', color: '#22C55E', status: 'National scale' },
            { label: 'Countries reached', value: stats.countriesReached, icon: 'public', trend: 'Global', color: '#3B82F6', status: 'Global' }
          ].map((stat, i) => {
            return (
              <div key={i} className="group hover:shadow-2xl transition-all duration-500 bg-white border border-stone-200 p-8 hover:-translate-y-1">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="w-12 h-12 bg-slate-100" />
                    <div className="h-8 bg-slate-100 w-3/4" />
                    <div className="h-4 bg-slate-100 w-1/2" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-micro font-bold text-slate-400 tracking-tight mb-0">{stat.status}</p>
                      <span className="material-symbols-outlined text-stone-300 group-hover:text-brand-green transition-colors" style={{ fontSize: 14 }}>open_in_new</span>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: stat.color }}>{stat.icon}</span>
                      </div>
                      <span className="text-micro font-bold text-brand-green bg-brand-green/10 px-2 py-1 flex items-center gap-1">
                        {stat.trend} <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
                      </span>
                    </div>
                    <h3 className="text-stone-900 font-bold tracking-tighter leading-tight mb-0">{stat.value}</h3>
                    <p className="text-tiny font-bold text-stone-500 mt-1 mb-0 tracking-tight">{stat.label}</p>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-100 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-charcoal-dark flex items-center gap-2 mb-0">
                    <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 20 }}>monitoring</span> Campaign progress
                  </h2>
                  <p className="text-micro font-bold text-slate-400 mt-1 mb-0 tracking-tight">National Organizing Fund</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-charcoal-dark mb-0">₵{stats.raised.toLocaleString()} <span className="text-slate-300">/ {stats.goal.toLocaleString()}</span></p>
                  <p className="text-micro font-bold text-brand-green mt-1 mb-0 tracking-tight">
                    {Math.round((stats.raised / stats.goal) * 100) >= 1 ? `${Math.round((stats.raised / stats.goal) * 100)}% achieved` : 'Early momentum'}
                  </p>
                </div>
              </div>
              <div className="h-3 bg-slate-100 overflow-hidden border border-slate-200/50 mb-8">
                <div className="h-full bg-brand-green transition-all duration-1000" style={{ width: `${Math.min(100, (stats.raised / stats.goal) * 100)}%` }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Average donation', value: stats.avgDonation },
                  { label: 'Total contributors', value: stats.totalContributors.toLocaleString() },
                  { label: 'Last update', value: 'Just now' },
                ].map(s => (
                  <div key={s.label} className="p-4 bg-slate-50/50 border border-slate-100">
                    <p className="text-micro font-bold text-slate-400 tracking-tight mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-charcoal-dark mb-0">{s.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-100 p-8">
              <h2 className="text-charcoal-dark mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-warm-gold" style={{ fontSize: 20 }}>location_on</span> Regional engagement
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {regions.map(region => (
                  <div key={region.name} className="p-4 border border-slate-100 bg-slate-50/30">
                    <p className="text-micro font-bold text-charcoal-dark tracking-tight">{region.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-100 overflow-hidden">
                        <div className="h-full bg-brand-green transition-all duration-1000" style={{ width: `${region.engagement}%` }} />
                      </div>
                      <span className={cn('text-tiny font-bold', region.engagement > 0 ? 'text-brand-green' : 'text-slate-300')}>{region.engagement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div>
            <section className="bg-white border border-slate-100 p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-charcoal-dark font-bold text-sm mb-0">Recent activity</h5>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse ring-4 ring-red-500/10" />
              </div>
              <div className="flex gap-2 bg-slate-100/80 p-1.5 border border-slate-200/50 mb-6">
                {(['day', 'week', 'month', 'year'] as const).map(t => (
                  <button key={t} onClick={() => { setActiveFilter(t); setShowDatePicker(false) }}
                    className={cn('flex-1 h-8 text-micro font-bold capitalize transition-all', activeFilter === t ? 'bg-white text-brand-green shadow-md' : 'text-slate-400 hover:text-slate-600')}
                  >{t}</button>
                ))}
              </div>
              <div className="space-y-4 overflow-y-auto h-[360px]">
                {filteredActivity.length > 0 ? filteredActivity.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs">{item.fullName[0]}</div>
                      <div>
                        <p className="text-xs font-bold text-charcoal-dark mb-0">{item.fullName}</p>
                        <p className="text-tiny font-bold text-slate-400 mb-0">{item.country} · {new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand-green">₵{item.amount}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-slate-200 mb-3" style={{ fontSize: 32 }}>monitoring</span>
                    <p className="text-micro font-bold text-slate-400">No activity in this period</p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50">
                <button onClick={() => setShowFullActivity(true)} className="w-full h-10 bg-slate-50 hover:bg-brand-green/5 text-slate-400 hover:text-brand-green text-micro font-bold tracking-tight border border-transparent transition-all flex items-center justify-center cursor-pointer">
                  View full activity log <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 8 }}>open_in_new</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
