/**
 * Normalise a phone number for recovery lookups.
 * Only E.164 international format (+CountryCode...) is accepted.
 * Numbers starting with '+' are returned exactly as typed.
 * Numbers without a leading '+' are rejected — callers should validate
 * on the UI side before reaching this function, but we strip nothing here
 * so the DB lookup simply finds no record and the ghost-success path fires.
 */
export function normalizeRecoveryPhone(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) return cleaned
  // No country-code prefix supplied — return as-is; the DB lookup will miss
  // and the function returns a ghost success, prompting the user to re-enter
  // with the full international format.
  return cleaned
}
