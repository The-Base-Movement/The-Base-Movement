export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

const DEFAULT_CURRENCY: CurrencyInfo = { code: 'GHS', symbol: '₵', name: 'Ghanaian cedi' }

const COUNTRY_CURRENCY: Record<string, CurrencyInfo> = {
  belgium: { code: 'EUR', symbol: '€', name: 'Euro' },
  france: { code: 'EUR', symbol: '€', name: 'Euro' },
  germany: { code: 'EUR', symbol: '€', name: 'Euro' },
  italy: { code: 'EUR', symbol: '€', name: 'Euro' },
  netherlands: { code: 'EUR', symbol: '€', name: 'Euro' },
  spain: { code: 'EUR', symbol: '€', name: 'Euro' },
  ireland: { code: 'EUR', symbol: '€', name: 'Euro' },
  portugal: { code: 'EUR', symbol: '€', name: 'Euro' },
  austria: { code: 'EUR', symbol: '€', name: 'Euro' },
  finland: { code: 'EUR', symbol: '€', name: 'Euro' },
  ghana: DEFAULT_CURRENCY,
  'united kingdom': { code: 'GBP', symbol: '£', name: 'British pound' },
  uk: { code: 'GBP', symbol: '£', name: 'British pound' },
  england: { code: 'GBP', symbol: '£', name: 'British pound' },
  'united states': { code: 'USD', symbol: '$', name: 'US dollar' },
  'united states of america': { code: 'USD', symbol: '$', name: 'US dollar' },
  usa: { code: 'USD', symbol: '$', name: 'US dollar' },
  canada: { code: 'CAD', symbol: 'CA$', name: 'Canadian dollar' },
  australia: { code: 'AUD', symbol: 'A$', name: 'Australian dollar' },
  nigeria: { code: 'NGN', symbol: '₦', name: 'Nigerian naira' },
  'south africa': { code: 'ZAR', symbol: 'R', name: 'South African rand' },
  switzerland: { code: 'CHF', symbol: 'CHF', name: 'Swiss franc' },
  norway: { code: 'NOK', symbol: 'kr', name: 'Norwegian krone' },
  sweden: { code: 'SEK', symbol: 'kr', name: 'Swedish krona' },
  denmark: { code: 'DKK', symbol: 'kr', name: 'Danish krone' },
  japan: { code: 'JPY', symbol: '¥', name: 'Japanese yen' },
  china: { code: 'CNY', symbol: '¥', name: 'Chinese yuan' },
  india: { code: 'INR', symbol: '₹', name: 'Indian rupee' },
  'united arab emirates': { code: 'AED', symbol: 'د.إ', name: 'UAE dirham' },
  uae: { code: 'AED', symbol: 'د.إ', name: 'UAE dirham' },
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
