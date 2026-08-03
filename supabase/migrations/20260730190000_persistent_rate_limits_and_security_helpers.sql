-- ============================================================================
-- Migration: Persistent Database Rate Limiter & Security Helper Hardening
-- ============================================================================

-- 1. Create persistent rate limit tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

-- 2. Atomic Persistent Rate Limit Checker Function
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
  v_rec public.rate_limits%ROWTYPE;
  v_retry_after integer := 0;
BEGIN
  DELETE FROM public.rate_limits
  WHERE key = p_key AND expires_at <= v_now;

  SELECT * INTO v_rec FROM public.rate_limits WHERE key = p_key;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (key, attempts, window_start, expires_at)
    VALUES (p_key, 1, v_now, v_now + (p_window_seconds || ' seconds')::interval);

    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_attempts - 1, 'retry_after_sec', 0);
  END IF;

  IF v_rec.attempts >= p_max_attempts THEN
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_rec.expires_at - v_now))::integer);
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'retry_after_sec', v_retry_after);
  END IF;

  UPDATE public.rate_limits
  SET attempts = attempts + 1
  WHERE key = p_key;

  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_attempts - (v_rec.attempts + 1), 'retry_after_sec', 0);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- 3. Update is_founder_or_super_admin() function with SET search_path = '' and fully qualified objects
CREATE OR REPLACE FUNCTION public.is_founder_or_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE a.id = (SELECT auth.uid())
      AND a.role IN ('SUPER_ADMIN', 'FOUNDER')
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_founder_or_super_admin() TO authenticated, service_role;

-- 4. Record migrations in supabase_migrations.schema_migrations
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260730180000', '20260730180000_harden_admin_and_chapter_rls')
ON CONFLICT (version) DO NOTHING;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20260730190000', '20260730190000_persistent_rate_limits_and_security_helpers')
ON CONFLICT (version) DO NOTHING;
