/**
 * True when an age input identifies a minor (under the voting age of 18, so not
 * eligible for party membership). Only a complete 4-digit year counts, so a
 * half-typed "20" never trips the Youth Wing redirect mid-keystroke.
 */
export function isMinorAgeInput(field: 'birthYear' | 'ageRange' | string, value: string): boolean {
  if (field === 'ageRange') return value === '14-17'
  const year = parseInt(value, 10)
  if (!year || value.trim().length !== 4) return false
  return new Date().getFullYear() - year < 18
}

/**
 * Whole years between a yyyy-mm-dd date of birth and today. Mirrors the
 * database's public.youth_wing_age(), so the form and the server agree on who
 * is 14-17.
 */
export function ageFromDateOfBirth(dob: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null
  const [y, m, d] = dob.split('-').map(Number)
  const now = new Date()
  let age = now.getFullYear() - y
  const hadBirthday = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d)
  if (!hadBirthday) age -= 1
  return age
}
