-- Enable constituency leaders to manage their own constituency's activities and
-- announcements (ConstituencyHub), without letting any member write. Writes were
-- previously deny-all (no policies). Gate them on admin OR being a recorded
-- leader of that specific constituency.

create or replace function public.is_constituency_leader(p_constituency_id integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from constituency_leaders cl
    where cl.constituency_id = p_constituency_id
      and cl.member_id = auth.uid()
  )
$$;

grant execute on function public.is_constituency_leader(integer) to authenticated;

-- constituency_activities --------------------------------------------------
create policy "constituency_activities_insert" on public.constituency_activities
  for insert to authenticated
  with check (is_admin() or is_constituency_leader(constituency_id));

create policy "constituency_activities_update" on public.constituency_activities
  for update to authenticated
  using (is_admin() or is_constituency_leader(constituency_id))
  with check (is_admin() or is_constituency_leader(constituency_id));

create policy "constituency_activities_delete" on public.constituency_activities
  for delete to authenticated
  using (is_admin() or is_constituency_leader(constituency_id));

-- constituency_announcements ----------------------------------------------
create policy "constituency_announcements_insert" on public.constituency_announcements
  for insert to authenticated
  with check (is_admin() or is_constituency_leader(constituency_id));

create policy "constituency_announcements_update" on public.constituency_announcements
  for update to authenticated
  using (is_admin() or is_constituency_leader(constituency_id))
  with check (is_admin() or is_constituency_leader(constituency_id));

create policy "constituency_announcements_delete" on public.constituency_announcements
  for delete to authenticated
  using (is_admin() or is_constituency_leader(constituency_id));
