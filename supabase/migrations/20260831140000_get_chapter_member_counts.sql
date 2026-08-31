-- Public chapter cards need live member counts, but public.users has no
-- public-facing SELECT RLS policy (see get_regional_member_counts for the
-- same pattern used for the Ghana regions map). Without this, the anon/
-- non-admin read in chapterService.getChapters() silently returns zero rows
-- and every chapter card shows "0 members".
create or replace function public.get_chapter_member_counts()
returns table(chapter text, member_count bigint)
language sql
security definer
set search_path to 'public'
as $$
  select chapter, count(*)::bigint as member_count
  from users
  where deleted_at is null and status = 'Active' and chapter is not null and trim(chapter) <> ''
  group by chapter;
$$;

grant execute on function public.get_chapter_member_counts() to anon, authenticated;
