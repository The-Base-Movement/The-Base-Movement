-- RLS follow-ups from the audit.
--
-- (1) Three internal admin tables had `USING (true)` SELECT readable by every
--     authenticated member. All are read only by admin pages
--     (SpendingLedger / role management), so scope reads to is_admin().
-- (2) constituency_activities / constituency_announcements had RLS enabled but
--     ZERO policies (deny-all), which silently breaks the member dashboard
--     pages that read them (/dashboard/constituencies, /dashboard/constituency-hub).
--     Add an authenticated read policy (mirrors chapter_activities /
--     chapter_announcements). Writes are deliberately left deny-all until a
--     constituency-leader scoping model is defined — opening writes without it
--     would let any member post announcements.

-- (1) Tighten admin-only reads ------------------------------------------------
drop policy if exists "Authenticated users can read spending categories" on public.spending_categories;
create policy "spending_categories_admin_select" on public.spending_categories
  for select to authenticated using (is_admin());

drop policy if exists "Authenticated users can read admin roles" on public.admin_roles;
create policy "admin_roles_admin_select" on public.admin_roles
  for select to authenticated using (is_admin());

drop policy if exists "Authenticated users can read admin role permissions" on public.admin_role_permissions;
create policy "admin_role_permissions_admin_select" on public.admin_role_permissions
  for select to authenticated using (is_admin());

-- (2) Restore member read for constituency content ---------------------------
drop policy if exists "constituency_activities_select" on public.constituency_activities;
create policy "constituency_activities_select" on public.constituency_activities
  for select to authenticated using (true);

drop policy if exists "constituency_announcements_select" on public.constituency_announcements;
create policy "constituency_announcements_select" on public.constituency_announcements
  for select to authenticated using (true);
