-- Anon-safe regional breakdown for the public Impact page.
-- The public site runs as `anon`, which cannot read member rows (RLS), so a
-- SECURITY DEFINER aggregate is the only way to surface live regional engagement
-- without exposing any member PII. Returns region label + member count only.
-- Region casing in users.region is inconsistent, so it is normalised to UPPER(TRIM()).

create or replace function public.get_regional_member_counts()
returns table(region text, member_count bigint)
language sql
security definer
set search_path to 'public'
as $$
  select upper(trim(region)) as region, count(*)::bigint as member_count
  from users
  where deleted_at is null and region is not null and trim(region) <> ''
  group by upper(trim(region));
$$;

revoke all on function public.get_regional_member_counts() from public;
grant execute on function public.get_regional_member_counts() to anon;
grant execute on function public.get_regional_member_counts() to authenticated;
