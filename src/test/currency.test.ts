import { describe, expect, it } from 'vitest'
import { convertToGhs, getCurrencyForCountry } from '@/lib/currency'
import {
  convertToHubtelGhs,
  parseGhsExchangeRates,
} from '../../supabase/functions/hubtel-initiate-payment/currency'

describe('donation currency conversion', () => {
  it('converts Belgium donations from EUR into GHS before checkout', () => {
    const currency = getCurrencyForCountry('Belgium')

    expect(currency.code).toBe('EUR')
    expect(convertToGhs(10, currency)).toBe(136.2)
  })

  it('keeps Ghana donations in GHS', () => {
    const currency = getCurrencyForCountry('Ghana')

    expect(currency.code).toBe('GHS')
    expect(convertToGhs(50, currency)).toBe(50)
  })

  it('lets the edge function override exchange rates from env JSON', () => {
    const rates = parseGhsExchangeRates('{"EUR": 14.25}')

    expect(convertToHubtelGhs(10, 'EUR', rates)).toEqual({
      sourceAmount: 10,
      sourceCurrency: 'EUR',
      exchangeRateToGhs: 14.25,
      ghsAmount: 142.5,
    })
  })
})
