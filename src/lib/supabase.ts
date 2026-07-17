/**
 * @file supabase.ts
 * @description Configures and exports a singleton client instance for Supabase Database, Auth, Realtime,
 * and Storage services. Adapts session authentication storage to use sessionStorage by default for security,
 * and configures concurrency locks safe for multiple browser contexts (Firefox private / Brave).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SUPABASE] Missing Supabase env vars. Expected VITE_SUPABASE_* or SUPABASE_* in your env file.'
  )
}

// Prevent Vite HMR from creating multiple GoTrueClient instances.
// Each re-evaluation of this module during development would otherwise
// spin up a new auth client, triggering the "Multiple GoTrueClient instances"
// warning and causing undefined session behavior.
declare global {
  /** Singleton caching pointer on the global/window context object to support HMR without multiple clients */
  var __supabase_singleton__: SupabaseClient | undefined
}

// Use sessionStorage for auth tokens so the JWT is not accessible across tabs
// and is automatically cleared when the browser session ends.
// Trade-off: users must re-login after closing the tab. If persistent login is
// required, revert to the default (localStorage) storage.
const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

const sessionStorageAdapter = {
  getItem: (key: string) => (isBrowser ? sessionStorage.getItem(key) : null),
  setItem: (key: string, value: string) =>
    isBrowser ? sessionStorage.setItem(key, value) : undefined,
  removeItem: (key: string) => (isBrowser ? sessionStorage.removeItem(key) : undefined),
}

/**
 * Singleton client instance for interacting with Supabase Backend services.
 */
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
