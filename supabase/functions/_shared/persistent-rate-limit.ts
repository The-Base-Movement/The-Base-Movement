import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retry_after_sec: number
}

/**
 * Invokes the atomic check_rate_limit PostgreSQL RPC.
 * FAILS CLOSED on RPC failure or database error to protect security endpoints.
 */
// deno-lint-ignore no-explicit-any
export async function checkPersistentRateLimit(
  supabaseAdmin: any,
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    })

    if (error || !data) {
      console.error('[RATE-LIMIT] Database RPC error, failing closed:', error)
      return { allowed: false, remaining: 0, retry_after_sec: 60 }
    }

    return data as RateLimitResult
  } catch (e) {
    console.error('[RATE-LIMIT] Unexpected execution error, failing closed:', e)
    return { allowed: false, remaining: 0, retry_after_sec: 60 }
  }
}

/**
 * Read-only gate check — does NOT increment the counter.
 * Use this at the top of a request to decide whether to proceed.
 */
// deno-lint-ignore no-explicit-any
export async function peekRateLimit(
  supabaseAdmin: any,
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('peek_rate_limit', {
      p_key: key,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    })

    if (error || !data) {
      console.error('[RATE-LIMIT] peek_rate_limit RPC error, failing closed:', error)
      return { allowed: false, remaining: 0, retry_after_sec: 60 }
    }

    return data as RateLimitResult
  } catch (e) {
    console.error('[RATE-LIMIT] peek_rate_limit unexpected error, failing closed:', e)
    return { allowed: false, remaining: 0, retry_after_sec: 60 }
  }
}

/**
 * Increment-only — records exactly one failed attempt.
 * Call this only after a confirmed failure (wrong password, bad OTP, etc.).
 */
// deno-lint-ignore no-explicit-any
export async function recordFailedAttempt(
  supabaseAdmin: any,
  key: string,
  windowSeconds: number
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('record_failed_attempt', {
      p_key: key,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error('[RATE-LIMIT] record_failed_attempt RPC error:', error)
    }
  } catch (e) {
    console.error('[RATE-LIMIT] record_failed_attempt unexpected error:', e)
  }
}
