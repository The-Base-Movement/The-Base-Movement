-- Add `countries` (distinct member countries) to the anon-safe public stats RPC so
-- the public Impact page can show "Countries reached" without reading member rows
-- (donations/users RLS blocks anon direct reads). Backward-compatible: existing
-- consumers ignore the new key.

create or replace function public.get_public_stats()
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  ghana_count     bigint := 0;
  diaspora_count  bigint := 0;
  chapters_count  bigint := 0;
  regions_count   bigint := 0;
  countries_count bigint := 0;
begin
  select count(*) into ghana_count
  from users
  where lower(platform) = 'ghana'
    and (status in ('Active','Approved','Verified') or verification_status in ('Approved','Verified'));

  select count(*) into diaspora_count
  from users
  where lower(platform) = 'diaspora'
    and (status in ('Active','Approved','Verified') or verification_status in ('Approved','Verified'));

  select count(*) into chapters_count from chapters;
  select count(*) into regions_count  from ghana_regions;

  select count(distinct upper(trim(country))) into countries_count
  from users
  where deleted_at is null and country is not null and trim(country) <> '';

  return json_build_object(
    'members',   ghana_count,
    'diaspora',  diaspora_count,
    'chapters',  chapters_count,
    'regions',   coalesce(nullif(regions_count, 0), 16),
    'countries', countries_count
  );
end;
$function$;
