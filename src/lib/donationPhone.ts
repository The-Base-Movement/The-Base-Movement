/**
 * @file donationPhone.ts
 * @description Provides helper utilities for parsing and normalizing donor phone numbers.
 * Uses libphonenumber-js to parse inputs, validate them according to country dialing settings,
 * and formats them in standard E.164 notation.
 */

/**
 * Parameter structure representing donation phone number input variables
 */
export interface DonationPhoneInput {
  /** The raw phone number input value entered by the user */
  phone: string
  /** The target country name mapped to this phone number */
  country: string
  /** Optional country dial code prefix (e.g. '+233') */
  dialingCode?: string | null
}

/**
 * Union outcome type representing the parsing resolution status of the phone number
 */
export type DonationPhoneResult =
  | {
      /** Flag showing parse succeeded */
      ok: true
      /** The normalized phone number in E.164 format */
      e164: string
      /** Flag showing if the phone country corresponds to Ghana */
      isGhana: boolean
    }
  | {
      /** Flag showing parse failed */
      ok: false
      /** Detail string explaining the parsing failure reason */
      error: string
    }

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

/**
 * Normalizes a phone number using country metadata.
 * Validates correctness of format and outputs internationally formatted E.164 text.
 *
 * @param input - The phone number parsing parameters
 * @returns Parsed success object containing formatted string, or validation error description.
 */
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

  if (!parsed?.isPossible()) {
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
