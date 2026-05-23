/**
 * polls/PollsKPIs.tsx
 * ─────────────────────────────────────────────────────────────────
 * KPI stats strip for the Engagement Hub / Polls page.
 *
 * Displays 4 metric cards sourced from PollStats:
 *  1. Total Engagements      — Total campaign participation count
 *  2. National Sentiment     — Positive sentiment threshold score (%)
 *  3. Avg Response Time      — Engagement velocity (time to respond)
 *  4. Feedback Rate          — Overall quality score of engagement
 *
 * Each card has a left-border color accent per design system.
 *
 * Props:
 *  stats — PollStats object fetched from adminService.getPollStats()
 *           or null while loading (renders zeros/N/A)
 *
 * Data source: public.poll_stats (via adminService.getPollStats)
 */

import type { PollStats } from '@/services/adminService'

interface PollsKPIsProps {
  stats: PollStats | null
}

export function PollsKPIs({ stats }: PollsKPIsProps) {
  const kpis = [
    {
      label: 'Total engagements',
      value: String(stats?.totalEngagements || 0),
      sub: 'Campaign participation',
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'National sentiment',
      value: `${stats?.nationalSentimentScore || 0}%`,
      sub: 'Positive threshold',
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Avg response time',
      value: String(stats?.avgResponseTime || 'N/A'),
      sub: 'Engagement velocity',
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Feedback rate',
      value: String(stats?.feedbackRate || '0%'),
      sub: 'Quality score',
      bar: 'hsl(var(--on-surface))',
    },
  ]

  return (
    <div className="kpis">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}
        >
          {/* Left color accent bar */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: kpi.bar,
            }}
          />

          {/* Label */}
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 6px',
            }}
          >
            {kpi.label}
          </p>

          {/* Main value */}
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 'var(--kpi-num-size)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 4px',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {kpi.value}
          </p>

          {/* Sub-label */}
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            {kpi.sub}
          </p>
        </div>
      ))}
    </div>
  )
}
