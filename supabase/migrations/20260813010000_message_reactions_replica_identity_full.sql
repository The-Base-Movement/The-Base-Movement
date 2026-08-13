-- Realtime DELETE payloads carry only the primary key under the default replica
-- identity, so Supabase cannot evaluate the RLS policy for a removal and does not
-- deliver the event to other viewers. A reaction someone took back would stay on
-- everyone else's screen until an unrelated insert happened to trigger a refetch.
--
-- FULL puts the whole old row in the WAL record, which is what the policy needs.
-- The row is four small columns, so the extra WAL volume is negligible.

alter table public.message_reactions replica identity full;
