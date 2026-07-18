export function normalizePhoneNumber(input: string): string | null {
  const cleaned = input.trim()
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return null

  let local9: string | null = null

  if (digits.length === 9) {
    local9 = digits
  } else if (digits.length === 10 && digits.startsWith('0')) {
    local9 = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith('233')) {
    local9 = digits.slice(3)
  }

  if (local9 && /^\d{9}$/.test(local9)) {
    return `+233${local9}`
  }

  // Fallback for valid international / diaspora format (starts with '+').
  // Cap at 15 digits — E.164 max — so malformed over-long numbers are rejected.
  if (cleaned.startsWith('+')) {
    const plusDigits = cleaned.slice(1).replace(/\D/g, '')
    if (plusDigits.length >= 7 && plusDigits.length <= 15) {
      return `+${plusDigits}`
    }
  }

  return null
}
