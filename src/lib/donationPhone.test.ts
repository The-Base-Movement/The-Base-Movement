import { describe, expect, it } from 'vitest'
import { normalizeDonationPhone } from './donationPhone'

describe('normalizeDonationPhone', () => {
  it('accepts a structurally valid international number when carrier metadata is unknown', () => {
    expect(
      normalizeDonationPhone({
        phone: '+32400000000',
        country: 'Belgium',
        dialingCode: '+32',
      })
    ).toEqual({ ok: true, e164: '+32400000000', isGhana: false })
  })

  it('rejects an international number with an invalid length', () => {
    expect(
      normalizeDonationPhone({
        phone: '+3240',
        country: 'Belgium',
        dialingCode: '+32',
      }).ok
    ).toBe(false)
  })
})
