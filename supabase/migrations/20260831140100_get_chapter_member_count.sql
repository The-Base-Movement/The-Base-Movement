-- Single-chapter counterpart to get_chapter_member_counts(), used by the
-- chapter detail page (getChapterById) which only needs one chapter's count.
create or replace function public.get_chapter_member_count(p_chapter_name text)
returns bigint
language sql
security definer
set search_path to 'public'
as $$
  select count(*)::bigint
  from users
  where deleted_at is null and status = 'Active' and chapter = p_chapter_name;
$$;

grant execute on function public.get_chapter_member_count(text) to anon, authenticated;
