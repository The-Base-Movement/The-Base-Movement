/**
 * @file supabase.ts
 * @description Configures and exports a singleton client instance for Supabase Database, Auth, Realtime,
 * and Storage services. Adapts session authentication storage to use sessionStorage by default for security,
 * and configures concurrency locks safe for multiple browser contexts (Firefox private / Brave).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
const missingSupabaseEnvMessage =
  '[SUPABASE] Missing Supabase env vars. Expected VITE_SUPABASE_* or SUPABASE_* in your env file.'

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

// Prevent Vite HMR from creating multiple GoTrueClient instances.
// Each re-evaluation of this module during development would otherwise
// spin up a new auth client, triggering the "Multiple GoTrueClient instances"
// warning and causing undefined session behavior.
declare global {
  /** Singleton caching pointer on the global/window context object to support HMR without multiple clients */
  var __supabase_singleton__: SupabaseClient | undefined
}

// Auth tokens live in localStorage so a single session is shared across tabs.
//
// This replaces a previous sessionStorage adapter. Tab-scoped tokens meant every
// new tab required its own login, and each of those logins could revoke the
// refresh-token family of the tab already open — so an actively-used tab would
// die at its next refresh (~55 min in) with `session_expired / Revoked by Newer
// Login`, entirely independent of whether the user was doing anything.
// Session lifetime is now bounded by the inactivity timers (useInactivityTimeout
// for members, useAdminSessionTimer for admins), which is the intended behaviour:
// log out on idle, not at an arbitrary token boundary.
const localStorageAdapter = {
  getItem: (key: string) => {
    if (!isBrowser) return null
    const fromLocal = localStorage.getItem(key)
    if (fromLocal !== null) return fromLocal

    // One-time migration off the previous sessionStorage adapter, so the deploy
    // that flips this over doesn't sign out everyone who is currently logged in.
    const fromSession = sessionStorage.getItem(key)
    if (fromSession !== null) {
      localStorage.setItem(key, fromSession)
      sessionStorage.removeItem(key)
      return fromSession
    }
    return null
  },
  setItem: (key: string, value: string) =>
    isBrowser ? localStorage.setItem(key, value) : undefined,
  removeItem: (key: string) => {
    if (!isBrowser) return
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

function createMissingSupabaseClient(): SupabaseClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(missingSupabaseEnvMessage)
      },
    }
  ) as SupabaseClient
}

function createSupabaseSingleton(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isBrowser) throw new Error(missingSupabaseEnvMessage)
    return createMissingSupabaseClient()
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: localStorageAdapter,
      // No `lock` option: auth-js coordinates concurrent refreshes itself and the
      // server resolves races, so it deprecated the option outright. The previous
      // custom lock was a no-op anyway (`lock ? fn() : fn()` ran fn either way).
    },
    global: {
      fetch: (url, options) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        if (options?.signal) {
          options.signal.addEventListener('abort', () => controller.abort())
        }

        return fetch(url, { ...options, signal: controller.signal }).finally(() =>
          clearTimeout(timeoutId)
        )
      },
    },
  })
}

/**
 * Singleton client instance for interacting with Supabase Backend services.
 */
export const supabase = (globalThis.__supabase_singleton__ ??= createSupabaseSingleton())
