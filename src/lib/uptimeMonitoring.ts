export interface UptimeCheckSample {
  checkedAt: string
  ok: boolean
  statusCode: number | null
  latencyMs: number | null
  errorMessage?: string | null
}

export interface UptimeSummary {
  currentStatus: 'up' | 'down' | 'unknown'
  currentStatusDurationSeconds: number
  observedUptimePercentage: number | null
  estimatedDowntimeSeconds: number
  uptimeSeconds: number
  totalObservedSeconds: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  monitoringStartedAt: string | null
  lastCheckedAt: string | null
  lastStatusCode: number | null
  intervalSeconds: number
  recentChecks: UptimeCheckSample[]
}

interface SummarizeOptions {
  now?: string | number | Date
  intervalSeconds?: number
}

const EMPTY_SUMMARY: UptimeSummary = {
  currentStatus: 'unknown',
  currentStatusDurationSeconds: 0,
  observedUptimePercentage: null,
  estimatedDowntimeSeconds: 0,
  uptimeSeconds: 0,
  totalObservedSeconds: 0,
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  monitoringStartedAt: null,
  lastCheckedAt: null,
  lastStatusCode: null,
  intervalSeconds: 300,
  recentChecks: [],
}

function toMillis(value: string | number | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

export function summarizeUptimeChecks(
  checks: UptimeCheckSample[],
  options: SummarizeOptions = {}
): UptimeSummary {
  const intervalSeconds = options.intervalSeconds ?? 300
  const intervalMs = intervalSeconds * 1000
  const nowMs = options.now ? toMillis(options.now) : Date.now()

  if (checks.length === 0) {
    return { ...EMPTY_SUMMARY, intervalSeconds }
  }

  const sorted = [...checks].sort((a, b) => toMillis(a.checkedAt) - toMillis(b.checkedAt))

  let uptimeMs = 0
  let downtimeMs = 0

  for (let index = 0; index < sorted.length; index += 1) {
    const currentMs = toMillis(sorted[index].checkedAt)
    const nextMs = index < sorted.length - 1 ? toMillis(sorted[index + 1].checkedAt) : nowMs
    const spanMs = Math.max(0, Math.min(nextMs - currentMs, intervalMs))

    if (sorted[index].ok) uptimeMs += spanMs
    else downtimeMs += spanMs
  }

  const latest = sorted[sorted.length - 1]
  let streakStartMs = toMillis(latest.checkedAt)
  for (let index = sorted.length - 2; index >= 0; index -= 1) {
    if (sorted[index].ok !== latest.ok) break
    streakStartMs = toMillis(sorted[index].checkedAt)
  }

  const totalObservedMs = uptimeMs + downtimeMs
  const successfulChecks = sorted.filter((check) => check.ok).length
  const failedChecks = sorted.length - successfulChecks

  return {
    currentStatus: latest.ok ? 'up' : 'down',
    currentStatusDurationSeconds: Math.max(0, Math.round((nowMs - streakStartMs) / 1000)),
    observedUptimePercentage:
      totalObservedMs > 0 ? Number(((uptimeMs / totalObservedMs) * 100).toFixed(2)) : null,
    estimatedDowntimeSeconds: Math.round(downtimeMs / 1000),
    uptimeSeconds: Math.round(uptimeMs / 1000),
    totalObservedSeconds: Math.round(totalObservedMs / 1000),
    totalChecks: sorted.length,
    successfulChecks,
    failedChecks,
    monitoringStartedAt: sorted[0].checkedAt,
    lastCheckedAt: latest.checkedAt,
    lastStatusCode: latest.statusCode,
    intervalSeconds,
    recentChecks: [...sorted].reverse().slice(0, 8),
  }
}
