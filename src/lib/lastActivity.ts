/**
 * @file lastActivity.ts
 * @description Cross-tab "last user activity" clock backing the idle-timeout hooks.
 *
 * Auth tokens live in localStorage, so all tabs share one session. If each tab
 * tracked idleness in its own memory, a background tab left open would hit its
 * timeout and sign out the session the user is actively using in another tab.
 * Recording activity in localStorage means any tab's input refreshes the clock
 * for all of them, so logout only happens when the user is idle *everywhere*.
 */

const LAST_ACTIVITY_KEY = 'last_activity_at'

/** Minimum gap between localStorage writes; pointermove would otherwise write on every frame. */
const WRITE_THROTTLE_MS = 5000

/** DOM events treated as user activity. Bound on `window`, all of them bubble or are captured there. */
export const ACTIVITY_EVENTS = [
  'pointermove',
  'mousedown',
  'click',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
  'focus',
] as const

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

let lastWrite = 0

/**
 * Records that the user just did something. Throttled to one write per
 * WRITE_THROTTLE_MS — far finer than any timeout threshold that reads it.
 */
export function markActivity(): void {
  if (!isBrowser) return
  const now = Date.now()
  if (now - lastWrite < WRITE_THROTTLE_MS) return
  lastWrite = now
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
  } catch {
    // Private-mode quota errors: fall back to the in-memory `lastWrite` clock.
  }
}

/**
 * Most recent activity timestamp across every open tab.
 * Falls back to "now" when unset or unparseable, so a missing value can never
 * read as "idle forever" and log someone out on load.
 */
export function getLastActivity(): number {
  if (!isBrowser) return Date.now()
  const raw = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
  return Number.isFinite(raw) && raw > 0 ? raw : Date.now()
}

/** Clears the shared clock. Call on sign-out so the next session starts fresh. */
export function clearActivity(): void {
  if (!isBrowser) return
  lastWrite = 0
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  } catch {
    // ignore
  }
}
