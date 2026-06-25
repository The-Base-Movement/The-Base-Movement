import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

// ponytail: one function, two callers (register + login). Returns null if valid, error string if not.
export function validatePhone(number: string, countryCode = '+233'): string | null {
  const raw = number.trim()
  if (!raw) return 'Phone number is required.'

  const withCode = raw.startsWith('+')
    ? raw
    : raw.startsWith('0')
      ? countryCode + raw.slice(1)
      : countryCode + raw

  const parsed = parsePhoneNumberFromString(withCode)
  if (!parsed) return 'Invalid phone number format.'
  if (!parsed.isValid()) return `Invalid phone number for ${parsed.country || 'this country'}.`
  return null
}
