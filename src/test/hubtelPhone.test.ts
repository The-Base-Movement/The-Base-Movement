import { describe, expect, it } from 'vitest'

import {
  isGhanaPhone,
  normalizeHubtelPhone,
} from '../../supabase/functions/hubtel-initiate-payment/phone'

describe('normalizeHubtelPhone', () => {
  it('keeps all digits in Belgian E.164 numbers', () => {
    expect(normalizeHubtelPhone('+32467814742')).toBe('+32467814742')
    expect(normalizeHubtelPhone('+32 467 814 742')).toBe('+32467814742')
  })

  it('converts Ghana local numbers by removing only the trunk zero', () => {
    expect(normalizeHubtelPhone('024 123 4567')).toBe('+233241234567')
  })

  it('converts 00-prefixed international numbers to E.164', () => {
    expect(normalizeHubtelPhone('0032 467 814 742')).toBe('+32467814742')
  })

  it.each([
    ['Belgium', '+32 467 814 742', '+32467814742'],
    ['United States', '+1 (415) 555-2671', '+14155552671'],
    ['United Kingdom', '+44 7400 123456', '+447400123456'],
    ['Nigeria', '+234 803 123 4567', '+2348031234567'],
    ['India', '+91 98765 43210', '+919876543210'],
    ['Australia', '+61 412 345 678', '+61412345678'],
    ['United Arab Emirates', '+971 50 123 4567', '+971501234567'],
  ])('accepts a valid %s number', (_country, input, expected) => {
    expect(normalizeHubtelPhone(input)).toBe(expected)
  })

  it('rejects the incomplete Belgian number shown by Hubtel', () => {
    expect(normalizeHubtelPhone('+3249466275')).toBe('')
  })

  it('rejects synthetic Ghana placeholders', () => {
    expect(normalizeHubtelPhone('+233000000000')).toBe('')
  })

  it('only identifies validated Ghana numbers as Ghana phones', () => {
    expect(isGhanaPhone('+233241234567')).toBe(true)
    expect(isGhanaPhone('+32467814742')).toBe(false)
    expect(isGhanaPhone('+233000000000')).toBe(false)
  })
})
