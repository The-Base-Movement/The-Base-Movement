-- RLS hardening: several internal/operational tables had a permissive
-- `USING (true)` SELECT policy that exposed them to every authenticated member
-- (or to anon). They are only ever read by admin pages, so scope reads to
-- is_admin() (any row in admins — covers SUPER_ADMIN, FOUNDER, EXECUTIVE,
-- IT_MANAGER, FINANCE_OFFICER). Writes/other policies are left untouched.
--
-- Verified no member-facing or public code reads these tables:
--   national_sentiment_intelligence → only pollService.getPollStats (admin Polls)
--   it_* tables                     → only src/pages/admin/it/*
--   broadcasts                      → only tacticalService.getBroadcasts (admin)

-- national_sentiment_intelligence: was public (anon) readable.
drop policy if exists "Anyone can view national sentiment" on public.national_sentiment_intelligence;
create policy "Admins can view national sentiment" on public.national_sentiment_intelligence
  for select to authenticated using (is_admin());

-- IT department tables: were readable by any authenticated member.
drop policy if exists "it_security_protocols: authenticated read" on public.it_security_protocols;
create policy "it_security_protocols: admin read" on public.it_security_protocols
  for select to authenticated using (is_admin());

drop policy if exists "it_notes: authenticated read" on public.it_notes;
create policy "it_notes: admin read" on public.it_notes
  for select to authenticated using (is_admin());

drop policy if exists "it_note_comments: authenticated read" on public.it_note_comments;
create policy "it_note_comments: admin read" on public.it_note_comments
  for select to authenticated using (is_admin());

drop policy if exists "it_projects: authenticated read" on public.it_projects;
create policy "it_projects: admin read" on public.it_projects
  for select to authenticated using (is_admin());

drop policy if exists "it_todos: authenticated read" on public.it_todos;
create policy "it_todos: admin read" on public.it_todos
  for select to authenticated using (is_admin());

drop policy if exists "it_hierarchy: authenticated read" on public.it_hierarchy;
create policy "it_hierarchy: admin read" on public.it_hierarchy
  for select to authenticated using (is_admin());

-- broadcasts: policy was granted to PUBLIC (anon). Only admins read it.
drop policy if exists "Member view broadcasts" on public.broadcasts;
create policy "Admins can view broadcasts" on public.broadcasts
  for select to authenticated using (is_admin());
