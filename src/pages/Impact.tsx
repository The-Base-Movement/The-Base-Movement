import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Target, Users, Heart, TrendingUp, ArrowUpRight, MapPin, Activity, Calendar, X } from 'lucide-react'
import { Button } from '../components/ui/neon-button'

const impactStats = [
  { icon: Heart, label: 'Donations Received', value: 'GHS 128,450', color: 'var(--brand-red)', trend: '+GHS 4,280 today' },
  { icon: Target, label: 'Chapters Active', value: '76', color: 'var(--brand-gold)', trend: 'Growing rapidly' },
  { icon: Users, label: 'Members Joined', value: '355,482', color: 'var(--brand-black)', trend: '+12,450 this month' },
  { icon: TrendingUp, label: 'Countries Reached', value: '32', color: 'var(--brand-green)', trend: 'Global Network' }
]

const recentContributions = {
  day: [
    { id: 1, name: 'Anonymous', amount: 'GHS 500', time: '2 mins ago', location: 'Accra, GH' },
    { id: 2, name: 'K. Ofori', amount: 'GHS 2,500', time: '15 mins ago', location: 'London, UK' },
    { id: 3, name: 'M. Mensah', amount: 'GHS 150', time: '45 mins ago', location: 'Kumasi, GH' },
    { id: 4, name: 'S. Addo', amount: 'GHS 1,000', time: '1 hour ago', location: 'New York, US' }
  ],
  week: [
    { id: 10, name: 'Global Outreach', amount: 'GHS 8,400', time: '3 days ago', location: 'Multiple' },
    { id: 11, name: 'B. Boateng', amount: 'GHS 1,200', time: '5 days ago', location: 'Sunyani, GH' },
    { id: 12, name: 'E. Appiah', amount: 'GHS 5,000', time: '6 days ago', location: 'Cape Coast, GH' }
  ],
  month: [
    { id: 5, name: 'Diaspora Group', amount: 'GHS 15,000', time: '2 days ago', location: 'Multiple' },
    { id: 6, name: 'L. Tetteh', amount: 'GHS 3,000', time: '1 week ago', location: 'Tema, GH' },
    { id: 7, name: 'A. Baako', amount: 'GHS 750', time: '2 weeks ago', location: 'Ho, GH' }
  ],
  year: [
    { id: 8, name: 'Vision 2026 Fund', amount: 'GHS 45,000', time: 'Jan 2026', location: 'Accra, GH' },
    { id: 9, name: 'Chapter Support', amount: 'GHS 22,000', time: 'Feb 2026', location: 'Global' }
  ]
}

export default function Impact() {
  const [activeFilter, setActiveFilter] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [regions, setRegions] = useState([
    { name: 'Greater Accra', engagement: 92 },
    { name: 'Ashanti', engagement: 88 },
    { name: 'Western', engagement: 74 },
    { name: 'Northern', engagement: 65 }
  ])

  // Simulate live data updates for regions
  useEffect(() => {
    const interval = setInterval(() => {
      setRegions(prev => prev.map(r => ({
        ...r,
        engagement: Math.min(100, Math.max(0, r.engagement + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2)))
      })))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const [showFullActivity, setShowFullActivity] = useState(false)

  return (
    <div className="bg-stone-50/50 min-h-screen font-meta">
      {/* Full Activity Modal */}
      {showFullActivity && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowFullActivity(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-charcoal-dark mb-0">Full Activity Log</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 mb-0 uppercase tracking-widest">Verified movement contributions</p>
              </div>
              <button 
                onClick={() => setShowFullActivity(false)}
                className="w-8 h-8 rounded-none bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[var(--brand-green)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {[...recentContributions.day, ...recentContributions.week, ...recentContributions.month].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-50 rounded-none hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-none bg-[var(--brand-green)]/10 flex items-center justify-center text-[var(--brand-green)] font-bold text-xs">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-charcoal-dark mb-0">{item.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 mb-0 uppercase tracking-wider">{item.location} • {item.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--brand-green)]">{item.amount}</p>
                    <p className="text-[10px] font-semibold text-slate-300">Verified</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-400 italic">
                This log is updated in real-time. Showing latest 50 records.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ... Hero section remains ... */}
      <section className="relative overflow-hidden bg-charcoal-dark pt-20 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--brand-green)]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-warm-gold/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-none mb-6">
            <span className="w-2 h-2 bg-[var(--brand-green)] rounded-full animate-pulse"></span>
            <span className="text-[10px] text-white/60 font-bold">Live Movement Metrics</span>
          </div>
          <h1 className="text-white tracking-tight mb-4">
            Our Collective <span className="text-[var(--brand-green)]">Impact</span>
          </h1>
          <div className="flex h-1 w-24 mx-auto mb-6">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          <p className="text-white/60 max-w-2xl mx-auto mb-0 leading-relaxed font-medium">
            Real-time data reflecting the pulse of "The Base" movement. Every registration and contribution brings us closer to a unified, prosperous Ghana.
          </p>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-20">
        {/* ... Stats section remains ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {impactStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all duration-300 group overflow-hidden bg-white rounded-none">
                <CardContent className="p-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="w-12 h-12 rounded-none flex items-center justify-center group-hover:rotate-6 transition-transform"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-[var(--brand-green)] bg-[var(--brand-green)]/10 px-2 py-1 rounded-none flex items-center gap-1">
                      {stat.trend} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h3 className="text-charcoal-dark leading-tight mb-0">{stat.value}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-0">{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ... Left Column remains ... */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-charcoal-dark flex items-center gap-2 mb-0">
                    <Activity className="w-5 h-5 text-[var(--brand-green)]" />
                    Campaign Progress
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-1 mb-0 uppercase tracking-widest">Movement Operations Fund</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-charcoal-dark mb-0">GHS 128,450 <span className="text-slate-300">/ 500,000</span></p>
                  <p className="text-[10px] font-bold text-[var(--brand-green)] mt-1 mb-0 uppercase tracking-widest">26% Towards Goal</p>
                </div>
              </div>

              <div className="relative h-4 bg-slate-100 rounded-none overflow-hidden mb-12">
                <div className="absolute top-0 left-0 h-full bg-[var(--brand-green)] w-[26%] shadow-[0_0_15px_rgba(0,107,60,0.4)] relative">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Average Donation</p>
                  <p className="text-lg font-bold text-charcoal-dark mb-0">GHS 361.20</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Contributors</p>
                  <p className="text-lg font-bold text-charcoal-dark mb-0">1,244</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                  <p className="text-lg font-bold text-charcoal-dark mb-0">Just Now</p>
                </div>
              </div>
            </section>

            {/* Geographical Spread */}
            <section className="bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40">
              <h2 className="text-charcoal-dark mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-warm-gold" />
                Regional Engagement
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {regions.map(region => (
                  <div key={region.name} className="p-4 border border-slate-100 rounded-none hover:border-[var(--brand-green)]/30 transition-all cursor-default">
                    <p className="text-sm font-bold text-charcoal-dark uppercase">{region.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-none overflow-hidden">
                        <div 
                          className="h-full bg-[var(--brand-green)] transition-all duration-1000" 
                          style={{ width: `${region.engagement}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-[var(--brand-green)] uppercase">{region.engagement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Live Feed */}
          <div className="space-y-8">
            <section className="bg-white rounded-none border border-slate-100 p-8 shadow-xl shadow-slate-200/40 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h5 className="text-charcoal-dark mb-0">Recent Activity</h5>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping shrink-0"></span>
              </div>

              {/* Filter Tabs & Calendar */}
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                  <div className="flex-1 flex gap-1 bg-slate-50 p-1">
                    {(['day', 'week', 'month', 'year'] as const).map((t) => (
                      <Button
                        key={t}
                        variant={activeFilter === t ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setActiveFilter(t);
                          setShowDatePicker(false);
                        }}
                        className={`flex-1 py-2 ${activeFilter === t ? 'shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant={showDatePicker || activeFilter === 'custom' ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`w-10 h-10 border shrink-0 ${showDatePicker || activeFilter === 'custom' ? 'shadow-lg shadow-brand-green/20' : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'}`}
                    title="Custom Range"
                  >
                    <Calendar className={`w-4 h-4 ${showDatePicker || activeFilter === 'custom' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  </Button>
                </div>

                {/* Date Picker Dropdown (Conditional) */}
                {showDatePicker && (
                  <div className="p-4 bg-slate-50 rounded-none border border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-200 rounded-none p-2 text-xs font-meta font-semibold text-charcoal-dark focus:ring-1 focus:ring-brand-green outline-none" 
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-200 rounded-md p-2 text-xs font-meta font-semibold text-charcoal-dark focus:ring-1 focus:ring-brand-green outline-none" 
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        setActiveFilter('custom');
                        setShowDatePicker(false);
                      }}
                      className="w-full mt-4 text-[9px] h-10"
                    >
                      Apply Filter
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6 flex-1">
                {activeFilter === 'custom' ? (
                  <div className="text-center py-12 px-6 bg-slate-50/50 rounded-none border border-dashed border-slate-200">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-400 leading-loose mb-0">
                      Showing results for:<br/>
                      <span className="text-[var(--brand-green)] font-bold">{dateRange.start || '...'}</span> to <span className="text-[var(--brand-green)] font-bold">{dateRange.end || '...'}</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 mb-0 uppercase tracking-widest">No records found for this specific range.</p>
                  </div>
                ) : (
                  recentContributions[activeFilter].map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-none bg-slate-50 flex items-center justify-center text-[var(--brand-green)] font-semibold text-xs shrink-0 group-hover:bg-[var(--brand-green)] group-hover:text-white transition-colors">
                        {item.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-charcoal-dark truncate">{item.name}</p>
                          <span className="text-[11px] font-bold text-[var(--brand-green)] bg-[var(--brand-green)]/5 px-2 py-0.5 rounded-none">
                            {item.amount}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5 mb-0 uppercase tracking-wider">
                          {item.location} • {item.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="ghost"
                onClick={() => setShowFullActivity(true)}
                className="mt-auto w-full py-8 bg-slate-50 border-transparent hover:bg-brand-green/5 hover:text-brand-green group"
              >
                View Full Activity Log
                <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}
