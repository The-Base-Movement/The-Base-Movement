/**
 * @file sessionStore.ts
 * @description sessionStore — thin wrapper over sessionStorage for user profile UI data.
 *
 * Security rationale:
 *   localStorage persists indefinitely and is shared across tabs. Storing
 *   display data (userName, userRegNo, etc.) there means the previous user's
 *   identity lingers after logout on shared devices, and any XSS payload can
 *   enumerate all keys across every past session.
 *
 *   sessionStorage is tab-scoped and cleared when the tab closes, limiting
 *   the exposure window. It is NOT a substitute for httpOnly cookies — but
 *   for a pure SPA it is the most practical hardening available without a
 *   server layer.
 *
 * Migration strategy:
 *   getItem() transparently migrates existing localStorage values on first
 *   read, then removes them from localStorage so they are not accessible
 *   to future scripts that still call localStorage.getItem() directly.
 */

const UI_KEYS = [
  'isLoggedIn',
  'userName',
  'userEmail',
  'userAvatar',
  'userPlatform',
  'userRegNo',
  'userToken',
] as const

type UIKey = (typeof UI_KEYS)[number]

function isUIKey(key: string): key is UIKey {
  return (UI_KEYS as readonly string[]).includes(key)
}

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

/**
 * Tab-scoped session storage utility wrapper.
 * Encapsulates secure migration strategies from localStorage to sessionStorage
 * and handles clearing profile settings upon user logout.
 */
export const sessionStore = {
  /**
   * Retrieves a value from sessionStorage, migrating it from localStorage if not present.
   *
   * @param key - The cache storage key to query
   * @returns String value of item, or null if key does not exist.
   */
  getItem(key: string): string | null {
    if (!isBrowser) return null
    const fromSession = sessionStorage.getItem(key)
    if (fromSession !== null) return fromSession

    // One-time migration: pull from localStorage and move to sessionStorage
    if (isUIKey(key)) {
      const fromLocal = localStorage.getItem(key)
      if (fromLocal !== null) {
        sessionStorage.setItem(key, fromLocal)
        localStorage.removeItem(key)
        return fromLocal
      }
    }

    return null
  },

  /**
   * Caches a value in sessionStorage, removing any duplicates in localStorage.
   *
   * @param key - Storage key
   * @param value - String value to store
   */
  setItem(key: string, value: string): void {
    if (!isBrowser) return
    sessionStorage.setItem(key, value)
    // Ensure the same key in localStorage is removed so nothing reads stale data
    if (isUIKey(key)) localStorage.removeItem(key)
  },

  /**
   * Deletes a key from both sessionStorage and localStorage.
   *
   * @param key - Storage key to remove
   */
  removeItem(key: string): void {
    if (!isBrowser) return
    sessionStorage.removeItem(key)
    if (isUIKey(key)) localStorage.removeItem(key)
  },

  /**
   * Scrubs all predefined UI/auth keys from both storage stores.
   * Typically executed during user sign-out.
   */
  clearAll(): void {
    if (!isBrowser) return
    UI_KEYS.forEach((key) => {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    })
  },
}
