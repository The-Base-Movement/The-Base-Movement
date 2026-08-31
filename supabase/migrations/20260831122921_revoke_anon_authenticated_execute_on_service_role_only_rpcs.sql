-- The preceding migration revoked EXECUTE from PUBLIC, but anon and
-- authenticated each had a SEPARATE explicit EXECUTE grant on these functions
-- (not merely inherited via PUBLIC), so they were unaffected by that revoke.
-- Revoking directly from both roles as well -- these RPCs are only ever
-- invoked by edge functions using the service-role key (see previous migration
-- for per-function detail).
REVOKE EXECUTE ON FUNCTION public.categorize_member_engagement() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.peek_rate_limit(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_failed_attempt(text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_ai_scan_rate(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auth_user_exists(uuid) FROM anon, authenticated;
