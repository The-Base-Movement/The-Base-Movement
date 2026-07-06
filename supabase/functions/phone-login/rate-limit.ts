const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export interface RateLimitEntry {
  attempts: number
  firstFailedAt: number
  lockedUntil: number
}

export function getRateLimitConfig() {
  return { WINDOW_MS, MAX_ATTEMPTS, LOCKOUT_MS }
}

export function getThrottleKey(identifier: string, ip: string) {
  return `${identifier.trim().toLowerCase()}::${ip.trim().toLowerCase()}`
}

export function registerFailure(
  now: number,
  current?: RateLimitEntry
): { entry: RateLimitEntry; retryAfterMs: number } {
  const active = current && now - current.firstFailedAt < WINDOW_MS
  const attempts = active ? current.attempts + 1 : 1
  const firstFailedAt = active && current ? current.firstFailedAt : now
  const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0

  return {
    entry: { attempts, firstFailedAt, lockedUntil },
    retryAfterMs: lockedUntil > now ? lockedUntil - now : 0,
  }
}

export function getRetryAfterMs(now: number, current?: RateLimitEntry) {
  if (!current?.lockedUntil || current.lockedUntil <= now) return 0
  return current.lockedUntil - now
}
