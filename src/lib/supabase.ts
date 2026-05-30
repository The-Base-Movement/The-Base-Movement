import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SUPABASE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file.'
  )
}

// Prevent Vite HMR from creating multiple GoTrueClient instances.
// Each re-evaluation of this module during development would otherwise
// spin up a new auth client, triggering the "Multiple GoTrueClient instances"
// warning and causing undefined session behavior.
declare global {
  var __supabase_singleton__: SupabaseClient | undefined
}

// Use sessionStorage for auth tokens so the JWT is not accessible across tabs
// and is automatically cleared when the browser session ends.
// Trade-off: users must re-login after closing the tab. If persistent login is
// required, revert to the default (localStorage) storage.
const sessionStorageAdapter = {
  getItem: (key: string) => sessionStorage.getItem(key),
  setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
  removeItem: (key: string) => sessionStorage.removeItem(key),
}

export const supabase = (globalThis.__supabase_singleton__ ??= createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: sessionStorageAdapter,
      // Some browsers (Brave, Firefox private mode) return null from
      // navigator.locks.request() — violating the LockManager spec and
      // causing a console warning from gotrue-js. Use ifAvailable so we
      // never block on a null lock, and fall back gracefully.
      lock: async (name, _timeout, fn) => {
        if (typeof navigator !== 'undefined' && navigator.locks) {
          try {
            return await navigator.locks.request(name, { ifAvailable: true }, async (lock) =>
              lock ? fn() : fn()
            )
          } catch {
            return fn()
          }
        }
        return fn()
      },
    },
  }
))
