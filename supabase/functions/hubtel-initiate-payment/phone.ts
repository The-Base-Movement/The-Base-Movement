export function normalizeHubtelPhone(phone: string) {
  const trimmed = phone.trim()
  const hasLeadingPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')

  if (!digits) return ''
  if (hasLeadingPlus) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  if (digits.startsWith('233')) return `+${digits}`
  return `+${digits}`
}

/** Returns true if the normalised phone number is a Ghana (+233) number. */
export function isGhanaPhone(normalizedPhone: string): boolean {
  return normalizedPhone.startsWith('+233')
}
