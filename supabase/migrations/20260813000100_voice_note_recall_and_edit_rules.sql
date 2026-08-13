-- Recalling a voice note must drop the audio reference immediately, not just the
-- text. Clearing audio_url also revokes playback at once, because the storage
-- select policy only grants access to files a readable message still points at.
-- The orphaned object is swept by the nightly purge.
--
-- A voice note has no text to edit, so editing one is rejected outright rather
-- than letting an author graft written words onto a recording.

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

  if new.recalled_at is distinct from old.recalled_at then
    if not is_sender then
      raise exception 'Only the author may recall a message';
    end if;
    if old.recalled_at is not null then
      raise exception 'A recalled message cannot be restored';
    end if;
    new.content := '';
    new.audio_url := null;
  elsif new.content is distinct from old.content then
    if not is_sender then
      raise exception 'Only the author may edit a message';
    end if;
    if old.recalled_at is not null then
      raise exception 'A recalled message cannot be edited';
    end if;
    if old.audio_duration_seconds is not null then
      raise exception 'A voice note cannot be edited';
    end if;
    if old.created_at < now() - interval '15 minutes' then
      raise exception 'Messages can only be edited within 15 minutes of sending';
    end if;
    new.edited_at := now();
  end if;

  if new.is_deleted is distinct from old.is_deleted
     and not (is_sender or is_moderator) then
    raise exception 'Only the author or a moderator may delete a message';
  end if;

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
    new.reply_to_id     := old.reply_to_id;
    new.edited_at       := old.edited_at;
    new.audio_duration_seconds := old.audio_duration_seconds;
  end if;

  -- Only the author or a moderator may detach the audio.
  if new.audio_url is distinct from old.audio_url
     and not (is_sender or is_moderator) then
    new.audio_url := old.audio_url;
  end if;

  if not (is_sender or is_moderator) then
    new.deleted_by := old.deleted_by;
    new.deleted_at := old.deleted_at;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_update_scope() from public, anon, authenticated;
