import { describe, expect, it } from 'vitest'

import {
  getRateLimitConfig,
  getRetryAfterMs,
  getThrottleKey,
  registerFailure,
} from '../../supabase/functions/phone-login/rate-limit'

describe('phone-login rate limit', () => {
  it('locks after repeated failures in the same window', () => {
    const { MAX_ATTEMPTS, LOCKOUT_MS } = {
      ...getRateLimitConfig(),
      MAX_ATTEMPTS: 5,
      LOCKOUT_MS: 15 * 60 * 1000,
    }
    const now = 1_000_000
    let current

    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      current = registerFailure(now + i, current?.entry)
    }

    expect(current?.retryAfterMs).toBe(LOCKOUT_MS)
    expect(getRetryAfterMs(now + MAX_ATTEMPTS, current?.entry)).toBeGreaterThan(0)
    expect(getThrottleKey('TBM-AA-1', '127.0.0.1')).toBe('tbm-aa-1::127.0.0.1')
  })
})
