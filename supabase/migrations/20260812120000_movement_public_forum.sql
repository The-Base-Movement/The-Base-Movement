-- Movement-wide public forum
-- ---------------------------------------------------------------------------
-- Adds a single open forum every approved member can read and post in, reusing
-- the existing group-conversation machinery (conversations + group_conversation_members).
--
-- Also closes three defects that are survivable in a constituency forum but not
-- in a room holding every member:
--   1. messages UPDATE let any co-member rewrite/delete anyone else's message
--   2. read_at is shared state, so one reader marked a group thread read for all
--   3. no server-side rate limit on group posts

-- 1. Allow the movement scope -------------------------------------------------

alter table public.conversations drop constraint conversations_group_type_check;
alter table public.conversations add constraint conversations_group_type_check
  check (group_type = any (array['constituency','chapter','movement']));

alter table public.conversations drop constraint conversations_scope_type_check;
alter table public.conversations add constraint conversations_scope_type_check
  check (scope_type = any (array[
    'region','constituency','chapter','department',
    'group_constituency','group_chapter','group_movement'
  ]));

-- Exactly one movement forum, forever. group_id stays NULL (there is no group
-- entity behind it), which also means the client insert policy — whose group
-- branch requires group_id IS NOT NULL — can never forge a second one.
create unique index if not exists conversations_one_movement_forum
  on public.conversations ((true)) where group_type = 'movement';

-- 2. Seed the forum -----------------------------------------------------------

insert into public.conversations (member_id, leader_id, scope_type, scope_value, group_type, group_id)
select null,
       (select id from public.admins where role in ('ORGANIZER','EXECUTIVE') order by role limit 1),
       'group_movement', 'The Base Movement', 'movement', null
where exists (select 1 from public.admins where role in ('ORGANIZER','EXECUTIVE'))
on conflict do nothing;

-- 3. Per-user read state ------------------------------------------------------
-- read_at on messages is a single shared column, so in a group thread the first
-- reader marked it read for everyone. Track it per membership instead.

alter table public.group_conversation_members
  add column if not exists last_read_at timestamptz;

-- 4. Only approved members may join a group conversation ----------------------

drop policy if exists group_conversation_members_insert on public.group_conversation_members;
create policy group_conversation_members_insert on public.group_conversation_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.status = 'open' and c.group_type is not null
    )
    and exists (
      select 1 from public.users u
      where u.id = (select auth.uid()) and u.status in ('Active','Approved')
    )
  );

-- Members need to see who else is in the room (author attribution, member list).
drop policy if exists group_conversation_members_select on public.group_conversation_members;
create policy group_conversation_members_select on public.group_conversation_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or is_admin()
    or exists (
      select 1 from public.group_conversation_members mine
      where mine.conversation_id = group_conversation_members.conversation_id
        and mine.user_id = (select auth.uid())
    )
  );

-- Members update their own last_read_at.
drop policy if exists group_conversation_members_update on public.group_conversation_members;
create policy group_conversation_members_update on public.group_conversation_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 5. Admins can read messages, so moderation queues actually return rows ------

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.member_id = (select auth.uid())
          or c.leader_id = (select auth.uid())
          or exists (
            select 1 from public.group_conversation_members gcm
            where gcm.conversation_id = messages.conversation_id
              and gcm.user_id = (select auth.uid())
          )
        )
    )
  );

-- 6. Column-level guard on message UPDATE ------------------------------------
-- The row-level policy stays permissive (any participant) because marking read
-- and flagging both need to touch other people's rows. RLS cannot express
-- "which columns", so a trigger does that half. Without this, any member of a
-- group conversation could rewrite or delete any other member's message.

create or replace function public.enforce_message_update_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor uuid := auth.uid();
  is_sender boolean := actor = old.sender_id;
  is_moderator boolean;
begin
  if actor is null or is_admin() then
    return new;  -- service_role / edge functions / staff
  end if;

  select exists (
    select 1 from public.group_conversation_members gcm
    where gcm.conversation_id = old.conversation_id
      and gcm.user_id = actor
      and gcm.role = 'moderator'
  ) into is_moderator;

  -- Content is the author's alone.
  if new.content is distinct from old.content and not is_sender then
    raise exception 'Only the author may edit a message';
  end if;

  -- Removal is the author's or a moderator's.
  if new.is_deleted is distinct from old.is_deleted
     and not (is_sender or is_moderator) then
    raise exception 'Only the author or a moderator may delete a message';
  end if;

  -- Everything else on the row is immutable to non-authors; participants keep
  -- read_at, is_flagged and flagged_reason so read receipts and reporting work.
  if not is_sender then
    new.conversation_id := old.conversation_id;
    new.sender_id       := old.sender_id;
    new.sender_type     := old.sender_type;
    new.created_at      := old.created_at;
    new.expires_at      := old.expires_at;
  end if;

  if not (is_sender or is_moderator) then
    new.deleted_by := old.deleted_by;
    new.deleted_at := old.deleted_at;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_message_update_scope on public.messages;
create trigger enforce_message_update_scope
  before update on public.messages
  for each row execute function public.enforce_message_update_scope();

-- 7. Server-side rate limit on group posts ------------------------------------
-- checkCanSendMessage() in the client only throttles 1-to-1 threads, and client
-- checks are bypassable anyway. An open room with ~10k members needs this in the DB.

create or replace function public.enforce_group_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  recent integer;
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if not exists (
    select 1 from public.conversations c
    where c.id = new.conversation_id and c.group_type is not null
  ) then
    return new;
  end if;

  select count(*) into recent
  from public.messages m
  where m.conversation_id = new.conversation_id
    and m.sender_id = new.sender_id
    and m.created_at > now() - interval '60 seconds';

  if recent >= 5 then
    raise exception 'Slow down — you can send up to 5 messages per minute in a forum';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_group_message_rate_limit on public.messages;
create trigger enforce_group_message_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_group_message_rate_limit();

-- 8. Indexes for forum-sized reads -------------------------------------------

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc)
  where is_deleted is not true;
