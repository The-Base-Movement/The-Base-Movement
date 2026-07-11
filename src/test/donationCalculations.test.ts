import { describe, expect, it } from 'vitest'

import {
  donationAmount,
  isVerifiedDonation,
  sumDonationAmounts,
} from '@/services/donationCalculations'

describe('donationCalculations', () => {
  it('counts only verified donations as approved income', () => {
    expect(isVerifiedDonation({ status: 'Verified' })).toBe(true)
    expect(isVerifiedDonation({ status: 'Pending' })).toBe(false)
    expect(isVerifiedDonation({ status: 'Rejected' })).toBe(false)
    expect(isVerifiedDonation({ status: null })).toBe(false)
  })

  it('sums numeric donation amounts and ignores invalid values', () => {
    expect(
      sumDonationAmounts([
        { amount: 100 },
        { amount: '250.50' },
        { amount: null },
        { amount: 'not-a-number' },
      ])
    ).toBe(350.5)
    expect(donationAmount({ amount: 'bad-input' })).toBe(0)
  })
})
