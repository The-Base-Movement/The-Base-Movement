import { describe, expect, it } from 'vitest'

import { normalizeHubtelPhone } from '../../supabase/functions/hubtel-initiate-payment/phone'

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
})
