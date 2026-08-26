-- verify_legacy_password(p_identifier, p_plain_password) was a
-- SECURITY DEFINER RPC directly callable by anon/authenticated with
-- ZERO rate limiting -- an unauthenticated password-guessing oracle
-- against the 17,009 real accounts still in legacy_passwords
-- (is_upgraded = false). Confirmed it's fully orphaned: the actual
-- legacy-password check used in production lives entirely inside the
-- phone-login edge function (a different implementation -- scrypt with
-- a diff-threshold match, its own rate limiting via
-- checkPersistentRateLimit/recordFailedAttempt/delay), which never
-- calls this RPC. Nothing in pg_proc or pg_trigger source references
-- it either. Revoking rather than patching in rate limiting, since
-- there's no legitimate caller left to preserve.

REVOKE EXECUTE ON FUNCTION public.verify_legacy_password(text, text) FROM anon, authenticated, public;
