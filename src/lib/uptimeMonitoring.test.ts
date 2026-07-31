import { describe, expect, it } from 'vitest'

import { summarizeUptimeChecks } from './uptimeMonitoring'

describe('summarizeUptimeChecks', () => {
  it('estimates uptime and downtime over the monitored window', () => {
    const summary = summarizeUptimeChecks(
      [
        { checkedAt: '2026-07-31T10:00:00.000Z', ok: true, statusCode: 200, latencyMs: 180 },
        { checkedAt: '2026-07-31T10:05:00.000Z', ok: false, statusCode: 503, latencyMs: null },
        { checkedAt: '2026-07-31T10:10:00.000Z', ok: true, statusCode: 200, latencyMs: 190 },
      ],
      {
        now: '2026-07-31T10:15:00.000Z',
        intervalSeconds: 300,
      }
    )

    expect(summary.currentStatus).toBe('up')
    expect(summary.observedUptimePercentage).toBeCloseTo(66.67, 2)
    expect(summary.estimatedDowntimeSeconds).toBe(300)
    expect(summary.currentStatusDurationSeconds).toBe(300)
    expect(summary.totalChecks).toBe(3)
  })

  it('reports an active downtime streak when the latest check is failing', () => {
    const summary = summarizeUptimeChecks(
      [
        { checkedAt: '2026-07-31T10:00:00.000Z', ok: true, statusCode: 200, latencyMs: 140 },
        { checkedAt: '2026-07-31T10:05:00.000Z', ok: false, statusCode: 504, latencyMs: null },
        { checkedAt: '2026-07-31T10:10:00.000Z', ok: false, statusCode: 504, latencyMs: null },
      ],
      {
        now: '2026-07-31T10:14:00.000Z',
        intervalSeconds: 300,
      }
    )

    expect(summary.currentStatus).toBe('down')
    expect(summary.currentStatusDurationSeconds).toBe(540)
    expect(summary.failedChecks).toBe(2)
    expect(summary.lastStatusCode).toBe(504)
  })
})
