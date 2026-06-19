-- Members log out by flipping is_current on their own session rows; inserts stay
-- service-role only (via the log-member-session edge function). Admins may also
-- update (e.g. to revoke a session). SELECT policy already exists.
create policy "Members can end their own sessions"
on public.member_sessions
for update
to authenticated
using (member_id = (select auth.uid()) or is_admin())
with check (member_id = (select auth.uid()) or is_admin());
