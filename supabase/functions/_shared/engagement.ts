/**
 * Categorize member engagement based on last sign-in timestamp.
 *
 * Logic:
 * - 'Never': member has never signed in (last_sign_in_at IS NULL)
 * - 'Active': member signed in within the last 30 days
 * - 'Dormant': member last signed in more than 30 days ago
 */
export function categorizeEngagement(lastSignInAt: Date | null | string): string {
  if (!lastSignInAt) {
    return 'Never'
  }

  const lastLogin = new Date(lastSignInAt)
  const now = new Date()
  const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)

  return daysSinceLogin <= 30 ? 'Active' : 'Dormant'
}
