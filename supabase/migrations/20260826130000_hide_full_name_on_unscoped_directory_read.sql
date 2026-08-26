-- public_directory_profiles(target_ids) is a public RPC (anon/authenticated)
-- returning full_name, avatar_url, chapter, constituency. When called with
-- target_ids = NULL it returns EVERY member -- confirmed live in production
-- via chapterService/constituencyService, which call it unscoped purely to
-- compute aggregate per-chapter/constituency counts (they only ever read
-- .chapter/.constituency/.avatar_url in that path). Every caller that
-- actually needs .full_name (messagingService, mediaHubService,
-- deviceTrackingService, Messages.tsx) always passes specific target_ids.
--
-- This meant anyone -- via our own frontend's network tab, or a direct
-- REST call -- could scrape a full name + chapter + constituency directory
-- of the entire membership (13,000+ real people in a political movement).
-- Nulling full_name on unscoped reads removes the actual sensitive field
-- with zero functionality cost, since nothing legitimate reads it there.

CREATE OR REPLACE FUNCTION public.public_directory_profiles(target_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  chapter text,
  constituency text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select
    u.id,
    case when target_ids is not null then u.full_name else null end as full_name,
    u.avatar_url,
    u.chapter,
    u.constituency
  from public.users u
  where target_ids is null or u.id = any(target_ids);
$$;
