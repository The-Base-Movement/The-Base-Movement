import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type {
  MemberFeedback,
  SentimentIntelligence as SentimentMetrics,
  ImpactProjection,
} from '@/types/admin'
import { supabase } from '@/lib/supabase'

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

  const fetchIntelligence = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
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
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIntelligence()
    }, 0)

    // Establish live websocket logical replication subscription
    const channel = supabase
      .channel('sentiment-intelligence-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'member_feedback' }, () => {
        fetchIntelligence(true)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchIntelligence(true)
      })
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
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

      {/* 2/3 + 1/3 layout: forecasts main, aside for metrics & feedback */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Main: Impact Forecasts */}
        <SentimentImpactForecasts projections={projections} />

        {/* Aside: Regional Metrics + Live Feedback stacked */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SentimentRegionalMetrics sentimentMetrics={sentimentMetrics} />
          <SentimentLiveFeedback feedback={feedback} />
        </aside>
      </div>
    </div>
  )
}
