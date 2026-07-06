export interface RateLimitEntry {
  attempts: number
  windowStartedAt: number
  lockedUntil: number
}

export function getRetryAfterMs(now: number, current?: RateLimitEntry) {
  if (!current?.lockedUntil || current.lockedUntil <= now) return 0
  return current.lockedUntil - now
}

export function registerAttempt(
  now: number,
  current: RateLimitEntry | undefined,
  windowMs: number,
  maxAttempts: number,
  lockoutMs: number
): RateLimitEntry {
  const active = current && now - current.windowStartedAt < windowMs
  const attempts = active ? current.attempts + 1 : 1
  return {
    attempts,
    windowStartedAt: active && current ? current.windowStartedAt : now,
    lockedUntil: attempts >= maxAttempts ? now + lockoutMs : 0,
  }
}
