import { describe, expect, it } from 'vitest'

import {
  calculateDowntimeAllowances,
  formatDowntime,
  validateSlaPercentage,
} from './slaCalculator'

describe('validateSlaPercentage', () => {
  it('accepts an SLA between 0 and 100 inclusive', () => {
    expect(validateSlaPercentage(99.9)).toBeNull()
    expect(validateSlaPercentage(100)).toBeNull()
  })

  it('rejects missing and out-of-range values', () => {
    expect(validateSlaPercentage(Number.NaN)).toBe('Enter an SLA percentage between 0 and 100.')
    expect(validateSlaPercentage(-1)).toBe('Enter an SLA percentage between 0 and 100.')
    expect(validateSlaPercentage(100.1)).toBe('Enter an SLA percentage between 0 and 100.')
  })
})

describe('calculateDowntimeAllowances', () => {
  it('calculates standard downtime windows from an SLA percentage', () => {
    const allowances = calculateDowntimeAllowances(99.9)

    expect(allowances.day).toBe(86)
    expect(allowances.week).toBe(605)
    expect(allowances.month).toBe(2_592)
    expect(allowances.year).toBe(31_536)
  })
})

describe('formatDowntime', () => {
  it('formats seconds into human-readable durations', () => {
    expect(formatDowntime(86)).toBe('1 minute 26 seconds')
    expect(formatDowntime(2_592)).toBe('43 minutes 12 seconds')
    expect(formatDowntime(31_536)).toBe('8 hours 45 minutes 36 seconds')
    expect(formatDowntime(0)).toBe('0 seconds')
  })
})
