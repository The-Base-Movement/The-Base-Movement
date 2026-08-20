const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const KNOWN_INVALID_MEMBER_EMAILS = new Set(['morgangroupgh100hj8@gmail.com'])

export function getMemberEmailValidationError(email: string | null | undefined): string | null {
  const normalizedEmail = email?.trim().toLowerCase() ?? ''
  if (!normalizedEmail) return null

  if (!EMAIL_REGEX.test(normalizedEmail)) return 'Enter a valid email address.'

  if (KNOWN_INVALID_MEMBER_EMAILS.has(normalizedEmail)) {
    return 'This email address is not accepted. Use a working email address or continue with phone registration.'
  }

  return null
}
