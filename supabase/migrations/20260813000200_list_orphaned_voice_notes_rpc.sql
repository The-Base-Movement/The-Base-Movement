-- Orphaned voice-note files: in the bucket, but no live message points at them.
-- Recalls null audio_url immediately (which revokes playback at once), and an
-- upload whose message insert failed leaves a file behind — both land here.
--
-- Doing the set difference in SQL rather than in the edge function keeps the work
-- on one side of the wire; reading storage.objects over REST instead would depend
-- on the storage schema being exposed to PostgREST, and would mean pulling every
-- referenced audio_url across to diff in memory.
--
-- The grace window matters: an upload and its message insert are not atomic, so a
-- brand-new file may legitimately have no row pointing at it for a moment.

create or replace function public.list_orphaned_voice_notes(
  grace_hours integer default 1,
  max_rows integer default 2000
)
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'voice-notes'
    and o.created_at < now() - make_interval(hours => grace_hours)
    and not exists (
      select 1 from public.messages m where m.audio_url = o.name
    )
  order by o.created_at
  limit max_rows
$$;

revoke all on function public.list_orphaned_voice_notes(integer, integer)
  from public, anon, authenticated;
grant execute on function public.list_orphaned_voice_notes(integer, integer) to service_role;
