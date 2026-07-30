import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retry_after_sec: number
}

export async function checkPersistentRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
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
      console.warn('[RATE-LIMIT] RPC call error:', error)
      return { allowed: true, remaining: 1, retry_after_sec: 0 }
    }

    return data as RateLimitResult
  } catch (e) {
    console.error('[RATE-LIMIT] unexpected error:', e)
    return { allowed: true, remaining: 1, retry_after_sec: 0 }
  }
}
