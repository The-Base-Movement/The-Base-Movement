import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export function normalizeHubtelPhone(phone: string) {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (!digits) return ''

  const candidate = trimmed.startsWith('+')
    ? `+${digits}`
    : digits.startsWith('00')
      ? `+${digits.slice(2)}`
      : digits.startsWith('0')
        ? trimmed
        : `+${digits}`

  const parsed = parsePhoneNumberFromString(candidate, candidate.startsWith('+') ? undefined : 'GH')
  return parsed?.isValid() ? parsed.number : ''
}

/** Returns true if the normalised phone number is a Ghana (+233) number. */
export function isGhanaPhone(normalizedPhone: string): boolean {
  const parsed = parsePhoneNumberFromString(normalizedPhone)
  return parsed?.isValid() === true && parsed.country === 'GH'
}
