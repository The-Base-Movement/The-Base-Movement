-- Raising a flag stays open to any participant — that is the reporting mechanism.
-- Clearing one is a moderation decision: without this, a member could un-flag their
-- own reported message (or anyone else's) before a moderator saw the queue.

create or replace function public.enforce_message_update_scope()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor uuid := auth.uid();
  is_sender boolean := auth.uid() = old.sender_id;
  is_moderator boolean;
begin
  if actor is null or is_admin() then
    return new;
  end if;

  select exists (
    select 1 from public.group_conversation_members gcm
    where gcm.conversation_id = old.conversation_id
      and gcm.user_id = actor
      and gcm.role = 'moderator'
  ) into is_moderator;

  if new.content is distinct from old.content and not is_sender then
    raise exception 'Only the author may edit a message';
  end if;

  if new.is_deleted is distinct from old.is_deleted
     and not (is_sender or is_moderator) then
    raise exception 'Only the author or a moderator may delete a message';
  end if;

  -- Anyone may raise a flag; only a moderator may take one down.
  if coalesce(old.is_flagged, false) and not coalesce(new.is_flagged, false)
     and not is_moderator then
    raise exception 'Only a moderator may clear a report';
  end if;

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

revoke all on function public.enforce_message_update_scope() from public, anon, authenticated;
