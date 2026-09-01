-- Follow-up to 20260901180000. The first cut of is_service_role() returned NULL
-- (not false) when there were no JWT claims and no role GUC, because the NULL
-- propagated through the comparison. `NOT is_service_role() AND (...)` then
-- evaluated to NULL, so the IF did not fire and the authorization guard was
-- skipped entirely -- a fail-open in the guard meant to close a fail-open.
--
-- Caught before any non-service caller could reach it; recorded as its own
-- migration so the repo history matches what was applied remotely.
create or replace function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      nullif(current_setting('role', true), 'none')
    ) = 'service_role',
    false
  );
$$;
