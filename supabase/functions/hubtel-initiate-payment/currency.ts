const DEFAULT_GHS_RATES: Record<string, number> = {
  GHS: 1,
  EUR: 13.62,
  GBP: 15.82,
  USD: 11.76,
  CAD: 8.58,
  AUD: 7.65,
  NGN: 0.0079,
  ZAR: 0.66,
  CHF: 14.55,
  NOK: 1.16,
  SEK: 1.25,
  DKK: 1.83,
  JPY: 0.081,
  CNY: 1.63,
  INR: 0.134,
  AED: 3.2,
}

function normalizeCurrency(currency?: string | null) {
  return currency?.trim().toUpperCase() || 'GHS'
}

export function parseGhsExchangeRates(raw?: string | null): Record<string, number> {
  if (!raw?.trim()) return DEFAULT_GHS_RATES

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const rates = { ...DEFAULT_GHS_RATES }
    for (const [key, value] of Object.entries(parsed)) {
      const code = normalizeCurrency(key)
      const rate = Number(value)
      if (Number.isFinite(rate) && rate > 0) rates[code] = rate
    }
    return rates
  } catch {
    return DEFAULT_GHS_RATES
  }
}

export function convertToHubtelGhs(
  amount: number,
  currency: string,
  rates: Record<string, number> = DEFAULT_GHS_RATES
) {
  const code = normalizeCurrency(currency)
  const rate = rates[code] ?? 1
  return {
    sourceAmount: Math.round(amount * 100) / 100,
    sourceCurrency: code,
    exchangeRateToGhs: rate,
    ghsAmount: Math.round(amount * rate * 100) / 100,
  }
}
