const PERIOD_SECONDS = {
  day: 24 * 60 * 60,
  week: 7 * 24 * 60 * 60,
  month: 30 * 24 * 60 * 60,
  year: 365 * 24 * 60 * 60,
} as const

export type SlaPeriod = keyof typeof PERIOD_SECONDS

export function validateSlaPercentage(value: number): string | null {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return 'Enter an SLA percentage between 0 and 100.'
  }

  return null
}

export function calculateDowntimeAllowances(slaPercentage: number): Record<SlaPeriod, number> {
  const downtimeRatio = 1 - slaPercentage / 100

  return {
    day: Math.round(PERIOD_SECONDS.day * downtimeRatio),
    week: Math.round(PERIOD_SECONDS.week * downtimeRatio),
    month: Math.round(PERIOD_SECONDS.month * downtimeRatio),
    year: Math.round(PERIOD_SECONDS.year * downtimeRatio),
  }
}

export function formatDowntime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 seconds'

  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  const parts = [
    days ? `${days} day${days === 1 ? '' : 's'}` : null,
    hours ? `${hours} hour${hours === 1 ? '' : 's'}` : null,
    minutes ? `${minutes} minute${minutes === 1 ? '' : 's'}` : null,
    seconds ? `${seconds} second${seconds === 1 ? '' : 's'}` : null,
  ].filter(Boolean)

  return parts.join(' ')
}
