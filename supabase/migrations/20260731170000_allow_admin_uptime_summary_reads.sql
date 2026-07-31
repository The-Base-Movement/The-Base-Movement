drop policy if exists "Admins can read site uptime checks" on public.site_uptime_checks;

create policy "Admins can read site uptime checks"
  on public.site_uptime_checks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admins
      where admins.id = auth.uid()
    )
  );
