import { describe, expect, it } from 'vitest'

import {
  getRetryAfterMs,
  registerAttempt,
  type RateLimitEntry,
} from '../../supabase/functions/_shared/password-reset-rate-limit'

describe('password reset rate limit', () => {
  it('locks after the configured number of attempts in the active window', () => {
    const now = 1_000_000
    let entry: RateLimitEntry | undefined

    entry = registerAttempt(now, entry, 60_000, 3, 120_000)
    entry = registerAttempt(now + 1_000, entry, 60_000, 3, 120_000)
    entry = registerAttempt(now + 2_000, entry, 60_000, 3, 120_000)

    expect(getRetryAfterMs(now + 2_000, entry)).toBe(120_000)
    expect(getRetryAfterMs(now + 122_001, entry)).toBe(0)
  })
})
