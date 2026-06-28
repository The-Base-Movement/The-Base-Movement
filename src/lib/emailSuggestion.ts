// ponytail: one pure function, no deps. Returns a corrected email suggestion or null.

const KNOWN_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'ymail.com',
  'googlemail.com',
  'msn.com',
  'bt.com',
  'sky.com',
]

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/**
 * Given a full email address, returns a suggested corrected email if the
 * domain looks like a typo of a known provider (distance 1 or 2).
 * Returns null if the domain is already known or too far off to guess.
 */
export function suggestEmailDomain(email: string): string | null {
  const atIdx = email.lastIndexOf('@')
  if (atIdx < 1) return null

  const local = email.slice(0, atIdx)
  const domain = email.slice(atIdx + 1).toLowerCase()

  if (!domain || !domain.includes('.')) return null
  if (KNOWN_DOMAINS.includes(domain)) return null

  let best: string | null = null
  let bestDist = Infinity

  for (const known of KNOWN_DOMAINS) {
    const d = levenshtein(domain, known)
    if (d < bestDist) {
      bestDist = d
      best = known
    }
  }

  // Only suggest if exactly 1 or 2 characters differ
  if (best && bestDist <= 2) {
    return `${local}@${best}`
  }

  return null
}
