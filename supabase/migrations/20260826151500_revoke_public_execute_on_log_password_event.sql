-- log_password_event is a SECURITY DEFINER RPC with no caller-authorization
-- check at all, writing directly into password_events_log with fully
-- attacker-controlled p_user_id/p_event_type/p_triggered_by/p_metadata.
-- Anyone (anon or authenticated) could inject fabricated password-event
-- entries -- log poisoning of a table admins rely on for security
-- monitoring (get_weekly_password_activity_summary).
--
-- Confirmed the only legitimate caller is password-reset-webhook, which
-- uses SUPABASE_SERVICE_ROLE_KEY -- service_role bypasses grants
-- entirely, so anon/authenticated access was unnecessary exposure with
-- no legitimate use, same pattern as verify_legacy_password.

REVOKE EXECUTE ON FUNCTION public.log_password_event(uuid, text, text, text, text, text, text, jsonb)
FROM anon, authenticated, public;
