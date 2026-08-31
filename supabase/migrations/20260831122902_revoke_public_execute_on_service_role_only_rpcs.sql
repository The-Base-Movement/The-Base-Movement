-- categorize_member_engagement() is a parameterless bulk UPDATE over public.users
-- with no internal authorization check, only meant to run from the daily cron
-- edge function (categorize-engagement-daily) via the service-role key.
-- check_rate_limit / peek_rate_limit / record_failed_attempt / bump_ai_scan_rate
-- are internal rate-limiting infra called only from edge functions with the
-- service-role client, never from browser code.
-- auth_user_exists is orphaned (no RLS policy or function references it since
-- 20260826123353_remove_redundant_auth_user_exists_from_users_insert.sql).
-- All had EXECUTE left granted to PUBLIC.
REVOKE EXECUTE ON FUNCTION public.categorize_member_engagement() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.peek_rate_limit(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_failed_attempt(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bump_ai_scan_rate(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_user_exists(uuid) FROM PUBLIC;
