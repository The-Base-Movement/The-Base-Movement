-- ============================================================================
-- Migration: Split rate-limit into peek (read-only) + record (increment-only)
-- Fixes double-counting: gate check incremented, then failure incremented again.
-- ============================================================================

-- 1. Read-only rate-limit check — does NOT increment the counter.
--    Returns the same shape as check_rate_limit so callers can gate on it.
CREATE OR REPLACE FUNCTION public.peek_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_now timestamp with time zone := now();
  v_rec public.rate_limits%ROWTYPE;
  v_retry_after integer := 0;
BEGIN
  SELECT * INTO v_rec
  FROM public.rate_limits
  WHERE key = p_key;

  -- No row yet → definitely allowed
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_attempts, 'retry_after_sec', 0);
  END IF;

  -- Window expired → effectively reset, allowed
  IF v_rec.expires_at <= v_now THEN
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_attempts, 'retry_after_sec', 0);
  END IF;

  -- Window still active — check count
  IF v_rec.attempts >= p_max_attempts THEN
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_rec.expires_at - v_now))::integer);
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after_sec', v_retry_after);
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', GREATEST(0, p_max_attempts - v_rec.attempts),
    'retry_after_sec', 0
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.peek_rate_limit(text, integer, integer) TO service_role;


-- 2. Increment-only — records exactly one failed attempt.
--    Uses the same atomic UPSERT as check_rate_limit but is called
--    only on confirmed failure, never as a gate check.
CREATE OR REPLACE FUNCTION public.record_failed_attempt(
  p_key text,
  p_window_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_now timestamp with time zone := now();
  v_expires_at timestamp with time zone := v_now + (p_window_seconds || ' seconds')::interval;
BEGIN
  INSERT INTO public.rate_limits (key, attempts, window_start, expires_at)
  VALUES (p_key, 1, v_now, v_expires_at)
  ON CONFLICT (key) DO UPDATE
  SET
    attempts = CASE
      WHEN public.rate_limits.expires_at <= v_now THEN 1
      ELSE public.rate_limits.attempts + 1
    END,
    window_start = CASE
      WHEN public.rate_limits.expires_at <= v_now THEN v_now
      ELSE public.rate_limits.window_start
    END,
    expires_at = CASE
      WHEN public.rate_limits.expires_at <= v_now THEN v_expires_at
      ELSE public.rate_limits.expires_at
    END;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_failed_attempt(text, integer) TO service_role;
