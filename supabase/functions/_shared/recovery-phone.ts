/**
 * Normalise a phone number for recovery lookups.
 * Converts local numbers (054..., 046...) or un-prefixed international numbers (32..., 233...)
 * to standard E.164 format (+CountryCode...).
 */
export function normalizeRecoveryPhone(raw: string): string {
  let cleaned = raw.trim()
  if (!cleaned) return cleaned

  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`

  // 1. If user typed with country code but omitted plus (e.g. 233..., 32..., 44..., 1...)
  if (/^(233|32|44|49|39|31|27|234|86|971|1)\d+/.test(cleaned)) {
    return `+${cleaned}`
  }

  // 2. Ghana local zero format (e.g. 024..., 054..., 020..., 059...) -> +233...
  if (/^0[235]\d{8}$/.test(cleaned)) {
    return `+233${cleaned.slice(1)}`
  }

  // 3. Belgium local zero format (e.g. 046..., 047..., 048...) -> +32...
  if (/^04\d{8}$/.test(cleaned)) {
    return `+32${cleaned.slice(1)}`
  }

  // Fallback: prepend '+'
  return `+${cleaned}`
}

export function isGhanaRecoveryPhone(phone: string): boolean {
  return phone.startsWith('+233') || phone.startsWith('233')
}
