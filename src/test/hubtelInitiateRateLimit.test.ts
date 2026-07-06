import { describe, expect, it } from 'vitest'

import {
  getRateLimitConfig,
  ipKey,
  isIpRateLimited,
  referenceKey,
  registerIpAttempt,
  registerReferenceAttempt,
  remainingCooldown,
} from '../../supabase/functions/hubtel-initiate-payment/rate-limit'

describe('hubtel initiate rate limit', () => {
  it('limits repeated IP attempts and short reference replays', () => {
    const { MAX_ATTEMPTS_PER_IP, REFERENCE_COOLDOWN_MS } = getRateLimitConfig()
    const now = 1_000_000
    let ipEntry

    for (let i = 0; i < MAX_ATTEMPTS_PER_IP; i += 1) {
      ipEntry = registerIpAttempt(now + i, ipEntry)
    }

    expect(isIpRateLimited(now + MAX_ATTEMPTS_PER_IP, ipEntry)).toBe(true)

    const refEntry = registerReferenceAttempt(now)
    expect(remainingCooldown(now, refEntry)).toBe(REFERENCE_COOLDOWN_MS)
    expect(ipKey(' 127.0.0.1 ')).toBe('127.0.0.1')
    expect(referenceKey('127.0.0.1', ' REF-1 ')).toBe('127.0.0.1::ref-1')
  })
})
