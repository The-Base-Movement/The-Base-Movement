export function normalizeRecoveryPhone(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) return cleaned

  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}
