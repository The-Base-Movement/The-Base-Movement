/**
 * @file forcedLogout.ts
 * @description One-shot message handoff for sign-outs the user did not ask for.
 *
 * When Supabase drops a session (expired or server-revoked refresh token), the route
 * guards bounce straight to /login with no explanation, which reads as a random logout.
 * AuthContext records a reason here; the login page reads it once and clears it.
 */

const FORCED_LOGOUT_KEY = 'forced_logout_reason'

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

// Module-level (not a React ref) because sign-out runs from two places —
// AuthContext.signOut and authService.logout — and both must suppress the
// "your session expired" message that SIGNED_OUT would otherwise trigger.
let intentionalSignOut = false

/** Marks the sign-out about to happen as user-initiated. */
export function beginIntentionalSignOut(): void {
  intentionalSignOut = true
}

/** Clears the user-initiated marker once sign-out has settled. */
export function endIntentionalSignOut(): void {
  intentionalSignOut = false
}

/** True while a user-initiated sign-out is in flight. */
export function isIntentionalSignOut(): boolean {
  return intentionalSignOut
}

/** Records why the user was signed out. Tab-scoped: the message is only for this navigation. */
export function setForcedLogoutReason(reason: string): void {
  if (!isBrowser) return
  try {
    sessionStorage.setItem(FORCED_LOGOUT_KEY, reason)
  } catch {
    // ignore
  }
}

/** Reads and clears the reason, so it is shown exactly once. */
export function takeForcedLogoutReason(): string | null {
  if (!isBrowser) return null
  try {
    const reason = sessionStorage.getItem(FORCED_LOGOUT_KEY)
    if (reason) sessionStorage.removeItem(FORCED_LOGOUT_KEY)
    return reason
  } catch {
    return null
  }
}
