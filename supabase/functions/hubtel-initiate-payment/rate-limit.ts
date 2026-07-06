export interface RateLimitEntry {
  count: number
  windowStartedAt: number
  cooldownUntil: number
}

const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS_PER_IP = 8
const REFERENCE_COOLDOWN_MS = 30 * 1000

export function ipKey(ip: string) {
  return ip.trim().toLowerCase()
}

export function referenceKey(ip: string, reference: string) {
  return `${ipKey(ip)}::${reference.trim().toLowerCase()}`
}

export function getRateLimitConfig() {
  return { WINDOW_MS, MAX_ATTEMPTS_PER_IP, REFERENCE_COOLDOWN_MS }
}

export function remainingCooldown(now: number, entry?: RateLimitEntry) {
  if (!entry?.cooldownUntil || entry.cooldownUntil <= now) return 0
  return entry.cooldownUntil - now
}

export function registerIpAttempt(now: number, current?: RateLimitEntry): RateLimitEntry {
  const inWindow = current && now - current.windowStartedAt < WINDOW_MS
  return {
    count: inWindow ? current.count + 1 : 1,
    windowStartedAt: inWindow && current ? current.windowStartedAt : now,
    cooldownUntil: 0,
  }
}

export function isIpRateLimited(now: number, current?: RateLimitEntry) {
  if (!current) return false
  if (now - current.windowStartedAt >= WINDOW_MS) return false
  return current.count >= MAX_ATTEMPTS_PER_IP
}

export function registerReferenceAttempt(now: number): RateLimitEntry {
  return {
    count: 1,
    windowStartedAt: now,
    cooldownUntil: now + REFERENCE_COOLDOWN_MS,
  }
}
