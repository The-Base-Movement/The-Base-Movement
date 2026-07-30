-- ============================================================================
-- Migration: Atomic Database Rate Limiter & Emergency OTP Invalidation
-- ============================================================================

-- 1. Create persistent rate limit tracking table with explicit Primary Key
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

-- 2. Fully Atomic Rate Limit Checker using INSERT ... ON CONFLICT
CREATE OR REPLACE FUNCTION public.check_rate_limit(
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
  v_expires_at timestamp with time zone := v_now + (p_window_seconds || ' seconds')::interval;
  v_rec public.rate_limits%ROWTYPE;
  v_retry_after integer := 0;
BEGIN
  -- Single atomic UPSERT using INSERT ... ON CONFLICT
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
    END
  RETURNING * INTO v_rec;

  IF v_rec.attempts > p_max_attempts THEN
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_rec.expires_at - v_now))::integer);
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after_sec', v_retry_after);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(0, p_max_attempts - v_rec.attempts), 'retry_after_sec', 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- 3. Emergency Invalidation of All Existing Active OTPs
UPDATE public.password_reset_otps
SET used = true
WHERE used = false;

-- 4. Register Migration in schema_migrations
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260730200000', '20260730200000_atomic_rate_limiter_and_otp_invalidation')
ON CONFLICT (version) DO NOTHING;
