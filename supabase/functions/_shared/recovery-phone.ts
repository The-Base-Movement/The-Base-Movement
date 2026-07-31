export function normalizeRecoveryPhone(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) return cleaned

  const digits = cleaned.replace(/\D/g, '')

  // Local Ghana 10-digit format starting with 0 (e.g., 054XXXXXXX)
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 9)) {
    return `+233${digits.slice(1)}`
  }

  // Local Ghana 9-digit format without leading 0 (e.g., 54XXXXXXX)
  if (digits.length === 9 && !digits.startsWith('0')) {
    return `+233${digits}`
  }

  // Full international number provided without '+' (e.g., 14155552671, 447911123456, 23354XXXXXXX)
  if (digits.length >= 10) {
    return `+${digits}`
  }

  return `+233${digits}`
}
