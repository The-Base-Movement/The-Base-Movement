-- Constituency and chapter forums have never worked.
--
-- Two independent causes:
--   1. getOrCreateGroupConversation() wrote ghana_constituencies.id (integer) into
--      conversations.group_id (uuid), so every constituency forum insert failed.
--   2. The lazy-creation path required the constituency/chapter to have a leader_id,
--      but only 1 of 276 constituencies and 0 of 73 chapters have one — so even the
--      chapter path almost never fired.
--
-- Forums are fixed movement infrastructure, not user-generated content, so they are
-- seeded here instead of being created by whichever member happens to log in first.
-- That also removes the duplicate-forum risk entirely: members only ever join.
--
-- Constituency forums key on scope_value (the name) with group_id left NULL, because
-- an integer constituency id cannot live in a uuid column. Names are unique in both
-- ghana_constituencies (276/276) and chapters (73/73).

-- One forum per constituency / per chapter, enforced structurally.
create unique index if not exists conversations_one_forum_per_constituency
  on public.conversations (scope_value) where group_type = 'constituency';

create unique index if not exists conversations_one_forum_per_chapter
  on public.conversations (scope_value) where group_type = 'chapter';

-- Seed constituency forums, falling back to an HQ leader where none is appointed.
insert into public.conversations (member_id, leader_id, scope_type, scope_value, group_type, group_id)
select null,
       coalesce(gc.leader_id,
                (select id from public.admins where role in ('ORGANIZER','EXECUTIVE') order by role limit 1)),
       'group_constituency', gc.name, 'constituency', null
from public.ghana_constituencies gc
where not exists (
  select 1 from public.conversations c
  where c.group_type = 'constituency' and c.scope_value = gc.name
)
and coalesce(gc.leader_id,
             (select id from public.admins where role in ('ORGANIZER','EXECUTIVE') order by role limit 1)) is not null;

-- Seed chapter forums the same way, preserving the one that already exists.
insert into public.conversations (member_id, leader_id, scope_type, scope_value, group_type, group_id)
select null,
       coalesce(ch.leader_id,
                (select id from public.admins where role in ('ORGANIZER','EXECUTIVE') order by role limit 1)),
       'group_chapter', ch.name, 'chapter', ch.id
from public.chapters ch
where not exists (
  select 1 from public.conversations c
  where c.group_type = 'chapter' and c.scope_value = ch.name
)
and coalesce(ch.leader_id,
             (select id from public.admins where role in ('ORGANIZER','EXECUTIVE') order by role limit 1)) is not null;

-- Match chapter forums on scope_value too, so both group types resolve the same way
-- and joining no longer depends on group_id being populated.
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
        or (c.group_type = 'chapter' and c.scope_value = u.chapter)
      )
  )
$$;

revoke all on function public.can_join_group_conversation(uuid) from public, anon;
grant execute on function public.can_join_group_conversation(uuid) to authenticated;
