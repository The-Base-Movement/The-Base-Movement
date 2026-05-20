import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SUPABASE] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (_name, _acquireTimeout, fn) => {
      // navigator.locks is unavailable or non-compliant in some browsers (Brave,
      // Firefox private mode). Fall back to running the function directly so
      // auth token refreshes still work without the LockManager.
      if (typeof navigator !== 'undefined' && navigator.locks) {
        try {
          return await navigator.locks.request(_name, { ifAvailable: true }, async (lock) =>
            lock ? fn() : fn()
          )
        } catch {
          return fn()
        }
      }
      return fn()
    },
  },
})
