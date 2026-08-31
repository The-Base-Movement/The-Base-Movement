-- get_unprovisioned_member_ids() returns members' phone numbers and emails with
-- no internal authorization check (SECURITY DEFINER, bypasses the RLS gap that
-- public.users deliberately has no anon SELECT for). It is only ever called by
-- the backfill-auth edge function using the service-role key. EXECUTE had been
-- left granted to PUBLIC (the Postgres default), making it callable directly
-- by anon/authenticated via .rpc() -- a full PII bypass.
REVOKE EXECUTE ON FUNCTION public.get_unprovisioned_member_ids(integer) FROM PUBLIC;
