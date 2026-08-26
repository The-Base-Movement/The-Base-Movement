-- Seven more SECURITY DEFINER RPCs found with zero caller-authorization
-- check, all granted to anon/authenticated. Most notable:
-- admin_lookup_auth_user (auth account lookup/enumeration by email or
-- phone -- returns id/email/phone for any match) and
-- security_posture_summary (a live security scorecard revealing counts
-- of always-true RLS policies, RLS-disabled tables, and anon-executable
-- SECURITY DEFINER functions -- literally confirms to an attacker
-- whether the system currently has known gaps worth probing).
--
-- Confirmed via grep: six of the seven have no frontend caller at all --
-- every legitimate caller is an edge function using
-- SUPABASE_SERVICE_ROLE_KEY (bypasses grants entirely), so anon/
-- authenticated access was unnecessary exposure. get_db_stats is the
-- one exception: itService.ts calls it from an admin page using the
-- admin's own session, so it needs to stay callable by authenticated
-- but gated with is_admin() rather than revoked outright.

REVOKE EXECUTE ON FUNCTION public.admin_lookup_auth_user(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.member_sync_report() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_weekly_password_activity_summary() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.refresh_newsletter_delivery_stats(uuid[]) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.security_posture_summary() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.activity_digest_summary() FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.get_db_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized.' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'db_size_bytes',           pg_database_size(current_database()),
    'public_table_size_bytes', (SELECT coalesce(sum(pg_table_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'),
    'public_index_size_bytes', (SELECT coalesce(sum(pg_indexes_size(c.oid)), 0) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public'),
    'storage_size_bytes',      (SELECT coalesce(sum((metadata->>'size')::bigint), 0) FROM storage.objects),
    'cache_hit_ratio',         coalesce((SELECT round(100 * sum(heap_blks_hit) / nullif(sum(heap_blks_read) + sum(heap_blks_hit), 0), 1) FROM pg_statio_user_tables), 100.0),
    'active_connections',      (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active')
  );
END;
$$;
