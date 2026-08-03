-- Security advisor remediation (2026-06-16)
--
-- Addresses three real findings from the Supabase security advisor:
--   1. Cron-only SECURITY DEFINER maintenance functions were RPC-executable by
--      anon/authenticated (no internal auth guard) — they could be triggered to
--      delete data. The pg_cron jobs (cleanup-activity-logs, purge-expired-trash)
--      run as the job owner, so scheduled execution is unaffected by the revoke.
--   2. Four sensitive public buckets exposed a broad "list every file" SELECT
--      policy. Public buckets serve objects by direct URL without a SELECT policy,
--      so the listing grant is unnecessary and leaks file enumeration. Restrict it
--      to admins.
--   3. is_leader_role had a role-mutable search_path.

-- 1. Lock down cron-only maintenance functions ------------------------------
-- The default EXECUTE grant is held by PUBLIC, so it must be revoked from PUBLIC
-- (revoking only anon/authenticated leaves the inherited grant intact). Owner and
-- superuser (the pg_cron jobs) keep execute regardless.
revoke execute on function public.delete_old_activity_logs() from public, anon, authenticated;
revoke execute on function public.purge_expired_trash() from public, anon, authenticated;
-- Trigger function; never meant to be invoked directly via RPC.
revoke execute on function public.audit_admin_action() from public, anon, authenticated;

-- 3. Pin search_path on is_leader_role --------------------------------------
alter function public.is_leader_role(p_role text) set search_path = public;

-- 2. Remove broad file-listing on sensitive buckets -------------------------
-- Direct public-URL access (getPublicUrl) keeps working; only enumeration via
-- the list endpoint is removed. App code reads these via URLs stored in tables
-- and never calls .list() on them, so this is transparent to users. Admins keep
-- list access for tooling.
drop policy if exists "Public read resumes" on storage.objects;
create policy "resumes_admin_list" on storage.objects
  for select to authenticated
  using (bucket_id = 'job-resumes' and is_admin());

drop policy if exists "receipts_public_read" on storage.objects;
create policy "receipts_admin_list" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and is_admin());

drop policy if exists "helpdesk_attach_read" on storage.objects;
create policy "helpdesk_attach_admin_list" on storage.objects
  for select to authenticated
  using (bucket_id = 'helpdesk-attachments' and is_admin());

drop policy if exists "it_security_protocols_public_read" on storage.objects;
create policy "it_security_protocols_admin_list" on storage.objects
  for select to authenticated
  using (bucket_id = 'it-security-protocols' and is_admin());
