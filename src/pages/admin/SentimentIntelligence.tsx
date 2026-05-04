import { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  Map, 
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { adminService } from '@/services/adminService'
import type { MemberFeedback, SentimentTelemetry, ImpactProjection } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function SentimentIntelligence() {
  const [feedback, setFeedback] = useState<MemberFeedback[]>([])
  const [telemetry, setTelemetry] = useState<SentimentTelemetry[]>([])
  const [projections, setProjections] = useState<ImpactProjection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIntelligence() {
      setLoading(true)
      try {
        const [fbData, telData, projData] = await Promise.all([
          adminService.getMemberFeedback(),
          adminService.getSentimentTelemetry(),
          adminService.getImpactProjections()
        ])
        setFeedback(fbData)
        setTelemetry(telData)
        setProjections(projData)
      } catch (error) {
        console.error('[INTELLIGENCE] Failed to fetch sentiment data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchIntelligence()
  }, [])

  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return 'text-[var(--brand-green)] bg-emerald-50'
    if (score <= -0.5) return 'text-[var(--brand-red)] bg-red-50'
    return 'text-stone-500 bg-stone-100'
  }

  const getSentimentLabel = (score: number) => {
    if (score >= 0.5) return 'Positive'
    if (score <= -0.5) return 'Critical'
    return 'Neutral'
  }

  const nationalScore = telemetry.length > 0 
    ? telemetry.reduce((acc, curr) => acc + curr.avg_sentiment, 0) / telemetry.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-[var(--brand-red)] animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Initializing AI Intelligence Core...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🧠 Intelligence Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-12 bg-[var(--brand-red)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-red)]">AI Analytics</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-stone-900 font-meta italic uppercase flex items-center gap-4">
            Sentiment <span className="text-stone-400">Intelligence</span>
            <Brain className="w-10 h-10 text-[var(--brand-red)] animate-pulse" />
          </h1>
          <p className="text-stone-400 text-sm font-medium tracking-wide max-w-xl mt-2">
            Real-time predictive polling and national mood analysis powered by movement telemetry.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">National Pulse Index</span>
          <div className="flex items-center gap-3">
            <span className={cn(
              "text-3xl font-black italic tracking-tighter",
              nationalScore >= 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
            )}>
              {(nationalScore * 100).toFixed(1)}
            </span>
            <Activity className={cn("w-6 h-6", nationalScore >= 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📊 Predictive Polling Projections */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic">Predictive Impact Projections</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">30-Day Mobilization Forecast</CardDescription>
                </div>
                <Target className="w-4 h-4 text-stone-400" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {projections.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No Projections Available</p>
                  </div>
                ) : (
                  projections.map((proj) => (
                    <div key={proj.id} className="relative pt-2">
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-stone-900">{proj.region}</h4>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Projected Reach</span>
                          <p className="text-sm font-black text-[var(--brand-red)] italic">{proj.projected_reach_30d.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-stone-800 transition-all duration-1000" 
                          style={{ width: `${(proj.current_reach / proj.projected_reach_30d) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-[var(--brand-red)] opacity-50 animate-pulse transition-all duration-1000" 
                          style={{ width: `${((proj.projected_reach_30d - proj.current_reach) / proj.projected_reach_30d) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                          <Zap className="w-3 h-3" /> +{proj.mobilization_velocity}/day
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                          Confidence: {(proj.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regional Heatmap Telemetry */}
          <Card className="rounded-none border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-stone-800 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic text-white">Regional Sentiment Heatmap</CardTitle>
                <Map className="w-4 h-4 text-stone-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-stone-800">
                {telemetry.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Awaiting telemetry data...</p>
                  </div>
                ) : (
                  telemetry.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{t.region}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1 text-[9px] font-bold text-stone-500">
                          <span className="text-emerald-400">{t.positive_count}</span> / 
                          <span className="text-stone-400">{t.neutral_count}</span> / 
                          <span className="text-red-400">{t.negative_count}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
                          getSentimentColor(t.avg_sentiment)
                        )}>
                          {getSentimentLabel(t.avg_sentiment)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 💬 Live Feedback Stream */}
        <div className="lg:col-span-1">
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic">Live Patriot Feed</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Raw sentiment intercepts</CardDescription>
                </div>
                <MessageSquare className="w-4 h-4 text-stone-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100 max-h-[800px] overflow-y-auto">
                {feedback.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No feedback intercepted</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-stone-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5",
                          getSentimentColor(item.sentiment_score)
                        )}>
                          {item.category}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">{format(new Date(item.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <p className="text-sm text-stone-700 italic mb-3 leading-relaxed">"{item.feedback_text}"</p>
                      <div className="flex items-center gap-2">
                        <Map className="w-3 h-3 text-stone-300" />
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{item.region}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
