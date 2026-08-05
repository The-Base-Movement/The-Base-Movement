-- ===========================================================================
-- Status note: trg_enforce_user_network_assignment is NOT active in production
-- Investigated 2026-08-05. This file is documentation plus diagnostics; it
-- makes no changes. Nothing here needs to be run to keep the site working.
-- ===========================================================================
--
-- BACKGROUND
-- Migration 20260711213939_enforce_member_network_assignment created three
-- things: the function public.enforce_user_network_assignment(), a BEFORE
-- INSERT OR UPDATE trigger named trg_enforce_user_network_assignment on
-- public.users, and the view public.admin_member_assignment_issues.
--
-- The function and the view exist in production. The trigger does not. Since
-- the view is created after the trigger in the same migration and the view is
-- present, the migration definitely ran to completion — so the trigger was
-- dropped manually afterwards, outside of migrations.
--
-- WHY IT HAS NOT BEEN RECREATED
-- The trigger raises check_violation on invalid Ghana/Diaspora assignments.
-- As of 2026-08-05, 2,886 existing member rows would violate it:
--
--     invalid_constituency         2,881
--     diaspora_country_is_ghana        3
--     missing_constituency             1
--     invalid_diaspora_chapter         1
--
-- Recreating the trigger today would make any update that touches platform,
-- country, region, constituency or chapter fail for those 2,886 members, which
-- would break admin edits and bulk member imports at scale.
--
-- The 2,881 invalid_constituency rows are almost certainly the known
-- divergence between the EC-derived constituency names and the names in
-- public.ghana_constituencies, not genuinely bad member data.
--
-- PREREQUISITE BEFORE RE-ENABLING
-- Reconcile constituency naming so this view returns (or nearly returns) zero
-- rows. Then recreate the trigger with the statement at the bottom of this
-- file. Do not recreate it before that.
--
-- ===========================================================================

-- Diagnostics -- how big is the backlog, by category?
select issue_code, count(*) as rows
from public.admin_member_assignment_issues
group by issue_code
order by rows desc;

-- The offending rows, worst category first.
-- select registration_number, full_name, platform, country, region,
--        constituency, chapter, issue_code
-- from public.admin_member_assignment_issues
-- order by issue_code, registration_number
-- limit 200;

-- The constituency values that do not match the reference table.
-- select distinct constituency
-- from public.admin_member_assignment_issues
-- where issue_code = 'invalid_constituency'
-- order by constituency;

-- ===========================================================================
-- ONLY after the backlog above is cleared: re-enable the guard.
-- ===========================================================================
-- drop trigger if exists trg_enforce_user_network_assignment on public.users;
-- create trigger trg_enforce_user_network_assignment
--   before insert or update of platform, country, region, constituency, chapter
--   on public.users
--   for each row execute function public.enforce_user_network_assignment();
