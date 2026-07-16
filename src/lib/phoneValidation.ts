import { parsePhoneNumberFromString, validatePhoneNumberLength } from 'libphonenumber-js/max'

// Cap the input to the maximum number of digits the selected country allows, so
// a field can never hold more digits than a valid number for that country.
// Non-digit characters (spaces, dashes the user types) are preserved.
export function capToCountryDigits(value: string, countryCode = '+233'): string {
  const code = countryCode.replace(/[^\d]/g, '')
  if (!code) return value
  let digits = ''
  let out = ''
  for (const ch of value) {
    if (/\d/.test(ch)) {
      // Reject the next digit only if it would push the number past the max length.
      if (validatePhoneNumberLength(digits + ch, { defaultCallingCode: code }) === 'TOO_LONG')
        continue
      digits += ch
    }
    out += ch
  }
  return out
}

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

export function cleanPhoneInput(value: string, countryCode = '+233'): string {
  let cleaned = value.trim()
  const code = countryCode.replace(/[^\d]/g, '') // e.g. "233"
  const digitsOnly = cleaned.replace(/[^\d+]/g, '')

  if (digitsOnly.startsWith('+' + code)) {
    const prefixRegex = new RegExp(`^\\+?\\s*${code}\\s*`)
    cleaned = cleaned.replace(prefixRegex, '')
  } else if (digitsOnly.startsWith(code) && code.length > 1) {
    const prefixRegex = new RegExp(`^\\s*${code}\\s*`)
    cleaned = cleaned.replace(prefixRegex, '')
  }

  // Strip leading zeros and spaces immediately after
  cleaned = cleaned.replace(/^\s*0+\s*/, '')
  return capToCountryDigits(cleaned, countryCode)
}
