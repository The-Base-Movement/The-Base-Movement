/**
 * Helpers for safely building PostgREST filters from user input.
 *
 * `.or()` takes a *raw* filter expression where `,` separates conditions and
 * `()` group them. Interpolating a user-supplied search term directly into that
 * string lets the user inject extra filter conditions (PostgREST filter
 * injection). Strip the structural characters so the term can only ever be
 * treated as a literal value inside an `ilike`.
 */
export function sanitizeOrTerm(term: string): string {
  return term.replace(/[,()\\]/g, ' ').trim()
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}
