import { describe, expect, it } from 'vitest'

import { normalizeDonationPhone } from '@/lib/donationPhone'

describe('normalizeDonationPhone', () => {
  it.each([
    ['Ghana', '+233', '024 123 4567', '+233241234567', true],
    ['Belgium', '+32', '0467 81 47 42', '+32467814742', false],
    ['United States', '+1', '(415) 555-2671', '+14155552671', false],
    ['United Kingdom', '+44', '07400 123456', '+447400123456', false],
    ['Nigeria', '+234', '0803 123 4567', '+2348031234567', false],
    ['India', '+91', '98765 43210', '+919876543210', false],
    ['Australia', '+61', '0412 345 678', '+61412345678', false],
    ['United Arab Emirates', '+971', '050 123 4567', '+971501234567', false],
  ])('normalizes a valid national number from %s', (country, dialingCode, phone, e164, isGhana) => {
    expect(normalizeDonationPhone({ phone, country, dialingCode })).toEqual({
      ok: true,
      e164,
      isGhana,
    })
  })

  it('accepts valid E.164 input without relying on the selected country name', () => {
    expect(
      normalizeDonationPhone({
        phone: '+81 90 1234 5678',
        country: 'Unknown country label',
        dialingCode: '+81',
      })
    ).toEqual({ ok: true, e164: '+819012345678', isGhana: false })
  })

  it('rejects the incomplete Belgian number before a donation is created', () => {
    const result = normalizeDonationPhone({
      phone: '+3249466275',
      country: 'Belgium',
      dialingCode: '+32',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('valid phone number for Belgium')
  })

  it('rejects a missing number', () => {
    expect(normalizeDonationPhone({ phone: ' ', country: 'Ghana', dialingCode: '+233' })).toEqual({
      ok: false,
      error: 'Enter a phone number.',
    })
  })
})
