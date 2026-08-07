-- get_public_stats(): add real 30-day growth counts.
--
-- The home "Movement at a glance" cards render a delta line under each stat,
-- and publicSiteService reads members_delta / diaspora_delta from this RPC.
-- Those keys were never returned, so three of the four cards showed a bare
-- trend arrow with no text. The counts themselves were already live.
--
-- Chapters have no created_at column, so no chapter growth delta is possible;
-- that card shows the live chapter count instead.
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  ghana_count     bigint := 0;
  diaspora_count  bigint := 0;
  chapters_count  bigint := 0;
  regions_count   bigint := 0;
  countries_count bigint := 0;
  ghana_delta     bigint := 0;
  diaspora_delta  bigint := 0;
begin
  -- Only fully-verified members are counted publicly.
  select count(*) into ghana_count
  from users
  where lower(platform) = 'ghana'
    and deleted_at is null
    and verification_status in ('Approved','Verified');

  select count(*) into diaspora_count
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified');

  select count(*) into chapters_count from chapters;
  select count(*) into regions_count  from ghana_regions;

  -- Distinct countries among verified DIASPORA members only.
  select count(distinct upper(trim(country))) into countries_count
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and country is not null and trim(country) <> '';

  -- Verified joins in the trailing 30 days, per platform.
  select count(*) into ghana_delta
  from users
  where lower(platform) = 'ghana'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and joined_at >= now() - interval '30 days';

  select count(*) into diaspora_delta
  from users
  where lower(platform) = 'diaspora'
    and deleted_at is null
    and verification_status in ('Approved','Verified')
    and joined_at >= now() - interval '30 days';

  return json_build_object(
    'members',   ghana_count,
    'diaspora',  diaspora_count,
    'chapters',  chapters_count,
    'regions',   coalesce(nullif(regions_count, 0), 16),
    'countries', countries_count,
    'members_delta_30d',  ghana_delta,
    'diaspora_delta_30d', diaspora_delta
  );
end;
$function$;
