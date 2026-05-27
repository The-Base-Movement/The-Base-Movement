import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type {
  MemberFeedback,
  SentimentIntelligence as SentimentMetrics,
  ImpactProjection,
} from '@/types/admin'

// Modular imports
import { SentimentHeader } from './sentimentintelligence/SentimentHeader'
import { SentimentKPIs } from './sentimentintelligence/SentimentKPIs'
import { SentimentImpactForecasts } from './sentimentintelligence/SentimentImpactForecasts'
import { SentimentRegionalMetrics } from './sentimentintelligence/SentimentRegionalMetrics'
import { SentimentLiveFeedback } from './sentimentintelligence/SentimentLiveFeedback'
import { DotLoader } from '@/components/states'

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
          adminService.getImpactProjections(),
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

  const nationalScore =
    sentimentMetrics.length > 0
      ? sentimentMetrics.reduce((acc, curr) => acc + curr.avg_sentiment, 0) /
        sentimentMetrics.length
      : 0

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <DotLoader label="Initializing AI intelligence core…" />
      </div>
    )
  }

  const criticalAlerts = sentimentMetrics.reduce((s, m) => s + m.negative_count, 0)
  const projectedReach = projections.reduce((s, p) => s + p.projected_reach_30d, 0)

  return (
    <div className="main">
      <SentimentHeader nationalScore={nationalScore} />

      <SentimentKPIs
        nationalScore={nationalScore}
        feedbackLength={feedback.length}
        criticalAlerts={criticalAlerts}
        projectedReach={projectedReach}
      />

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Impact Forecasts */}
          <SentimentImpactForecasts projections={projections} />

          {/* Regional Metrics */}
          <SentimentRegionalMetrics sentimentMetrics={sentimentMetrics} />
        </div>

        {/* Live Feedback Stream */}
        <SentimentLiveFeedback feedback={feedback} />
      </div>
    </div>
  )
}
