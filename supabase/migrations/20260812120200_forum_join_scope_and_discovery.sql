-- Two problems this fixes:
--
-- 1. conversations_participant_select referenced group_conversation_members directly,
--    so any INSERT into gcm re-entered that policy and tripped Postgres' RLS
--    recursion detector. Nobody could join a forum.
--
-- 2. A member could not SELECT a group conversation until they were already a
--    member of it, but the join itself needed to see the row first. Chicken-and-egg.
--
-- Both are solved by routing membership checks through SECURITY DEFINER helpers so
-- policies never reference the table being written, and by making the join rule
-- explicit about scope: the movement forum is open to every approved member, while
-- constituency/chapter forums stay restricted to their own members.
--
-- Constituency forums are matched on scope_value, not group_id: ghana_constituencies.id
-- is integer while conversations.group_id is uuid, so a constituency id can never be
-- stored there.

create or replace function public.can_join_group_conversation(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.conversations c
    join public.users u on u.id = auth.uid()
    where c.id = conv_id
      and c.status = 'open'
      and c.group_type is not null
      and u.status in ('Active','Approved')
      and (
        c.group_type = 'movement'
        or (c.group_type = 'constituency' and c.scope_value = u.constituency)
        or (c.group_type = 'chapter'
            and c.group_id = (select ch.id from public.chapters ch
                              where ch.name = u.chapter))
      )
  )
$$;

grant execute on function public.can_join_group_conversation(uuid) to authenticated;

drop policy if exists group_conversation_members_insert on public.group_conversation_members;
create policy group_conversation_members_insert on public.group_conversation_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_join_group_conversation(conversation_id)
  );

-- Discovery: the movement forum is visible to every authenticated user so they can
-- join it; other group rooms remain visible only to their existing members.
drop policy if exists conversations_participant_select on public.conversations;
create policy conversations_participant_select on public.conversations
  for select to authenticated
  using (
    is_admin()
    or member_id = (select auth.uid())
    or leader_id = (select auth.uid())
    or group_type = 'movement'
    or public.is_group_conversation_member(id)
  );
