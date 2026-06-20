export interface DonationPhoneInput {
  phone: string
  country: string
  dialingCode?: string | null
}

export type DonationPhoneResult =
  | { ok: true; e164: string; isGhana: boolean }
  | { ok: false; error: string }

const COUNTRY_ALIASES: Record<string, CountryCode> = {
  ghana: 'GH',
  usa: 'US',
  'united states of america': 'US',
  uk: 'GB',
  england: 'GB',
  uae: 'AE',
  russia: 'RU',
  'south korea': 'KR',
  'ivory coast': 'CI',
}

function normalizeCountryName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function buildCountryNameMap() {
  const names = new Map<string, CountryCode>(Object.entries(COUNTRY_ALIASES))
  if (typeof Intl.DisplayNames !== 'function') return names

  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
  for (const code of getCountries()) {
    const name = displayNames.of(code)
    if (name) names.set(normalizeCountryName(name), code)
  }
  return names
}

const COUNTRY_CODES_BY_NAME = buildCountryNameMap()

function normalizeInternationalPrefix(phone: string) {
  const trimmed = phone.trim()
  return trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed
}

function buildInternationalFallback(phone: string, dialingCode?: string | null) {
  if (!dialingCode) return phone
  const callingCode = dialingCode.replace(/\D/g, '')
  const nationalNumber = phone.replace(/\D/g, '').replace(/^0+/, '')
  return callingCode && nationalNumber ? `+${callingCode}${nationalNumber}` : phone
}

export function normalizeDonationPhone(input: DonationPhoneInput): DonationPhoneResult {
  const phone = input.phone.trim()
  if (!phone) return { ok: false, error: 'Enter a phone number.' }

  const countryCode = COUNTRY_CODES_BY_NAME.get(normalizeCountryName(input.country))
  const internationalInput = normalizeInternationalPrefix(phone)
  const parsed = internationalInput.startsWith('+')
    ? parsePhoneNumberFromString(internationalInput)
    : countryCode
      ? parsePhoneNumberFromString(internationalInput, countryCode)
      : parsePhoneNumberFromString(
          buildInternationalFallback(internationalInput, input.dialingCode)
        )

  if (!parsed?.isValid()) {
    return {
      ok: false,
      error: `Enter a valid phone number for ${input.country || 'the selected country'}.`,
    }
  }

  return {
    ok: true,
    e164: parsed.number,
    isGhana: parsed.country === 'GH',
  }
}
import { getCountries, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max'
