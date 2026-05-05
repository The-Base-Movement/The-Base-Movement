import { useState, useEffect } from 'react'
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Map, 
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { MemberFeedback, SentimentTelemetry, ImpactProjection } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export default function SentimentIntelligence() {
  const [feedback, setFeedback] = useState<MemberFeedback[]>([])
  const [telemetry, setTelemetry] = useState<SentimentTelemetry[]>([])
  const [projections, setProjections] = useState<ImpactProjection[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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
          <p className="text-[10px] font-bold normal-case text-stone-400">Initializing ai intelligence core...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-stone-900" />
            Sentiment analysis
          </h1>
          <p className="text-stone-500 text-sm mt-1">AI-powered member sentiment tracking across all regions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white border border-stone-100 rounded-xl shadow-sm">
            <div className="text-right">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Average sentiment</span>
              <span className={cn(
                "text-lg font-bold tracking-tight",
                nationalScore >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {(nationalScore * 100).toFixed(1)}
              </span>
            </div>
            <Activity className={cn("w-5 h-5", nationalScore >= 0 ? "text-emerald-500" : "text-red-500")} />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all"
              onClick={() => toast({ title: "Analysis started", description: "Aggregating regional sentiment data..." })}
            >
              Run analysis
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all"
              onClick={() => toast({ title: "Report exported", description: "Your intelligence briefing is ready for download." })}
            >
              Export report
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📊 Predictive Polling Projections */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta">Impact forecasts</CardTitle>
                  <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">30-day mobilization projections</CardDescription>
                </div>
                <Target className="w-4 h-4 text-stone-400" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {projections.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-stone-400 normal-case">No data yet. Projections appear after 30 days of member activity.</p>
                  </div>
                ) : (
                  projections.map((proj) => (
                    <div key={proj.id} className="relative pt-2">
                      <div className="flex justify-between items-end mb-2">
                        <h4 className="text-[11px] font-bold normal-case text-stone-900">{proj.region}</h4>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-400 normal-case">Projected reach</span>
                          <p className="text-sm font-black text-[var(--brand-red)]">{proj.projected_reach_30d.toLocaleString()}</p>
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
                        <span className="text-[9px] font-bold text-stone-400 normal-case flex items-center gap-1">
                          <Zap className="w-3 h-3" /> +{proj.mobilization_velocity}/day
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 normal-case">
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
          <Card className="rounded-xl border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-stone-800 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta text-white">Regional sentiment</CardTitle>
                <Map className="w-4 h-4 text-stone-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-stone-800">
                {telemetry.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-500 normal-case">No regional data available yet.</p>
                  </div>
                ) : (
                  telemetry.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-stone-800/50 transition-colors">
                      <span className="text-[10px] font-bold normal-case">{t.region}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1 text-[9px] font-bold text-stone-500">
                          <span className="text-emerald-400">{t.positive_count}</span> / 
                          <span className="text-stone-400">{t.neutral_count}</span> / 
                          <span className="text-red-400">{t.negative_count}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-bold normal-case rounded-full",
                          getSentimentColor(t.avg_sentiment)
                        )}>
                          {getSentimentLabel(t.avg_sentiment).toLowerCase()}
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
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta">Live feedback</CardTitle>
                  <CardDescription className="text-[10px] font-bold normal-case text-stone-400 mt-1">Direct member sentiment</CardDescription>
                </div>
                <MessageSquare className="w-4 h-4 text-stone-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100 max-h-[800px] overflow-y-auto">
                {feedback.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-400 normal-case">No feedback intercepted</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-stone-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          getSentimentColor(item.sentiment_score)
                        )}>
                          {item.category.toLowerCase()}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">{format(new Date(item.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <p className="text-sm text-stone-700 mb-3 leading-relaxed">
                        {item.feedback_text || (item as MemberFeedback & { content?: string; text?: string }).content || (item as MemberFeedback & { content?: string; text?: string }).text || "Sentiment intercept recorded without textual content."}
                      </p>
                      <div className="flex items-center gap-2">
                        <Map className="w-3 h-3 text-stone-300" />
                        <span className="text-[9px] font-bold text-stone-500 normal-case">{item.region}</span>
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
