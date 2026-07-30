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
