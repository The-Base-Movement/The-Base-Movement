export type MatchTone = 'neutral' | 'match' | 'mismatch'

/** Derive the match tone from a password / confirmation pair. */
export function matchTone(password: string, confirm: string): MatchTone {
  if (!password || !confirm) return 'neutral'
  return password === confirm ? 'match' : 'mismatch'
}
