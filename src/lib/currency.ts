export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  ghsRate: number
}

const DEFAULT_CURRENCY: CurrencyInfo = {
  code: 'GHS',
  symbol: '₵',
  name: 'Ghanaian cedi',
  ghsRate: 1,
}

const COUNTRY_CURRENCY: Record<string, CurrencyInfo> = {
  belgium: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  france: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  germany: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  italy: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  netherlands: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  spain: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  ireland: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  portugal: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  austria: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  finland: { code: 'EUR', symbol: '€', name: 'Euro', ghsRate: 13.62 },
  ghana: DEFAULT_CURRENCY,
  'united kingdom': { code: 'GBP', symbol: '£', name: 'British pound', ghsRate: 15.82 },
  uk: { code: 'GBP', symbol: '£', name: 'British pound', ghsRate: 15.82 },
  england: { code: 'GBP', symbol: '£', name: 'British pound', ghsRate: 15.82 },
  'united states': { code: 'USD', symbol: '$', name: 'US dollar', ghsRate: 11.76 },
  'united states of america': { code: 'USD', symbol: '$', name: 'US dollar', ghsRate: 11.76 },
  usa: { code: 'USD', symbol: '$', name: 'US dollar', ghsRate: 11.76 },
  canada: { code: 'CAD', symbol: 'CA$', name: 'Canadian dollar', ghsRate: 8.58 },
  australia: { code: 'AUD', symbol: 'A$', name: 'Australian dollar', ghsRate: 7.65 },
  nigeria: { code: 'NGN', symbol: '₦', name: 'Nigerian naira', ghsRate: 0.0079 },
  'south africa': { code: 'ZAR', symbol: 'R', name: 'South African rand', ghsRate: 0.66 },
  switzerland: { code: 'CHF', symbol: 'CHF', name: 'Swiss franc', ghsRate: 14.55 },
  norway: { code: 'NOK', symbol: 'kr', name: 'Norwegian krone', ghsRate: 1.16 },
  sweden: { code: 'SEK', symbol: 'kr', name: 'Swedish krona', ghsRate: 1.25 },
  denmark: { code: 'DKK', symbol: 'kr', name: 'Danish krone', ghsRate: 1.83 },
  japan: { code: 'JPY', symbol: '¥', name: 'Japanese yen', ghsRate: 0.081 },
  china: { code: 'CNY', symbol: '¥', name: 'Chinese yuan', ghsRate: 1.63 },
  india: { code: 'INR', symbol: '₹', name: 'Indian rupee', ghsRate: 0.134 },
  'united arab emirates': { code: 'AED', symbol: 'د.إ', name: 'UAE dirham', ghsRate: 3.2 },
  uae: { code: 'AED', symbol: 'د.إ', name: 'UAE dirham', ghsRate: 3.2 },
}

export function getCurrencyForCountry(country?: string | null): CurrencyInfo {
  if (!country) return DEFAULT_CURRENCY
  return COUNTRY_CURRENCY[country.trim().toLowerCase()] ?? DEFAULT_CURRENCY
}

export function formatCurrencyAmount(amount: string | number, currency: CurrencyInfo) {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return `${currency.symbol}0.00`
  return `${currency.symbol}${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function convertToGhs(amount: string | number, currency: CurrencyInfo) {
  const numeric = Number(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return Math.round(numeric * currency.ghsRate * 100) / 100
}

export function formatGhsAmount(amount: string | number) {
  return formatCurrencyAmount(amount, DEFAULT_CURRENCY)
}
