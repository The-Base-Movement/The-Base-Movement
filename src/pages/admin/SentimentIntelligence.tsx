import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { MemberFeedback, SentimentIntelligence as SentimentMetrics, ImpactProjection } from '@/types/admin'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

export default function SentimentIntelligence() {
  const [feedback, setFeedback] = useState<MemberFeedback[]>([])
  const [sentimentMetrics, setSentimentMetrics] = useState<SentimentMetrics[]>([])
  const [projections, setProjections] = useState<ImpactProjection[]>([])
  const [loading, setLoading] = useState(true)

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
    if (score >= 0.5) return { color: 'hsl(var(--primary))', bg: 'rgba(0, 168, 89, 0.1)' }
    if (score <= -0.5) return { color: 'hsl(var(--destructive))', bg: 'rgba(206, 17, 38, 0.1)' }
    return { color: 'hsl(var(--on-surface-muted))', bg: 'rgba(0, 0, 0, 0.05)' }
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
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'hsl(var(--primary))' }}>sync</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>Initializing AI intelligence core...</p>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>psychology</span>
            Sentiment intelligence
          </h2>
          <div style={{ marginTop: 12 }}><div className="bl"><div /><div /><div /></div></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            AI-powered member sentiment tracking and mobilization impact forecasting.
          </p>
        </div>
        <div className="actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>National average</span>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 18, color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                {(nationalScore * 100).toFixed(1)}
              </span>
            </div>
            <span className="material-symbols-outlined" style={{ color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>monitoring</span>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => toast.success("Analysis started: Aggregating regional sentiment data...")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>query_stats</span>
            Run AI Analysis
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => toast.success("Report exported: Your intelligence briefing is ready.")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
            Export Briefing
          </button>
        </div>
      </div>

      <div className="kpis">
        <TacticalKPI 
          label="National Score"
          value={(nationalScore * 100).toFixed(1)}
          description="Average sentiment"
          variant="black"
        />
        <TacticalKPI 
          label="Total Intercepts"
          value={feedback.length}
          description="Member feedback"
          variant="gold"
        />
        <TacticalKPI 
          label="Critical Alerts"
          value={sentimentMetrics.reduce((s, m) => s + m.negative_count, 0)}
          description="Requires attention"
          variant="red"
        />
        <TacticalKPI 
          label="Projected Reach"
          value={projections.reduce((s, p) => s + p.projected_reach_30d, 0).toLocaleString()}
          description="30-day forecast"
          variant="green"
        />
      </div>

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Impact Forecasts */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface))' }}>Impact forecasts</span>
                <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>30-day mobilization projections</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>target</span>
            </div>
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
              {projections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))', opacity: 0.2, marginBottom: 12 }}>bar_chart</span>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No projection data available.</p>
                </div>
              ) : (
                projections.map((proj) => (
                  <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h4 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, color: 'hsl(var(--on-surface))' }}>{proj.region}</h4>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>Projected reach</span>
                        <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 16, color: 'hsl(var(--destructive))' }}>{proj.projected_reach_30d.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'hsl(var(--container-low))', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                      <div 
                        style={{ height: '100%', background: 'hsl(var(--primary))', width: `${(proj.current_reach / proj.projected_reach_30d) * 100}%` }}
                      />
                      <div 
                        className="animate-pulse"
                        style={{ height: '100%', background: 'rgba(206, 17, 38, 0.5)', width: `${((proj.projected_reach_30d - proj.current_reach) / proj.projected_reach_30d) * 100}%` }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
                        +{proj.mobilization_velocity}/day
                      </span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                        Confidence: {(proj.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Regional Metrics */}
          <div className="panel" style={{ padding: 0, overflow: 'hidden', background: 'hsl(var(--on-surface))', color: '#fff' }}>
            <div className="ph" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Regional metrics</span>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)' }}>map</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {sentimentMetrics.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>No regional data available.</p>
                </div>
              ) : (
                sentimentMetrics.map(t => (
                  <div key={t.id} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12 }}>{t.region}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ display: 'flex', gap: 8, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10 }}>
                        <span style={{ color: 'hsl(var(--primary))' }}>{t.positive_count}</span>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t.neutral_count}</span>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
                        <span style={{ color: 'hsl(var(--destructive))' }}>{t.negative_count}</span>
                      </div>
                      <span className="pill" style={{ 
                        background: getSentimentColor(t.avg_sentiment).bg, 
                        color: getSentimentColor(t.avg_sentiment).color,
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        minWidth: 70,
                        textAlign: 'center'
                      }}>
                        {getSentimentLabel(t.avg_sentiment)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Feedback Stream */}
        <aside style={{ width: 400, flexShrink: 0 }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
            <div className="ph" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface))' }}>Live feedback</span>
                <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>Direct member sentiment</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>message</span>
            </div>
            <div style={{ maxHeight: 800, overflowY: 'auto' }}>
              {feedback.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No feedback intercepted.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.id} style={{ padding: 24, borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="pill" style={{ 
                        background: getSentimentColor(item.sentiment_score).bg, 
                        color: getSentimentColor(item.sentiment_score).color,
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: 'uppercase'
                      }}>
                        {item.category}
                      </span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{format(new Date(item.created_at), 'HH:mm')}</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>
                      {item.feedback_text || "Sentiment intercept recorded without textual content."}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}>location_on</span>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{item.region}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
