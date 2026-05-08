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
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { MemberFeedback, SentimentIntelligence, ImpactProjection } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { BrandLine } from '@/components/ui/BrandLine'

export default function SentimentIntelligence() {
  const [feedback, setFeedback] = useState<MemberFeedback[]>([])
  const [sentimentMetrics, setSentimentMetrics] = useState<SentimentIntelligence[]>([])
  const [projections, setProjections] = useState<ImpactProjection[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchIntelligence() {
      setLoading(true)
      try {
        const [fbData, telData, projData] = await Promise.all([
          adminService.getMemberFeedback(),
          adminService.getSentimentIntelligence(),
          adminService.getImpactProjections()
        ])
        setFeedback(fbData)
        setSentimentMetrics(telData)
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
    if (score >= 0.5) return 'text-primary bg-primary/10'
    if (score <= -0.5) return 'text-destructive bg-destructive/10'
    return 'text-muted-foreground/80 bg-muted/30'
  }

  const getSentimentLabel = (score: number) => {
    if (score >= 0.5) return 'Positive'
    if (score <= -0.5) return 'Critical'
    return 'Neutral'
  }

  const nationalScore = sentimentMetrics.length > 0 
    ? sentimentMetrics.reduce((acc, curr) => acc + curr.avg_sentiment, 0) / sentimentMetrics.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border/40 border-t-destructive animate-spin" />
          <p className="text-micro font-bold normal-case text-primary">Initializing AI intelligence core...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex-columns items-center flex-between" style={{ '--column-gap': '2rem' } as React.CSSProperties}>
        <div className="flow" style={{ '--flow-space': '0.5rem' } as React.CSSProperties}>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta m-0">
            <Brain className="w-8 h-8 text-on-surface" />
            Sentiment intelligence
          </h1>
          <BrandLine />
          <p className="text-muted-foreground/80 text-sm mb-0">AI-powered member sentiment tracking and mobilization impact forecasting.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white border border-border/40 rounded-sm shadow-sm">
            <div className="text-right flow" style={{ '--flow-space': '0.1em' } as React.CSSProperties}>
              <span className="text-micro font-bold text-muted-foreground/40 block normal-case mb-0">National average</span>
              <span className={cn(
                "text-lg font-bold tracking-tight m-0",
                nationalScore >= 0 ? "text-primary" : "text-brand-red"
              )}>
                {(nationalScore * 100).toFixed(1)}
              </span>
            </div>
            <Activity className={cn("w-5 h-5", nationalScore >= 0 ? "text-primary" : "text-brand-red")} />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="primary"
              size="lg"
              className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => toast({ title: "Analysis started", description: "Aggregating regional sentiment data..." })}
            >
              <Activity className="w-4 h-4 mr-2" /> Run AI Analysis
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="rounded-sm border-border/40 text-on-surface/80 text-micro px-10 h-12 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm active:scale-95"
              onClick={() => toast({ title: "Report exported", description: "Your intelligence briefing is ready for download." })}
            >
              <BarChart3 className="w-4 h-4 mr-2" /> Export Briefing
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-columns items-start" style={{ '--column-gap': '2rem', '--column-breakpoint': '120ch' } as React.CSSProperties}>
        <div className="flex-[2] min-w-0 flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
          <Card className="rounded-sm border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                  <CardTitle className="text-xs font-bold text-on-surface m-0">Impact forecasts</CardTitle>
                  <CardDescription className="text-micro font-bold text-muted-foreground/40 m-0">30-day mobilization projections</CardDescription>
                </div>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {projections.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-8 h-8 text-muted mx-auto mb-3" />
                    <p className="text-micro font-bold text-muted-foreground normal-case tracking-tight">No data yet. Projections appear after 30 days of activity.</p>
                  </div>
                ) : (
                  projections.map((proj) => (
                    <div key={proj.id} className="relative flow" style={{ '--flow-space': '0.5rem' } as React.CSSProperties}>
                      <div className="flex justify-between items-end">
                        <h4 className="text-tiny font-bold text-on-surface m-0">{proj.region}</h4>
                        <div className="text-right">
                          <span className="text-micro font-bold text-muted-foreground/40">Projected reach</span>
                          <p className="text-sm font-bold text-brand-red m-0">{proj.projected_reach_30d.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${(proj.current_reach / proj.projected_reach_30d) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-destructive/50 animate-pulse transition-all duration-1000" 
                          style={{ width: `${((proj.projected_reach_30d - proj.current_reach) / proj.projected_reach_30d) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-micro font-bold text-muted-foreground normal-case tracking-tight flex items-center gap-1">
                          <Zap className="w-3 h-3" /> +{proj.mobilization_velocity}/day
                        </span>
                        <span className="text-micro font-bold text-muted-foreground normal-case tracking-tight">
                          Confidence: {(proj.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regional Sentiment Intelligence */}
          <Card className="rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-white/10 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta text-white m-0">Regional metrics</CardTitle>
                <Map className="w-4 h-4 text-muted-foreground/80" />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-white/10 max-h-[400px] overflow-y-auto sidebar-scroll">
                {sentimentMetrics.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-micro font-bold text-muted-foreground/80 normal-case mb-0">No regional data available yet.</p>
                  </div>
                ) : (
                  sentimentMetrics.map(t => (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <span className="text-micro font-bold normal-case">{t.region}</span>
                      <div className="flex items-center gap-6">
                        <div className="flex gap-2 text-micro font-bold text-white/40">
                          <span className="text-primary">{t.positive_count}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-white/40">{t.neutral_count}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-brand-red">{t.negative_count}</span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 text-micro font-bold normal-case rounded-full min-w-[70px] text-center",
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
        <div className="flex-1 min-w-0">
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                  <CardTitle className="text-xs font-bold normal-case font-meta m-0">Live feedback</CardTitle>
                  <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 m-0">Direct member sentiment</CardDescription>
                </div>
                <MessageSquare className="w-4 h-4 text-muted-foreground/80" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-[850px] overflow-y-auto">
                {feedback.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-micro font-bold text-muted-foreground/80 normal-case mb-0">No feedback intercepted</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors flow" style={{ '--flow-space': '0.75rem' } as React.CSSProperties}>
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2.5 py-1 rounded-full",
                          getSentimentColor(item.sentiment_score)
                        )}>
                          {item.category.toLowerCase()}
                        </span>
                        <span className="text-micro font-bold text-muted-foreground/40">{format(new Date(item.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-[13px] text-on-surface/90 m-0 leading-relaxed font-medium">
                        {item.feedback_text || (item as MemberFeedback & { content?: string; text?: string }).content || (item as MemberFeedback & { content?: string; text?: string }).text || "Sentiment intercept recorded without textual content."}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Map className="w-3 h-3 text-muted-foreground/20" />
                        <span className="text-micro font-bold text-muted-foreground/40 normal-case">{item.region}</span>
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
