-- Voice notes, capped at 60 seconds.
--
-- Storage discipline matters more than the cap here: nothing currently deletes
-- expired messages, so without a purge every note would be kept forever. The
-- audio file is dropped once the message passes expires_at (see the
-- purge-expired-voice-notes function); the row and its duration stay behind so
-- the bubble can say the note expired rather than silently vanishing.

alter table public.messages
  add column if not exists audio_url text,
  add column if not exists audio_duration_seconds smallint
    check (audio_duration_seconds is null
           or (audio_duration_seconds between 1 and 60));

-- A voice note carries no text, so the non-empty check has to yield to it too.
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (
    char_length(content) > 0
    or recalled_at is not null
    or audio_duration_seconds is not null
  );

-- Private bucket. 1 MB is a hard backstop: 60s of Opus at the 24 kbps we request
-- is ~180 KB, so this only catches a browser that ignores the bitrate hint or a
-- deliberately oversized upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes', 'voice-notes', false, 1048576,
  array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/aac']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Members upload only into their own folder.
drop policy if exists voice_notes_insert on storage.objects;
create policy voice_notes_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Readable exactly when the message carrying it is readable: the subquery is
-- itself subject to RLS on messages, so no access rule is duplicated here.
drop policy if exists voice_notes_select on storage.objects;
create policy voice_notes_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and exists (select 1 from public.messages m where m.audio_url = name)
  );

-- Authors can remove their own file; the nightly purge runs as service_role.
drop policy if exists voice_notes_delete on storage.objects;
create policy voice_notes_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
