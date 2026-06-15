-- Ballot privacy for chapter polls. chapter_poll_votes had a USING(true) SELECT
-- policy, so any member (and anon) could read every individual vote, including
-- voter_id → candidate_id (who voted for whom). The member chapter page only
-- needs (a) aggregate tallies and (b) the viewer's own votes.
--
-- 1) Aggregate tallies come from a SECURITY DEFINER RPC that returns counts
--    only — never voter_id — so results stay visible without exposing ballots.
-- 2) Raw row reads are then restricted to the voter's own rows (+ admins).

create or replace function public.get_chapter_poll_results(p_poll_ids uuid[])
returns table (poll_id uuid, candidate_id uuid, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select v.poll_id, v.candidate_id, count(*)::bigint as votes
  from chapter_poll_votes v
  where v.poll_id = any(p_poll_ids)
  group by v.poll_id, v.candidate_id;
$$;

grant execute on function public.get_chapter_poll_results(uuid[]) to authenticated;

-- Tighten raw reads: a member sees only their own votes; admins see all. The
-- aggregate RPC above covers everyone's results need. (ChapterDetails lives at
-- /dashboard/chapters/:slug — authenticated only — so anon read is dropped.)
drop policy if exists "chapter_poll_votes_select" on public.chapter_poll_votes;
create policy "chapter_poll_votes_own_select" on public.chapter_poll_votes
  for select to authenticated
  using (voter_id = (select auth.uid()) or is_admin());
